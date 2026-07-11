import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Pre-med pathway capture (extends S1 CollegeProgram taxonomy).
// Tiers:
//   1. Direct BS/MD — type 'accelerated', knownFor contains 'BS/MD' or 'BA/MD'
//      (most seeded in S1; this script adds verified missing ones)
//   2. Early assurance — type 'pre-med', prominence 2
//   3. Advising pathway — NOT seeded (true of nearly every college; would be noise;
//      per-college committee-letter verification is a future research pass)
// The card chip and search derive from these rows; every row verified 2026-07-11.

interface PremedSeed {
  collegeName: string;
  name: string;
  type: 'accelerated' | 'pre-med';
  prominence: 1 | 2;
  description: string;
  knownFor: string;
  sourceUrl: string;
}

const SEEDS: PremedSeed[] = [
  {
    collegeName: 'George Washington University',
    name: 'Seven-Year Dual BA/MD Program',
    type: 'accelerated',
    prominence: 1,
    description: 'Three undergraduate years followed by GW School of Medicine; provisional admission continues with a 3.60 GPA, no science grade below C, and medical service experience.',
    knownFor: 'BA/MD',
    sourceUrl: 'https://smhs.gwu.edu/academics/md-program/admissions/dual-programs/bamd',
  },
  {
    collegeName: 'University of Miami',
    name: 'Miller Medical Scholars Program (7-Year BS/MD)',
    type: 'accelerated',
    prominence: 1,
    description: 'Highly selective seven-year path: three undergraduate years, then the Miller School of Medicine, with early clinical and research exposure.',
    knownFor: 'BS/MD',
    sourceUrl: 'https://students-residents.aamc.org/medical-school-admission-requirements/medical-schools-offering-combined-baccalaureate-md-programs-state-and-program-length-2025-2026',
  },
  {
    collegeName: 'Tulane University of Louisiana',
    name: 'Creative Premedical Scholars (Early Assurance)',
    type: 'pre-med',
    prominence: 2,
    description: 'Liberal-arts majors apply in sophomore spring for guaranteed admission to Tulane School of Medicine — no MCAT required; minimum 3.6 GPA and a BA/BFA in the School of Liberal Arts.',
    knownFor: 'Early Assurance, Pre-Med',
    sourceUrl: 'https://liberalarts.tulane.edu/academics/undergraduate-studies/accelerated-programs-professional-degrees/creative-premedical-scholars',
  },
];

// Predicate shared with the UI: which existing rows already mark a direct med path.
const DIRECT_MED = /BS\/MD|BA\/MD/i;

async function main() {
  let created = 0;

  for (const seed of SEEDS) {
    const colleges = await prisma.college.findMany({
      where: { name: seed.collegeName },
      select: { id: true, name: true, programs: { select: { id: true, name: true } } },
    });
    if (colleges.length === 0) {
      console.warn(`College not found: ${seed.collegeName}`);
      continue;
    }
    for (const college of colleges) {
      if (college.programs.some(p => p.name === seed.name)) continue; // idempotent
      await prisma.collegeProgram.create({
        data: {
          collegeId: college.id,
          name: seed.name,
          type: seed.type,
          prominence: seed.prominence,
          description: seed.description,
          knownFor: seed.knownFor,
          sourceUrl: seed.sourceUrl,
        },
      });
      created++;
      console.log(`${college.name}: + ${seed.name}`);
    }
  }

  // Report full pre-med coverage after seeding
  const all = await prisma.college.findMany({
    where: { ranking: { lte: 100 } },
    select: { name: true, ranking: true, programs: { select: { name: true, type: true, knownFor: true, prominence: true } } },
    orderBy: { ranking: 'asc' },
  });
  const covered = all.filter(c =>
    c.programs.some(p =>
      (p.type === 'accelerated' && DIRECT_MED.test(`${p.name} ${p.knownFor ?? ''}`)) ||
      p.type === 'pre-med'
    )
  );
  console.log(`\nCreated ${created} rows. Top-100 colleges with a captured pre-med path (tier 1-2): ${covered.length}`);
  covered.forEach(c => {
    const p = c.programs.find(p => (p.type === 'accelerated' && DIRECT_MED.test(`${p.name} ${p.knownFor ?? ''}`)) || p.type === 'pre-med');
    console.log(`  ${c.ranking}. ${c.name} — ${p?.name}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
