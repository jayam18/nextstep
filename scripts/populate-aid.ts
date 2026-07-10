import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// G1: grants & scholarships seed. Rule: no source, no row.
// Amounts verified against the cited primary sources on 2026-07-10.
// Coverage tiers:
//   1. Federal aid       — every college (Title IV universals)
//   2. State grants      — top 10 states in the dataset (CA TX NY OH NC IL MA PA MI FL)
//   3. Institutional     — verified affordability pledges (famous "free under $X" programs)
// The per-college institutional/departmental long tail is the ongoing G1
// research pipeline (batch 20-30 colleges per subagent, per BACKLOG.md).

interface AidSeed {
  name: string;
  kind: 'federal' | 'state' | 'institutional' | 'need-based' | 'merit';
  typicalAwardMin?: number;
  typicalAwardMax?: number;
  awardNote?: string;
  eligibility?: string;
  howToApply?: string;
  sourceUrl: string;
  sourceName: string;
  publicOnly?: boolean; // state rows: only applies at public institutions
}

const FEDERAL: AidSeed[] = [
  {
    name: 'Federal Pell Grant',
    kind: 'federal',
    typicalAwardMin: 740,
    typicalAwardMax: 7395,
    awardNote: '2026-27 award year; does not need to be repaid',
    eligibility: 'Need-based (Student Aid Index from the FAFSA); undergraduates without a prior bachelor\'s degree',
    howToApply: 'FAFSA',
    sourceUrl: 'https://studentaid.gov/understand-aid/types/grants/pell',
    sourceName: 'Federal Student Aid',
  },
  {
    name: 'Federal Supplemental Educational Opportunity Grant (FSEOG)',
    kind: 'federal',
    typicalAwardMin: 100,
    typicalAwardMax: 4000,
    awardNote: 'Campus-based: awarded by the college\'s aid office until funds run out',
    eligibility: 'Exceptional financial need; Pell recipients get priority',
    howToApply: 'FAFSA',
    sourceUrl: 'https://studentaid.gov/understand-aid/types/grants/fseog',
    sourceName: 'Federal Student Aid',
  },
  {
    name: 'Federal Work-Study',
    kind: 'federal',
    awardNote: 'Part-time job earnings while enrolled; amount depends on hours and campus funding',
    eligibility: 'Financial need; must be requested on the FAFSA',
    howToApply: 'FAFSA',
    sourceUrl: 'https://studentaid.gov/understand-aid/types/work-study',
    sourceName: 'Federal Student Aid',
  },
];

