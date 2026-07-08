import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const apiKey = process.env.COLLEGE_SCORECARD_API_KEY;
  if (!apiKey) throw new Error("Missing COLLEGE_SCORECARD_API_KEY in environment variables");

  console.log("Starting T1 Populating: In-State / Out-of-State Tuition & Avg Net Price...");

  const tsvPath = path.join(__dirname, '../College-List-Top-300.tsv');
  if (!fs.existsSync(tsvPath)) {
    throw new Error(`TSV file not found at ${tsvPath}`);
  }
  const fileContent = fs.readFileSync(tsvPath, 'utf-8');
  const lines = fileContent.trim().split('\n').slice(1);

  const fields = [
    'id',
    'school.name',
    'school.ownership',
    'latest.cost.tuition.in_state',
    'latest.cost.tuition.out_of_state',
    'latest.cost.avg_net_price.overall'
  ].join(',');

  let count = 0;
  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 4) continue;
    
    const institution = cols[1].trim();
    const fedCode = cols[3].trim();
    const opeid6 = fedCode.padStart(6, '0');

    try {
      // Query by OPEID6 first
      const res = await fetch(`https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${apiKey}&ope6_id=${opeid6}&fields=${fields}`);
      if (!res.ok) {
        console.error(`[-] API request failed for ${institution} (Status: ${res.status})`);
        continue;
      }

      const data = await res.json();
      let schoolData = data.results && data.results.length > 0 ? data.results[0] : null;
      
      // Fallback: Query by school name if OPEID query failed or returned no results
      if (!schoolData) {
        const fallbackRes = await fetch(`https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${apiKey}&school.name=${encodeURIComponent(institution)}&fields=${fields}`);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData.results && fallbackData.results.length > 0) {
            schoolData = fallbackData.results[0];
          }
        }
      }

      if (schoolData) {
        const apiName = schoolData['school.name'];
        const unitId = schoolData['id'];
        
        // Find matching college in database by name
        let college = await prisma.college.findFirst({ where: { name: apiName } });
        if (!college) {
          // Try finding by the TSV name if the API name differs slightly
          college = await prisma.college.findFirst({ where: { name: institution } });
        }

        if (college) {
          const inStateRaw = schoolData['latest.cost.tuition.in_state'];
          const outOfStateRaw = schoolData['latest.cost.tuition.out_of_state'];
          const netPriceRaw = schoolData['latest.cost.avg_net_price.overall'];
          const ownership = schoolData['school.ownership']; // 1 = Public, 2/3 = Private

          let tuitionInState = inStateRaw !== null ? Number(inStateRaw) : null;
          let tuitionOutOfState = outOfStateRaw !== null ? Number(outOfStateRaw) : null;
          let avgNetPrice = netPriceRaw !== null ? Number(netPriceRaw) : null;

          // Handle private colleges or missing values
          const isPrivate = ownership === 2 || ownership === 3;
          
          if (isPrivate) {
            // For private colleges, in-state and out-of-state are the same
            const baseTuition = tuitionInState || tuitionOutOfState || college.tuition;
            tuitionInState = baseTuition;
            tuitionOutOfState = baseTuition;
          } else {
            // Public college fallbacks
            if (tuitionInState === null && tuitionOutOfState !== null) {
              tuitionInState = tuitionOutOfState;
            } else if (tuitionOutOfState === null && tuitionInState !== null) {
              tuitionOutOfState = tuitionInState;
            } else if (tuitionInState === null && tuitionOutOfState === null) {
              tuitionInState = college.tuition;
              tuitionOutOfState = college.tuition;
            }
          }

          // Fallback for net price
          if (avgNetPrice === null) {
            avgNetPrice = college.tuition; // fallback to published tuition if missing
          }

          const tuitionSourceUrl = unitId ? `https://collegescorecard.ed.gov/school/?${unitId}` : 'https://collegescorecard.ed.gov/';
          const tuitionYear = '2023-24'; // Scorecard's latest stable cost year

          await prisma.college.update({
            where: { id: college.id },
            data: {
              tuitionInState,
              tuitionOutOfState,
              avgNetPrice,
              tuitionSourceUrl,
              tuitionYear
            }
          });
          
          console.log(`[+] Updated ${college.name}: In-State: $${tuitionInState}, Out-of-State: $${tuitionOutOfState}, Net Price: $${avgNetPrice}`);
          count++;
        } else {
          console.warn(`[?] Matched Scorecard record but not found in DB: ${apiName} (${institution})`);
        }
      } else {
        console.warn(`[-] Could not find College Scorecard data for: ${institution}`);
        
        // Fallback for DB records with no Scorecard matches
        const college = await prisma.college.findFirst({ where: { name: institution } });
        if (college) {
          await prisma.college.update({
            where: { id: college.id },
            data: {
              tuitionInState: college.tuition,
              tuitionOutOfState: college.tuition,
              avgNetPrice: college.tuition,
              tuitionSourceUrl: 'https://collegescorecard.ed.gov/',
              tuitionYear: '2023-24'
            }
          });
          console.log(`[+] Set fallback tuition values for unmatched college: ${college.name}`);
          count++;
        }
      }
    } catch (err) {
      console.error(`[!] Failed processing ${institution}:`, err);
    }
    
    // Respect API rate limits (100ms delay)
    await delay(100);
  }
  console.log(`\nFinished populating tuition costs for ${count} colleges!`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
