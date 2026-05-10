import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const apiKey = process.env.COLLEGE_SCORECARD_API_KEY;
  if (!apiKey) throw new Error("Missing COLLEGE_SCORECARD_API_KEY in .env");

  console.log("Starting Phase 6: Populating Relational Career Paths...");

  const tsvPath = path.join(__dirname, '../College-List-Top-300.tsv');
  const fileContent = fs.readFileSync(tsvPath, 'utf-8');
  const lines = fileContent.trim().split('\n').slice(1);

  // Mapping of named degree percentage fields to our clean Career Path names
  const CIP_MAP = {
    'latest.academics.program_percentage.computer': 'Computer Science',
    'latest.academics.program_percentage.engineering': 'Engineering',
    'latest.academics.program_percentage.business_marketing': 'Business & Finance',
    'latest.academics.program_percentage.biological': 'Biology & Life Sciences',
    'latest.academics.program_percentage.visual_performing': 'Visual & Performing Arts',
    'latest.academics.program_percentage.communication': 'Communications',
    'latest.academics.program_percentage.psychology': 'Psychology',
    'latest.academics.program_percentage.health': 'Health Professions',
  };
  
  const fields = ['school.name', ...Object.keys(CIP_MAP)].join(',');

  let count = 0;
  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 4) continue;
    
    const institution = cols[1].trim();
    const fedCode = cols[3].trim();
    const opeid6 = fedCode.padStart(6, '0');

    try {
      const res = await fetch(`https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${apiKey}&ope6_id=${opeid6}&fields=${fields}`);
      if (!res.ok) continue;

      const data = await res.json();
      
      // Fallback name fetch if opeid6 fails (same logic as seed.ts)
      let schoolData = data.results && data.results.length > 0 ? data.results[0] : null;
      if (!schoolData) {
        const fallbackRes = await fetch(`https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${apiKey}&school.name=${encodeURIComponent(institution)}&fields=${fields}`);
        const fallbackData = await fallbackRes.json();
        if (fallbackData.results && fallbackData.results.length > 0) {
            schoolData = fallbackData.results[0];
        }
      }

      if (schoolData) {
        const apiName = schoolData['school.name'];

        // Find college in local DB by exact name match (since seed.ts saved it via apiName)
        const college = await prisma.college.findFirst({ where: { name: apiName } });
        
        if (college) {
            const careerPathsToConnect = [];
            
            // Analyze percentages
            for (const [cipField, careerName] of Object.entries(CIP_MAP)) {
              const percentage = schoolData[cipField] || 0;
              // If >= 10% of graduating class gets a degree in this field
              if (percentage >= 0.10) { 
                careerPathsToConnect.push(careerName);
              }
            }

            if (careerPathsToConnect.length > 0) {
              await prisma.college.update({
                where: { id: college.id },
                data: {
                  careerPaths: {
                    connectOrCreate: careerPathsToConnect.map(name => ({
                      where: { name },
                      create: { name }
                    }))
                  }
                }
              });
              console.log(`[+] Updated ${apiName} -> ${careerPathsToConnect.join(', ')}`);
            } else {
              console.log(`[-] Skipped ${apiName} (No dominant >10% majors in our map)`);
            }
            count++;
        }
      }
    } catch (err) {
      console.error(`Failed processing ${institution}:`, err);
    }
    
    // Respect API rate limits
    await delay(100);
  }
  console.log(`\nFinished checking and connecting career paths for ${count} colleges!`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
