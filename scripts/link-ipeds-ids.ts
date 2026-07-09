import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      let val = trimmed.slice(index + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      } else if (val.startsWith("'") && val.endsWith("'")) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

loadEnv();

function normalizeName(name: string): string {
  // Strip parentheses and contents (e.g. "(MIT)", "(UCLA)")
  let cleaned = name.replace(/\([^)]*\)/g, '');
  // Normalize em dash to hyphen
  cleaned = cleaned.replace(/—/g, '-');
  // Convert to lowercase and remove all non-alphanumeric characters
  cleaned = cleaned.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned;
}

async function main() {
  const apiKey = process.env.COLLEGE_SCORECARD_API_KEY;
  if (!apiKey) throw new Error("Missing COLLEGE_SCORECARD_API_KEY in environment variables");

  console.log("Starting Link IPEDS IDs script with improved name matching...");

  // Load all colleges from DB
  const dbColleges = await prisma.college.findMany();
  console.log(`Loaded ${dbColleges.length} colleges from database.`);

  // Load TSV lines
  const tsvPath = path.join(process.cwd(), 'College-List-Top-300.tsv');
  if (!fs.existsSync(tsvPath)) {
    throw new Error(`TSV file not found at ${tsvPath}`);
  }
  const fileContent = fs.readFileSync(tsvPath, 'utf-8');
  const tsvLines = fileContent.trim().split('\n').slice(1);

  let successCount = 0;
  let failCount = 0;
  const unmatchedColleges: string[] = [];

  for (const college of dbColleges) {
    const dbNormName = normalizeName(college.name);
    
    // Find matching line in TSV
    const matchedLine = tsvLines.find(line => {
      const cols = line.split('\t');
      if (cols.length < 4) return false;
      return normalizeName(cols[1]) === dbNormName;
    });

    let schoolData = null;

    try {
      if (matchedLine) {
        const cols = matchedLine.split('\t');
        const fedCode = cols[3].trim();
        const opeid6 = fedCode.padStart(6, '0');

        // Query by OPEID
        const res = await fetch(`https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${apiKey}&ope6_id=${opeid6}&fields=id,school.name`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            schoolData = data.results[0];
          }
        }
      }

      // Fallback: Query by database name directly if OPEID query failed or returned no results
      if (!schoolData) {
        const searchName = college.name.split('(')[0].trim().replace(/—/g, '-');
        const res = await fetch(`https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${apiKey}&school.name=${encodeURIComponent(searchName)}&fields=id,school.name`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            // Find the closest name match
            const targetNorm = normalizeName(college.name);
            schoolData = data.results.find((s: any) => normalizeName(s['school.name']) === targetNorm) || data.results[0];
          }
        }
      }

      // Hardcoded manual overrides for tricky names
      if (!schoolData) {
        let manualId: number | null = null;
        if (college.name.includes("Purdue University")) {
          manualId = 243780; // Purdue Main Campus
        } else if (college.name.includes("Rutgers University-Camden")) {
          manualId = 186371;
        } else if (college.name.includes("Bloomfield College")) {
          manualId = 183822;
        } else if (college.name.includes("IUPUI")) {
          manualId = 151111; // IUPUI
        } else if (college.name.includes("Stony Brook University")) {
          manualId = 196097; // Stony Brook
        }

        if (manualId) {
          schoolData = { id: manualId, 'school.name': college.name };
        }
      }

      if (schoolData) {
        const ipedsUnitId = Number(schoolData['id']);
        const apiName = schoolData['school.name'];

        await prisma.college.update({
          where: { id: college.id },
          data: { ipedsUnitId }
        });

        console.log(`[+] Linked ${college.name} to IPEDS UnitID: ${ipedsUnitId} (API Name: ${apiName})`);
        successCount++;
      } else {
        console.warn(`[-] Could not find Scorecard match for DB college: "${college.name}"`);
        unmatchedColleges.push(college.name);
        failCount++;
      }
    } catch (err) {
      console.error(`[!] Failed linking ${college.name}:`, err);
      unmatchedColleges.push(college.name);
      failCount++;
    }

    // Rate-limiting delay
    await delay(50);
  }

  console.log(`\nLink IPEDS IDs Summary:`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);

  if (unmatchedColleges.length > 0) {
    console.log('\nUnmatched DB colleges list:');
    console.log(unmatchedColleges.join('\n'));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
