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

// M1: field-of-study data from the College Scorecard API.
// One nested object per institution x 4-digit CIP x credential:
//   latest.programs.cip_4_digit[] with:
//     code                                        4-digit CIP, no dot ("1107")
//     title                                       "Computer Science." (trailing dot)
//     credential.level                            3 = Bachelor's Degree
//     counts.ipeds_awards2                        degrees awarded (pooled 2-yr)
//     earnings.1_yr.overall_median_earnings
//     earnings.4_yr.overall_median_earnings
//     earnings.4_yr.overall_median_earnings_national   national median, same CIP+credential
//     earnings.4_yr.overall_p25_earnings_national
//     earnings.4_yr.overall_p75_earnings_national
//     debt.staff_grad_plus.all.eval_inst.median        federal loan debt at graduation
//     debt.staff_grad_plus.all.eval_inst.median_payment
const API_BASE = 'https://api.data.gov/ed/collegescorecard/v1/schools';
const BACHELORS_LEVEL = 3;
const MAJORS_PER_COLLEGE = 10; // top N by degrees awarded kept in DB/JSON
const BATCH_SIZE = 10;         // institutions per API request (payload ~1.5MB each)

const DRY_RUN = process.argv.includes('--dry-run');

interface MajorRow {
  cipCode: string;
  name: string;
  credential: string;
  degreesAwarded: number | null;
  degreeShare: number | null;
  medianEarnings1yr: number | null;
  medianEarnings4yr: number | null;
  medianEarnings4yrNational: number | null;
  nationalP25: number | null;
  nationalP75: number | null;
  medianDebt: number | null;
  medianMonthlyPayment: number | null;
  sourceUrl: string;
}

function cleanTitle(title: string): string {
  return title.replace(/\.\s*$/, '').trim();
}

function toInt(v: any): number | null {
  return typeof v === 'number' && isFinite(v) ? Math.round(v) : null;
}

function extractMajors(unitId: number, programs: any[]): MajorRow[] {
  const bachelors = (programs || []).filter(p => p?.credential?.level === BACHELORS_LEVEL);
  const totalAwards = bachelors.reduce((sum, p) => sum + (p?.counts?.ipeds_awards2 || 0), 0);

  const rows = bachelors
    .filter(p => (p?.counts?.ipeds_awards2 || 0) > 0)
    .sort((a, b) => (b.counts?.ipeds_awards2 || 0) - (a.counts?.ipeds_awards2 || 0))
    .slice(0, MAJORS_PER_COLLEGE)
    .map(p => {
      const e1 = p?.earnings?.['1_yr'];
      const e4 = p?.earnings?.['4_yr'];
      const debt = p?.debt?.staff_grad_plus?.all?.eval_inst;
      const awards = p?.counts?.ipeds_awards2 || null;
      return {
        cipCode: String(p.code),
        name: cleanTitle(p.title || ''),
        credential: 'bachelors',
        degreesAwarded: awards,
        degreeShare: awards && totalAwards ? Math.round((awards / totalAwards) * 1000) / 10 : null,
        medianEarnings1yr: toInt(e1?.overall_median_earnings),
        medianEarnings4yr: toInt(e4?.overall_median_earnings),
        medianEarnings4yrNational: toInt(e4?.overall_median_earnings_national),
        nationalP25: toInt(e4?.overall_p25_earnings_national),
        nationalP75: toInt(e4?.overall_p75_earnings_national),
        medianDebt: toInt(debt?.median),
        medianMonthlyPayment: toInt(debt?.median_payment),
        sourceUrl: `https://collegescorecard.ed.gov/school/?${unitId}`,
      };
    });

  return rows;
}

async function main() {
  const apiKey = process.env.COLLEGE_SCORECARD_API_KEY;
  if (!apiKey) {
    console.error('COLLEGE_SCORECARD_API_KEY is not set in .env');
    process.exit(1);
  }

  const colleges = await prisma.college.findMany({
    where: { ipedsUnitId: { not: null } },
    select: { id: true, name: true, ipedsUnitId: true },
  });
  console.log(`Colleges with IPEDS IDs: ${colleges.length}${DRY_RUN ? ' (dry run)' : ''}`);

  // Multiple college rows can share one IPEDS ID (dataset duplicates) — fetch once per unit ID.
  const byUnitId = new Map<number, typeof colleges>();
  for (const c of colleges) {
    const list = byUnitId.get(c.ipedsUnitId!) || [];
    list.push(c);
    byUnitId.set(c.ipedsUnitId!, list);
  }
  const unitIds = [...byUnitId.keys()];

  let collegesUpdated = 0;
  let majorsWritten = 0;
  let noPrograms: string[] = [];

  for (let i = 0; i < unitIds.length; i += BATCH_SIZE) {
    const batch = unitIds.slice(i, i + BATCH_SIZE);
    const url = `${API_BASE}?id=${batch.join(',')}&fields=id,latest.programs.cip_4_digit&per_page=${BATCH_SIZE}&api_key=${apiKey}`;

    let json: any;
    for (let attempt = 1; ; attempt++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        json = await res.json();
        break;
      } catch (err) {
        if (attempt >= 3) throw err;
        console.warn(`Batch ${i / BATCH_SIZE + 1} attempt ${attempt} failed (${err}); retrying...`);
        await delay(2000 * attempt);
      }
    }

    for (const result of json.results || []) {
      const unitId = result.id;
      const rows = extractMajors(unitId, result['latest.programs.cip_4_digit']);
      const targets = byUnitId.get(unitId) || [];

      if (rows.length === 0) {
        targets.forEach(t => noPrograms.push(`${t.name} (${unitId})`));
        continue;
      }

      for (const college of targets) {
        if (DRY_RUN) {
          console.log(`\n${college.name}:`);
          rows.slice(0, 5).forEach(r =>
            console.log(`  ${r.cipCode} ${r.name} — ${r.degreeShare}% | 1yr $${r.medianEarnings1yr ?? 'n/a'} | 4yr $${r.medianEarnings4yr ?? 'n/a'} (natl $${r.medianEarnings4yrNational ?? 'n/a'}) | debt $${r.medianDebt ?? 'n/a'}`)
          );
        } else {
          await prisma.collegeMajor.deleteMany({ where: { collegeId: college.id } });
          await prisma.collegeMajor.createMany({
            data: rows.map(r => ({ ...r, collegeId: college.id })),
          });
        }
        collegesUpdated++;
        majorsWritten += rows.length;
      }
    }

    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(unitIds.length / BATCH_SIZE)} done.`);
    await delay(500);
  }

  console.log(`\n${DRY_RUN ? 'Would write' : 'Wrote'} ${majorsWritten} majors across ${collegesUpdated} college rows.`);
  if (noPrograms.length) {
    console.warn(`No bachelor's program data for ${noPrograms.length} rows:`, noPrograms.join('; '));
  }

  if (!DRY_RUN) {
    const withEarnings = await prisma.collegeMajor.count({ where: { medianEarnings4yr: { not: null } } });
    const total = await prisma.collegeMajor.count();
    console.log(`Coverage: ${withEarnings}/${total} majors have 4-yr earnings (${Math.round((withEarnings / total) * 100)}%).`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
