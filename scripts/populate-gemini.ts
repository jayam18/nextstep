import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
  }
});

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from .env");
  }

  // Get colleges that haven't been enriched yet
  const colleges = await prisma.college.findMany({
    where: {
      studentLifeSnippet: null
    }
  });

  console.log(`Found ${colleges.length} colleges to enrich with Gemini.`);

  // Process in small batches to respect rate limits (15 RPM for free tier = 4 seconds per request)
  let count = 0;
  for (const college of colleges) {
    let success = false;
    let retries = 0;
    
    while (!success && retries < 5) {
      try {
        console.log(`[${count+1}/${colleges.length}] Enriching ${college.name}... (Attempt ${retries + 1})`);
        
        const prompt = `You are a higher education expert. Research and write short, unique, highly engaging summaries for ${college.name} located in ${college.location}. Provide exactly three 2-sentence summaries: one for Student Life, one for Athletics, and one for Campus Safety. Make them highly specific to ${college.name}, avoiding generic filler. Output MUST be valid JSON with exactly these three keys: "studentLifeSnippet", "athleticsSnippet", "safetySnippet".`;
        
        const result = await model.generateContent(prompt);
        const jsonText = result.response.text();
        
        const data = JSON.parse(jsonText);
        
        await prisma.college.update({
          where: { id: college.id },
          data: {
            studentLifeSnippet: data.studentLifeSnippet,
            athleticsSnippet: data.athleticsSnippet,
            safetySnippet: data.safetySnippet
          }
        });
        
        success = true;
        count++;
        // Sleep to respect 15 RPM free limit
        await delay(4500); 
      } catch (e: any) {
        retries++;
        console.error(`Failed to enrich ${college.name}: ${e.message || e}`);
        if (e.status === 429) {
           console.log("Rate limited! Waiting 30 seconds...");
           await delay(30000); // Wait 30 seconds before retrying
        } else {
           await delay(5000); // Standard backoff
        }
      }
    }
  }

  console.log("Enrichment complete!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