const STATE: Record<string, AidSeed[]> = {
  CA: [{
    name: 'Cal Grant A',
    kind: 'state',
    typicalAwardMax: 9358,
    awardNote: 'Covers systemwide tuition & fees at UC/CSU; up to $9,358/yr at private nonprofits (2025-26)',
    eligibility: 'California residents; income/asset ceilings and minimum GPA',
    howToApply: 'FAFSA or CADAA + GPA verification by March 2',
    sourceUrl: 'https://www.csac.ca.gov/post/what-are-cal-grant-award-amounts',
    sourceName: 'California Student Aid Commission',
  }],
  NY: [{
    name: 'NYS Tuition Assistance Program (TAP)',
    kind: 'state',
    typicalAwardMin: 500,
    typicalAwardMax: 5665,
    awardNote: '2025-26 maximum; sliding scale by NYS taxable income',
    eligibility: 'New York residents attending in-state; income limits apply',
    howToApply: 'FAFSA + NYS TAP application',
    sourceUrl: 'https://hesc.ny.gov/find-aid/nys-grants-scholarships/tuition-assistance-program-tap',
    sourceName: 'NYS Higher Education Services Corporation',
  }],
  IL: [{
    name: 'Illinois Monetary Award Program (MAP) Grant',
    kind: 'state',
    typicalAwardMax: 8064,
    awardNote: 'Effective 2025-26 maximum; usable at approved IL public and private colleges',
    eligibility: 'Illinois residents with financial need; funds are first-come, first-served',
    howToApply: 'FAFSA (file early)',
    sourceUrl: 'https://www.isac.org/isac-gift-assistance-programs/map/',
    sourceName: 'Illinois Student Assistance Commission',
  }],
  TX: [{
    name: 'TEXAS Grant',
    kind: 'state',
    typicalAwardMax: 10858,
    awardNote: 'Up to $5,429/semester (FY 2026) at Texas public universities',
    eligibility: 'Texas residents with financial need; priority to on-time FAFSA filers',
    howToApply: 'FAFSA',
    sourceUrl: 'https://www.highered.texas.gov/student-financial-aid-programs/grant-loan-programs/',
    sourceName: 'Texas Higher Education Coordinating Board',
    publicOnly: true,
  }],
  NC: [{
    name: 'Next NC Scholarship',
    kind: 'state',
    typicalAwardMin: 5000,
    awardNote: 'At least $5,000/yr at NC public universities (combines state aid with Pell)',
    eligibility: 'NC residents with family AGI ≤ $80,000',
    howToApply: 'FAFSA',
    sourceUrl: 'https://www.cfnc.org/pay-for-college/next-nc-scholarship/',
    sourceName: 'College Foundation of North Carolina',
    publicOnly: true,
  }],
  OH: [{
    name: 'Ohio College Opportunity Grant (OCOG)',
    kind: 'state',
    typicalAwardMax: 5000,
    awardNote: 'Up to $5,000/yr full-time (2025-26); amount varies by institution type',
    eligibility: 'Ohio residents; income-based (max household income and SAI thresholds)',
    howToApply: 'FAFSA',
    sourceUrl: 'https://highered.ohio.gov/initiatives/affordability/ocog/ocog-home',
    sourceName: 'Ohio Department of Higher Education',
  }],
  MA: [{
    name: 'MASSGrant Plus',
    kind: 'state',
    awardNote: 'Covers remaining tuition & mandatory fees (after other aid) at MA public campuses, plus up to $1,000 allowance',
    eligibility: 'Pell-eligible Massachusetts residents at in-state public institutions',
    howToApply: 'FAFSA',
    sourceUrl: 'https://www.mass.gov/info-details/massgrant-massgrant-plus',
    sourceName: 'Massachusetts Office of Student Financial Assistance',
    publicOnly: true,
  }],
  PA: [{
    name: 'PA State Grant',
    kind: 'state',
    typicalAwardMax: 5750,
    awardNote: '2025-26 maximum award',
    eligibility: 'Pennsylvania residents with financial need',
    howToApply: 'FAFSA + PA State Grant form',
    sourceUrl: 'https://www.pheaa.org/grants/state-grant-program/',
    sourceName: 'PHEAA',
  }],
  MI: [{
    name: 'Michigan Achievement Scholarship',
    kind: 'state',
    typicalAwardMax: 5500,
    awardNote: 'Up to $5,500/yr at Michigan public and private institutions',
    eligibility: 'Michigan residents (high school class of 2023 or later); FAFSA-based criteria',
    howToApply: 'FAFSA',
    sourceUrl: 'https://www.michigan.gov/mistudentaid/programs/michigan-achievement-scholarship',
    sourceName: 'MI Student Aid',
  }],
  FL: [{
    name: 'Florida Bright Futures (Florida Academic Scholars)',
    kind: 'merit',
    awardNote: '100% of tuition & applicable fees at Florida public universities',
    eligibility: 'Florida residents; GPA, test-score, and service-hour requirements',
    howToApply: 'Separate application via Florida Financial Aid Application',
    sourceUrl: 'https://www.floridabrightfutures.gov/',
    sourceName: 'Florida Department of Education',
    publicOnly: true,
  }],
};

