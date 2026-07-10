import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// M1 layer 3: published program rankings, stored as attributed single facts
// (rank + source + link), never as reproduced lists.
//
// Every row below was verified against a primary source (the school's own
// announcement or rankings page) on 2026-07-10. Colleges whose exact 2026
// placement could not be verified against a primary source (e.g. Stanford,
// UC Berkeley) are intentionally absent — do not add ranks from memory.
//
// cipMatch: CIP-4 codes (in preference order) used to attach the ranking to
// one of the college's stored top-10 majors; first match wins. A trailing
// 2-digit entry (e.g. "14") matches any major in that CIP family.

interface RankingSeed {
  collegeName: string;         // exact College.name
  source: string;              // ranking body + list name (display text)
  year: string;
  rank: number;
  scope?: string;
  sourceUrl: string;           // verification/primary source
  cipMatch: string[];
}

const RANKINGS: RankingSeed[] = [
  // ---- MIT (source: MIT News, US News 2025-26 undergraduate rankings) ----
  {
    collegeName: 'Massachusetts Institute of Technology',
    source: 'U.S. News Best Undergraduate Engineering Programs',
    year: '2026', rank: 1, scope: 'national',
    sourceUrl: 'https://news.mit.edu/2025/mit-named-no-2-university-us-news-2025-26-0923',
    cipMatch: ['1419', '1410', '1409', '14'],
  },
  {
    collegeName: 'Massachusetts Institute of Technology',
    source: 'U.S. News Best Undergraduate Computer Science Programs',
    year: '2026', rank: 1, scope: 'national',
    sourceUrl: 'https://news.mit.edu/2025/mit-named-no-2-university-us-news-2025-26-0923',
    cipMatch: ['1107', '1101', '11'],
  },
  {
    collegeName: 'Massachusetts Institute of Technology',
    source: 'U.S. News Best Undergraduate Business Programs',
    year: '2026', rank: 1, scope: 'national (tied with Penn Wharton)',
    sourceUrl: 'https://news.mit.edu/2025/mit-named-no-2-university-us-news-2025-26-0923',
    cipMatch: ['5202', '5213', '52'],
  },

  // ---- Penn (business: Poets&Quants coverage of US News 2026; nursing: Penn Nursing news, QS 2026) ----
  {
    collegeName: 'University of Pennsylvania',
    source: 'U.S. News Best Undergraduate Business Programs (Wharton)',
    year: '2026', rank: 1, scope: 'national (tied with MIT Sloan)',
    sourceUrl: 'https://poetsandquants.com/2025/09/23/u-s-news-2026-best-business-schools-ranking-mit-joins-wharton-at-the-top/',
    cipMatch: ['5208', '5202', '52'],
  },
  {
    collegeName: 'University of Pennsylvania',
    source: 'QS World University Rankings — Nursing',
    year: '2026', rank: 1, scope: 'world',
    sourceUrl: 'https://www.nursing.upenn.edu/live/news/3535-penn-nursing-reclaims-the-1-spot-ranked-the-worlds',
    cipMatch: ['5138', '51'],
  },

  // ---- Georgia Tech (source: GT College of Engineering news) ----
  {
    collegeName: 'Georgia Institute of Technology-Main Campus',
    source: 'U.S. News Best Undergraduate Engineering Programs',
    year: '2026', rank: 3, scope: 'national · No. 1 public (tied)',
    sourceUrl: 'https://coe.gatech.edu/news/2025/09/undergrad-engineering-program-returns-no-3-us-news-2026-rankings',
    cipMatch: ['1419', '1409', '1435', '14'],
  },

  // ---- UIUC (source: Grainger facts & rankings page, published Sept 2025) ----
  {
    collegeName: 'University of Illinois Urbana-Champaign',
    source: 'U.S. News Best Undergraduate Engineering Programs',
    year: '2026', rank: 5, scope: 'national',
    sourceUrl: 'https://grainger.illinois.edu/about/facts-and-rankings',
    cipMatch: ['1409', '1410', '14'],
  },
  {
    collegeName: 'University of Illinois Urbana-Champaign',
    source: 'U.S. News Best Undergraduate Computer Science Programs',
    year: '2026', rank: 7, scope: 'national',
    sourceUrl: 'https://grainger.illinois.edu/about/facts-and-rankings',
    cipMatch: ['1107', '1101', '11'],
  },

  // ---- Purdue (source: Purdue Engineering undergraduate rankings page) ----
  {
    collegeName: 'Purdue University-Main Campus',
    source: 'U.S. News Best Undergraduate Engineering Programs',
    year: '2026', rank: 8, scope: 'national',
    sourceUrl: 'https://engineering.purdue.edu/Engr/AboutUs/FactsFigures/Rankings/undergraduate',
    cipMatch: ['1419', '1402', '1410', '14'],
  },
  {
    collegeName: 'Purdue University-Main Campus',
    source: 'U.S. News Undergraduate Aerospace Engineering',
    year: '2026', rank: 3, scope: 'specialty',
    sourceUrl: 'https://engineering.purdue.edu/Engr/AboutUs/FactsFigures/Rankings/undergraduate',
    cipMatch: ['1402'],
  },

  // ---- Carnegie Mellon (source: CMU News on 2026 US News rankings) ----
  {
    collegeName: 'Carnegie Mellon University',
    source: 'U.S. News Undergraduate CS — Artificial Intelligence',
    year: '2026', rank: 1, scope: 'specialty (shared with MIT)',
    sourceUrl: 'https://www.cmu.edu/news/stories/archives/2025/september/carnegie-mellon-named-a-top-20-us-university',
    cipMatch: ['1107', '1101', '11'],
  },

  // ---- Michigan (source: Michigan Ross news) ----
  {
    collegeName: 'University of Michigan-Ann Arbor',
    source: 'U.S. News Best Undergraduate Business Programs (Ross)',
    year: '2026', rank: 3, scope: 'national',
    sourceUrl: 'https://michiganross.umich.edu/news/just-michigan-ross-bba-program-lands-top-three-us-news-rankings-again',
    cipMatch: ['5202', '5208', '52'],
  },

  // ---- Michigan State (source: Broad College news, 15th consecutive year) ----
  {
    collegeName: 'Michigan State University',
    source: 'U.S. News Undergraduate Supply Chain Management/Logistics',
    year: '2026', rank: 1, scope: 'specialty',
    sourceUrl: 'https://broad.msu.edu/news/u-s-news-world-report-ranks-broad-no-1-in-supply-chain-management-logistics-for-15th-year/',
    cipMatch: ['5220', '5202', '5213', '52'],
  },

  // ---- South Carolina (source: Moore School news, 26th consecutive year) ----
  {
    collegeName: 'University of South Carolina-Columbia',
    source: 'U.S. News Undergraduate International Business',
    year: '2026', rank: 1, scope: 'specialty',
    sourceUrl: 'https://sc.edu/study/colleges_schools/moore/about/press_room/news_and_announcements/2026/',
    cipMatch: ['5211', '5202', '52'],
  },

  // ---- UMass Amherst (source: Manning CICS news) ----
  {
    collegeName: 'University of Massachusetts-Amherst',
    source: 'U.S. News Best Undergraduate Computer Science Programs',
    year: '2026', rank: 35, scope: 'national · No. 16 public',
    sourceUrl: 'https://www.cics.umass.edu/news/2026-us-news-undergraduate-rankings',
    cipMatch: ['1107', '1101', '11'],
  },
];

