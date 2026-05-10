import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const CIP_NAMES: Record<string, string> = {
  'computer': 'Computer Science',
  'engineering': 'Engineering',
  'business_marketing': 'Business & Finance',
  'biological': 'Biology & Life Sciences',
  'visual_performing': 'Visual & Performing Arts',
  'communication': 'Communications',
  'psychology': 'Psychology',
  'health': 'Health Professions',
  'social_science': 'Social Sciences',
  'mathematics': 'Mathematics',
  'physical_science': 'Physical Sciences',
  'english': 'English Literature',
  'history': 'History',
  'education': 'Education',
};

async function main() {
  const apiKey = process.env.COLLEGE_SCORECARD_API_KEY;
  if (!apiKey) throw new Error("Missing API KEY");

  console.log("Starting Phase 8: Populating Modal Details & Logos...");

  const tsvPath = path.join(__dirname, '../College-List-Top-300.tsv');
  const fileContent = fs.readFileSync(tsvPath, 'utf-8');
  const lines = fileContent.trim().split('\n').slice(1);

  const fields = [
    'school.name',
    'school.school_url',
    'latest.admissions.sat_scores.midpoint.math',
    'latest.admissions.sat_scores.midpoint.critical_reading',
    'latest.admissions.act_scores.midpoint.cumulative',
    ...Object.keys(CIP_NAMES).map(k => `latest.academics.program_percentage.${k}`)
  ].join(',');

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
      let schoolData = data.results && data.results.length > 0 ? data.results[0] : null;
      
      if (!schoolData) {
        const fallbackRes = await fetch(`https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${apiKey}&school.name=${encodeURIComponent(institution)}&fields=${fields}`);
        const fallbackData = await fallbackRes.json();
        if (fallbackData.results && fallbackData.results.length > 0) schoolData = fallbackData.results[0];
      }

      if (schoolData) {
        const apiName = schoolData['school.name'];
        const college = await prisma.college.findFirst({ where: { name: apiName } });
        
        if (college) {
            // 1. Website & Logo
            let website = schoolData['school.school_url'] || null;
            let logoUrl = null;
            if (website) {
                // Ensure starts with http/https
                if (!website.startsWith('http')) website = 'https://' + website;
                try {
                    const urlObj = new URL(website);
                    let domain = urlObj.hostname;
                    if (domain.startsWith('www.')) domain = domain.slice(4);
                    logoUrl = `https://s2.googleusercontent.com/s2/favicons?sz=128&domain=${domain}`;
                } catch(e) {}
            }

            // 2. Test Scores
            const satMath = schoolData['latest.admissions.sat_scores.midpoint.math'] || null;
            const satReading = schoolData['latest.admissions.sat_scores.midpoint.critical_reading'] || null;
            const actComposite = schoolData['latest.admissions.act_scores.midpoint.cumulative'] || null;

            // 3. Top 5 Majors
            const programPercentages: { name: string, pct: number }[] = [];
            for (const [key, name] of Object.entries(CIP_NAMES)) {
                const pct = schoolData[`latest.academics.program_percentage.${key}`] || 0;
                if (pct > 0) programPercentages.push({ name, pct });
            }
            // Sort descending and take top 5
            programPercentages.sort((a, b) => b.pct - a.pct);
            const top5 = programPercentages.slice(0, 5).map(p => `${p.name} (${(p.pct * 100).toFixed(1)}%)`).join(', ');

            // 4. LLM Estimates (GPA, Clubs, Programs)
            // GPA estimator based on acceptance rate
            let avgGpa = 3.5;
            if (college.acceptanceRate < 10) avgGpa = 3.95;
            else if (college.acceptanceRate < 25) avgGpa = 3.85;
            else if (college.acceptanceRate < 50) avgGpa = 3.7;
            else if (college.acceptanceRate < 75) avgGpa = 3.4;

            // Simple LLM Mock Strings
            const topMajorNames = programPercentages.slice(0, 2).map(p => p.name);
            const specialPrograms = `Renowned undergraduate research programs in ${topMajorNames.join(' and ')}, offering exclusive internships and study-abroad tracks.`;
            let clubs = "Over 300 student organizations including Student Government, Debate Society, and pre-professional fraternities.";
            if (college.athleticsVibe === "D1 Powerhouse") clubs += " Massive tailgating culture and competitive intramural leagues.";
            else if (college.athleticsVibe === "Non-Athletic/Artsy") clubs += " Thriving performing arts groups, a cappella, and independent media publications.";

            await prisma.college.update({
              where: { id: college.id },
              data: {
                website,
                logoUrl,
                satMath,
                satReading,
                actComposite,
                topMajors: top5.length > 0 ? top5 : null,
                avgGpa,
                specialPrograms,
                clubs
              }
            });
            
            console.log(`[+] Updated ${apiName}`);
            count++;
        }
      }
    } catch (err) {
      console.error(`Failed processing ${institution}:`, err);
    }
    
    // Respect API rate limits
    await delay(100);
  }
  console.log(`\nFinished updating details for ${count} colleges!`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
