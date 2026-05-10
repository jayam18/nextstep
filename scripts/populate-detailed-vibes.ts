import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const apiKey = process.env.COLLEGE_SCORECARD_API_KEY;
  if (!apiKey) throw new Error("Missing COLLEGE_SCORECARD_API_KEY in .env");

  console.log("Starting Phase 7: Populating Categorical Vibes...");

  const tsvPath = path.join(__dirname, '../College-List-Top-300.tsv');
  const fileContent = fs.readFileSync(tsvPath, 'utf-8');
  const lines = fileContent.trim().split('\n').slice(1);

  let count = 0;
  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 4) continue;
    
    const institution = cols[1].trim();
    const fedCode = cols[3].trim();
    const opeid6 = fedCode.padStart(6, '0');

    try {
      const res = await fetch(`https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${apiKey}&ope6_id=${opeid6}&fields=school.name,school.locale`);
      if (!res.ok) continue;

      const data = await res.json();
      
      let schoolData = data.results && data.results.length > 0 ? data.results[0] : null;
      if (!schoolData) {
        const fallbackRes = await fetch(`https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${apiKey}&school.name=${encodeURIComponent(institution)}&fields=school.name,school.locale`);
        const fallbackData = await fallbackRes.json();
        if (fallbackData.results && fallbackData.results.length > 0) {
            schoolData = fallbackData.results[0];
        }
      }

      if (schoolData) {
        const apiName = schoolData['school.name'];
        const locale = schoolData['school.locale'];

        const college = await prisma.college.findFirst({ where: { name: apiName } });
        
        if (college) {
            let locationVibe = "Suburban";
            if (locale >= 11 && locale <= 13) locationVibe = "Urban";
            else if (locale >= 21 && locale <= 23) locationVibe = "Suburban";
            else if (locale >= 31 && locale <= 33) locationVibe = "College Town";
            else if (locale >= 41 && locale <= 43) locationVibe = "Rural";

            // Heuristics
            let athleticsVibe = "Intramural Focus";
            let socialVibe = "Chill & Alternative";
            let academicVibe = "Collaborative";
            let campusIdentity = "Historic";

            const name = college.name.toLowerCase();
            const isState = name.includes("state") || name.startsWith("university of");
            const isTech = name.includes("technology") || name.includes("polytechnic");
            const isIvy = ["harvard", "yale", "princeton", "columbia", "brown", "dartmouth", "cornell", "pennsylvania"].some(i => name.includes(i));

            // Athletics
            if (college.students > 25000 || isState) athleticsVibe = "D1 Powerhouse";
            else if (isTech || college.students < 4000) athleticsVibe = "Non-Athletic/Artsy";

            // Social
            if (athleticsVibe === "D1 Powerhouse") socialVibe = "Greek Life Heavy";
            else if (isTech) socialVibe = "Quiet";
            else if (isIvy) socialVibe = "Work Hard Play Hard";

            // Academic
            if (isIvy || isTech) academicVibe = "Highly Competitive";
            else if (college.students > 30000) academicVibe = "Pre-Professional";

            // Identity
            if (isTech) campusIdentity = "Modern";
            else if (locationVibe === "Urban" && !isState) campusIdentity = "Activist";

            await prisma.college.update({
              where: { id: college.id },
              data: {
                locationVibe,
                socialVibe,
                athleticsVibe,
                academicVibe,
                campusIdentity
              }
            });
            
            console.log(`[+] Updated ${apiName} -> ${locationVibe}, ${athleticsVibe}`);
            count++;
        }
      }
    } catch (err) {
      console.error(`Failed processing ${institution}:`, err);
    }
    
    // Respect API rate limits
    await delay(100);
  }
  console.log(`\nFinished updating vibes for ${count} colleges!`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