function findMajor(majors: { id: string; cipCode: string; name: string }[], cipMatch: string[]) {
  for (const cip of cipMatch) {
    const match = cip.length === 2
      ? majors.find(m => m.cipCode.startsWith(cip))
      : majors.find(m => m.cipCode === cip);
    if (match) return match;
  }
  return null;
}

async function main() {
  let created = 0;
  const unattached: string[] = [];

  // Idempotency: rebuild all seeded rankings from scratch.
  await prisma.majorRanking.deleteMany({});

  for (const seed of RANKINGS) {
    const colleges = await prisma.college.findMany({
      where: { name: seed.collegeName },
      select: { id: true, name: true, majors: { select: { id: true, cipCode: true, name: true } } },
    });
    if (colleges.length === 0) {
      unattached.push(`${seed.collegeName}: college not found`);
      continue;
    }

    for (const college of colleges) {
      const major = findMajor(college.majors, seed.cipMatch);
      if (!major) {
        unattached.push(`${seed.collegeName} — ${seed.source}: no stored major matches CIP ${seed.cipMatch.join('/')}`);
        continue;
      }
      await prisma.majorRanking.create({
        data: {
          collegeMajorId: major.id,
          source: seed.source,
          year: seed.year,
          rank: seed.rank,
          scope: seed.scope ?? null,
          sourceUrl: seed.sourceUrl,
        },
      });
      created++;
      console.log(`${college.name}: [${seed.rank}] ${seed.source} → attached to "${major.name}" (${major.cipCode})`);
    }
  }

  console.log(`\nCreated ${created} ranking rows.`);
  if (unattached.length) {
    console.warn('Not attached:');
    unattached.forEach(u => console.warn('  - ' + u));
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