const INSTITUTIONAL: Record<string, AidSeed[]> = {
  'Harvard University': [{
    name: 'Harvard Financial Aid Initiative',
    kind: 'institutional',
    awardNote: 'Tuition free for families earning ≤ $200k; tuition, housing, food, and travel free ≤ $100k (from 2025-26)',
    eligibility: 'Need-based; ~86% of U.S. families qualify for free tuition',
    howToApply: 'Automatic with the financial aid application (CSS Profile + FAFSA)',
    sourceUrl: 'https://news.harvard.edu/gazette/story/2025/03/harvard-expands-financial-aid/',
    sourceName: 'Harvard Gazette',
  }],
  'Massachusetts Institute of Technology': [{
    name: 'MIT Undergraduate Financial Aid Pledge',
    kind: 'institutional',
    awardNote: 'Tuition free for family incomes < $200k; full cost of attendance covered < $100k (from 2025)',
    eligibility: 'Need-based with typical assets; covers ~80% of U.S. families',
    howToApply: 'Automatic with the financial aid application; MIT is need-blind and loan-optional',
    sourceUrl: 'https://news.mit.edu/2024/mit-tuition-undergraduates-family-income-1120',
    sourceName: 'MIT News',
  }],
  'Stanford University': [{
    name: 'Stanford Financial Aid Commitment',
    kind: 'institutional',
    awardNote: 'Tuition free for family incomes < $150k; tuition, room & board free < $100k',
    eligibility: 'Need-based with typical assets',
    howToApply: 'Automatic with the financial aid application',
    sourceUrl: 'https://news.stanford.edu/stories/2023/02/undergraduate-families-100000-income-pay-no-tuition-room-board-stanford-beginning-2023-24',
    sourceName: 'Stanford Report',
  }],
  'Princeton University': [{
    name: 'Princeton Financial Aid Program',
    kind: 'institutional',
    awardNote: 'Most families earning ≤ $150k pay nothing (tuition, room & board); ≤ $250k pay no tuition; 100% grant-based, no loans',
    eligibility: 'Need-based; aid extends to many families earning up to $350k',
    howToApply: 'Princeton Financial Aid Application; no CSS Profile fee',
    sourceUrl: 'https://www.princeton.edu/admission-aid/affordable-all',
    sourceName: 'Princeton University',
  }],
  'University of Illinois Urbana-Champaign': [{
    name: 'Illinois Commitment',
    kind: 'institutional',
    awardNote: 'Free tuition & fees for up to 4 years',
    eligibility: 'Illinois residents with family income ≤ $75,000 and assets ≤ $75,000 (from fall 2025)',
    howToApply: 'Automatic with FAFSA (or Alternative Application)',
    sourceUrl: 'https://osfa.illinois.edu/illinois-commitment/',
    sourceName: 'UIUC Office of Student Financial Aid',
  }],
  'University of Michigan-Ann Arbor': [{
    name: 'Go Blue Guarantee',
    kind: 'institutional',
    awardNote: 'Free undergraduate tuition (up to 4 years)',
    eligibility: 'Michigan residents with family income ≤ $125,000 and assets ≤ $125,000 (from fall 2025)',
    howToApply: 'Automatic with FAFSA',
    sourceUrl: 'https://goblueguarantee.umich.edu/ann-arbor/',
    sourceName: 'University of Michigan',
  }],
  'The University of Texas at Austin': [{
    name: 'Texas Advance Commitment',
    kind: 'institutional',
    awardNote: 'Fully covered tuition',
    eligibility: 'Texas residents with family AGI ≤ $100,000 and typical assets (from fall 2025); partial support at higher incomes',
    howToApply: 'Automatic with FAFSA/TASFA',
    sourceUrl: 'https://admissions.utexas.edu/cost-aid/financial-aid/texas-advance-commitment/',
    sourceName: 'UT Austin Admissions',
  }],
};

function stateOf(location: string): string | null {
  const m = location.match(/,\s*([A-Z]{2})$/);
  return m ? m[1] : null;
}

async function main() {
  const colleges = await prisma.college.findMany({
    select: { id: true, name: true, location: true, tuitionInState: true, tuitionOutOfState: true },
  });

  // Idempotent rebuild
  await prisma.collegeAid.deleteMany({});

  let rows = 0;
  for (const college of colleges) {
    const isPublic = !!(college.tuitionInState && college.tuitionOutOfState && college.tuitionInState !== college.tuitionOutOfState);
    const st = stateOf(college.location);

    const seeds: AidSeed[] = [
      ...(INSTITUTIONAL[college.name] ?? []),
      ...((st && STATE[st]) ? STATE[st].filter(s => !s.publicOnly || isPublic) : []),
      ...FEDERAL,
    ];

    await prisma.collegeAid.createMany({
      data: seeds.map(({ publicOnly, ...s }) => ({
        collegeId: college.id,
        name: s.name,
        kind: s.kind,
        typicalAwardMin: s.typicalAwardMin ?? null,
        typicalAwardMax: s.typicalAwardMax ?? null,
        awardNote: s.awardNote ?? null,
        eligibility: s.eligibility ?? null,
        howToApply: s.howToApply ?? null,
        sourceUrl: s.sourceUrl,
        sourceName: s.sourceName,
      })),
    });
    rows += seeds.length;
  }

  const total = await prisma.collegeAid.count();
  const unsourced = await prisma.collegeAid.count({ where: { sourceUrl: '' } });
  console.log(`Created ${total} aid rows across ${colleges.length} colleges (avg ${(total / colleges.length).toFixed(1)}/college).`);
  console.log(`Rows without sourceUrl: ${unsourced} (must be 0).`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
