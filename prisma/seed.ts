import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const apiKey = process.env.COLLEGE_SCORECARD_API_KEY;
  if (!apiKey) {
    throw new Error('COLLEGE_SCORECARD_API_KEY is missing in .env. Please provide it before running the seed.');
  }

  console.log('Cleaning database...');
  await prisma.college.deleteMany();

  const tsvPath = path.join(__dirname, '../College-List-Top-300.tsv');
  const fileContent = fs.readFileSync(tsvPath, 'utf-8');
  const lines = fileContent.trim().split('\n').slice(1); // skip header

  console.log(`Found ${lines.length} colleges in TSV to process...`);

  let count = 0;
  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 4) continue;
    
    const institution = cols[1].trim();
    const fedCode = cols[3].trim();
    const opeid6 = fedCode.padStart(6, '0');

    let apiData = null;

    try {
      // 1. Try querying by OPEID6 first (Most accurate)
      const res = await fetch(
        `https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${apiKey}&ope6_id=${opeid6}&fields=school.name,school.city,school.state,latest.admissions.admission_rate.overall,latest.cost.tuition.out_of_state,latest.student.size`
      );
      
      if (!res.ok) {
        console.error(`API Error for ${institution}: ${res.statusText}`);
        continue;
      }

      let data = await res.json();

      // 2. Fallback to name search if OPEID6 fails
      if (!data.results || data.results.length === 0) {
        console.log(`Could not find ${institution} by OPEID ${opeid6}. Trying name fallback...`);
        const fallbackRes = await fetch(
          `https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${apiKey}&school.name=${encodeURIComponent(institution)}&fields=school.name,school.city,school.state,latest.admissions.admission_rate.overall,latest.cost.tuition.out_of_state,latest.student.size`
        );
        data = await fallbackRes.json();
      }

      if (data.results && data.results.length > 0) {
        const schoolData = data.results[0]; // Take the first result

        // Map data safely with fallbacks
        const acceptanceRate = schoolData['latest.admissions.admission_rate.overall'] 
          ? schoolData['latest.admissions.admission_rate.overall'] * 100 
          : 0; // Default if not reported
        
        const tuition = schoolData['latest.cost.tuition.out_of_state'] || 0;
        const students = schoolData['latest.student.size'] || 0;
        const city = schoolData['school.city'] || 'Unknown';
        const state = schoolData['school.state'] || 'Unknown';
        
        const collegeEntry = {
          name: schoolData['school.name'] || institution,
          location: `${city}, ${state}`,
          acceptanceRate: parseFloat(acceptanceRate.toFixed(1)),
          tuition,
          students,
          imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop", // placeholder
          tags: "", // To be populated later
          // Vibe metrics left undefined (they are optional now)
        };

        await prisma.college.create({
          data: collegeEntry,
        });
        
        count++;
        console.log(`[${count}/${lines.length}] Saved ${collegeEntry.name}`);
      } else {
        console.warn(`[!] Skipping ${institution} - No data found in API.`);
      }
      
    } catch (err) {
      console.error(`[!] Failed processing ${institution}:`, err);
    }

    // Rate limiting: 100ms delay between requests
    await delay(100);
  }

  console.log(`\nSeeding completed! Successfully inserted ${count} colleges.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
