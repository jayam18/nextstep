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

// Explicit traceable College Scorecard API fields mapping
const SCORECARD_FIELDS = [
  'id',                                                       // IPEDS UnitID
  'school.name',                                              // school name
  'school.ownership',                                         // 1 = Public, 2 = Private Nonprofit, 3 = Private For-profit
  'latest.admissions.admission_rate.overall',                 // overall admission rate (decimal: 0 to 1)
  'latest.student.size',                                      // undergraduate enrollment size
  'latest.admissions.sat_scores.midpoint.math',               // SAT Math midpoint score
  'latest.admissions.sat_scores.midpoint.critical_reading',   // SAT Reading midpoint score
  'latest.admissions.act_scores.midpoint.cumulative',         // ACT Cumulative midpoint score
  'latest.cost.tuition.in_state',                             // in-state tuition and fees
  'latest.cost.tuition.out_of_state',                         // out-of-state tuition and fees
  'latest.cost.avg_net_price.overall',                         // average net price overall
  // Public net price by income level
  'latest.cost.net_price.public.by_income_level.0-30000',
  'latest.cost.net_price.public.by_income_level.30001-48000',
  'latest.cost.net_price.public.by_income_level.48001-75000',
  'latest.cost.net_price.public.by_income_level.75001-110000',
  'latest.cost.net_price.public.by_income_level.110001-plus',
  // Private net price by income level
  'latest.cost.net_price.private.by_income_level.0-30000',
  'latest.cost.net_price.private.by_income_level.30001-48000',
  'latest.cost.net_price.private.by_income_level.48001-75000',
  'latest.cost.net_price.private.by_income_level.75001-110000',
  'latest.cost.net_price.private.by_income_level.110001-plus',
  // Completion rates
  'latest.completion.completion_rate_4yr_150nt',              // 150% normal time completion rate (4yr)
  'latest.completion.rate_suppressed.overall',                // general cohort consumer rate
  // Median earnings
  'latest.earnings.10_yrs_after_entry.median'                 // median earnings 10 years after entry
].join(',');

async function fetchWithRetry(url: string, retries = 5, backoff = 2000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url);
    if (res.status === 429) {
      const waitTime = backoff * Math.pow(2, i);
      console.warn(`[Rate Limit] Received 429 (Too Many Requests). Waiting ${waitTime}ms before retry ${i + 1}/${retries}...`);
      await delay(waitTime);
      continue;
    }
    return res;
  }
  throw new Error(`Max retries reached for ${url}`);
}

async function main() {
  const apiKey = process.env.COLLEGE_SCORECARD_API_KEY;
  if (!apiKey) throw new Error("Missing COLLEGE_SCORECARD_API_KEY in environment variables");

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log(`Starting College Scorecard Refresh (Batched Mode)... Mode: ${dryRun ? 'DRY-RUN (No updates will be saved)' : 'EXECUTE'}`);

  // Fetch all colleges with linked IPEDS ID
  const colleges = await prisma.college.findMany({
    where: { ipedsUnitId: { not: null } }
  });

  console.log(`Loaded ${colleges.length} colleges with linked IPEDS UnitIDs.`);

  // Group into batches of 100
  const batchSize = 100;
  let updatedCount = 0;

  for (let i = 0; i < colleges.length; i += batchSize) {
    const batch = colleges.slice(i, i + batchSize);
    const ipedsIds = batch.map(c => c.ipedsUnitId).join(',');
    
    console.log(`Fetching batch ${Math.floor(i / batchSize) + 1} (${batch.length} colleges)...`);

    try {
      const url = `https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${apiKey}&id=${ipedsIds}&per_page=100&fields=${SCORECARD_FIELDS}`;
      const res = await fetchWithRetry(url);
      if (!res.ok) {
        console.error(`[-] API request failed for batch with status ${res.status}`);
        continue;
      }

      const data = await res.json();
      const resultsMap: Record<number, any> = {};
      if (data.results) {
        for (const item of data.results) {
          resultsMap[Number(item['id'])] = item;
        }
      }

      // Map back to database records
      for (const college of batch) {
        const ipedsId = college.ipedsUnitId;
        if (!ipedsId || !resultsMap[ipedsId]) {
          console.warn(`[-] No scorecard results returned in batch for ${college.name} (IPEDS: ${ipedsId})`);
          continue;
        }

        const apiResult = resultsMap[ipedsId];
        const isPublic = apiResult['school.ownership'] === 1;

        // Extract & map values
        const rawAcceptance = apiResult['latest.admissions.admission_rate.overall'];
        const rawStudents = apiResult['latest.student.size'];
        const rawSatMath = apiResult['latest.admissions.sat_scores.midpoint.math'];
        const rawSatReading = apiResult['latest.admissions.sat_scores.midpoint.critical_reading'];
        const rawActCumulative = apiResult['latest.admissions.act_scores.midpoint.cumulative'];
        const rawTuitionInState = apiResult['latest.cost.tuition.in_state'];
        const rawTuitionOutOfState = apiResult['latest.cost.tuition.out_of_state'];
        const rawAvgNetPrice = apiResult['latest.cost.avg_net_price.overall'];

        // Income Net Prices based on ownership
        const prefix = isPublic ? 'public' : 'private';
        const rawNetPrice0_30 = apiResult[`latest.cost.net_price.${prefix}.by_income_level.0-30000`];
        const rawNetPrice30_48 = apiResult[`latest.cost.net_price.${prefix}.by_income_level.30001-48000`];
        const rawNetPrice48_75 = apiResult[`latest.cost.net_price.${prefix}.by_income_level.48001-75000`];
        const rawNetPrice75_110 = apiResult[`latest.cost.net_price.${prefix}.by_income_level.75001-110000`];
        const rawNetPrice110Plus = apiResult[`latest.cost.net_price.${prefix}.by_income_level.110001-plus`];

        // Completion & Earnings
        const rawCompletion = apiResult['latest.completion.completion_rate_4yr_150nt'] || apiResult['latest.completion.rate_suppressed.overall'];
        const rawEarnings = apiResult['latest.earnings.10_yrs_after_entry.median'];

        // Normalization and fallbacks
        const newAcceptanceRate = rawAcceptance !== null ? Math.round(Number(rawAcceptance) * 100) : college.acceptanceRate;
        const newStudents = rawStudents !== null ? Number(rawStudents) : college.students;
        
        const newSatMath = rawSatMath !== null ? Number(rawSatMath) : null;
        const newSatReading = rawSatReading !== null ? Number(rawSatReading) : null;
        const newActComposite = rawActCumulative !== null ? Number(rawActCumulative) : null;

        // Handle Private/Public Tuition mappings
        let newTuitionInState = rawTuitionInState !== null ? Number(rawTuitionInState) : null;
        let newTuitionOutOfState = rawTuitionOutOfState !== null ? Number(rawTuitionOutOfState) : null;
        if (!isPublic) {
          const basePrivateTuition = newTuitionInState || newTuitionOutOfState || college.tuition;
          newTuitionInState = basePrivateTuition;
          newTuitionOutOfState = basePrivateTuition;
        } else {
          if (newTuitionInState === null && newTuitionOutOfState !== null) newTuitionInState = newTuitionOutOfState;
          if (newTuitionOutOfState === null && newTuitionInState !== null) newTuitionOutOfState = newTuitionInState;
        }

        const newAvgNetPrice = rawAvgNetPrice !== null ? Number(rawAvgNetPrice) : (newTuitionInState || college.tuition);
        
        const newNetPrice0_30 = rawNetPrice0_30 !== null ? Number(rawNetPrice0_30) : null;
        const newNetPrice30_48 = rawNetPrice30_48 !== null ? Number(rawNetPrice30_48) : null;
        const newNetPrice48_75 = rawNetPrice48_75 !== null ? Number(rawNetPrice48_75) : null;
        const newNetPrice75_110 = rawNetPrice75_110 !== null ? Number(rawNetPrice75_110) : null;
        const newNetPrice110Plus = rawNetPrice110Plus !== null ? Number(rawNetPrice110Plus) : null;

        const newCompletionRate = rawCompletion !== null ? Math.round(Number(rawCompletion) * 100) : null;
        const newMedianEarnings = rawEarnings !== null ? Number(rawEarnings) : null;

        // Detect changes
        const diff: string[] = [];
        if (newAcceptanceRate !== college.acceptanceRate) diff.push(`acceptanceRate: ${college.acceptanceRate}% -> ${newAcceptanceRate}%`);
        if (newStudents !== college.students) diff.push(`students: ${college.students} -> ${newStudents}`);
        if (newSatMath !== college.satMath) diff.push(`satMath: ${college.satMath} -> ${newSatMath}`);
        if (newSatReading !== college.satReading) diff.push(`satReading: ${college.satReading} -> ${newSatReading}`);
        if (newActComposite !== college.actComposite) diff.push(`actComposite: ${college.actComposite} -> ${newActComposite}`);
        if (newTuitionInState !== college.tuitionInState) diff.push(`tuitionInState: ${college.tuitionInState} -> ${newTuitionInState}`);
        if (newTuitionOutOfState !== college.tuitionOutOfState) diff.push(`tuitionOutOfState: ${college.tuitionOutOfState} -> ${newTuitionOutOfState}`);
        if (newAvgNetPrice !== college.avgNetPrice) diff.push(`avgNetPrice: ${college.avgNetPrice} -> ${newAvgNetPrice}`);
        if (newNetPrice0_30 !== college.netPrice0_30k) diff.push(`netPrice0_30k: ${college.netPrice0_30k} -> ${newNetPrice0_30}`);
        if (newNetPrice30_48 !== college.netPrice30_48k) diff.push(`netPrice30_48k: ${college.netPrice30_48k} -> ${newNetPrice30_48}`);
        if (newNetPrice48_75 !== college.netPrice48_75k) diff.push(`netPrice48_75k: ${college.netPrice48_75k} -> ${newNetPrice48_75}`);
        if (newNetPrice75_110 !== college.netPrice75_110k) diff.push(`netPrice75_110k: ${college.netPrice75_110k} -> ${newNetPrice75_110}`);
        if (newNetPrice110Plus !== college.netPrice110kPlus) diff.push(`netPrice110kPlus: ${college.netPrice110kPlus} -> ${newNetPrice110Plus}`);
        if (newCompletionRate !== college.completionRate) diff.push(`completionRate: ${college.completionRate}% -> ${newCompletionRate}%`);
        if (newMedianEarnings !== college.medianEarnings) diff.push(`medianEarnings: ${college.medianEarnings} -> ${newMedianEarnings}`);

        if (diff.length > 0) {
          console.log(`[Diff] ${college.name} (IPEDS: ${ipedsId}):`);
          console.log(`  ` + diff.join('\n  '));
          
          if (!dryRun) {
            await prisma.college.update({
              where: { id: college.id },
              data: {
                acceptanceRate: newAcceptanceRate,
                students: newStudents,
                satMath: newSatMath,
                satReading: newSatReading,
                actComposite: newActComposite,
                tuitionInState: newTuitionInState,
                tuitionOutOfState: newTuitionOutOfState,
                avgNetPrice: newAvgNetPrice,
                netPrice0_30k: newNetPrice0_30,
                netPrice30_48k: newNetPrice30_48,
                netPrice48_75k: newNetPrice48_75,
                netPrice75_110k: newNetPrice75_110,
                netPrice110kPlus: newNetPrice110Plus,
                completionRate: newCompletionRate,
                medianEarnings: newMedianEarnings,
                scorecardDataSource: 'College Scorecard',
                scorecardRetrievedAt: new Date()
              }
            });
          }
          updatedCount++;
        } else {
          console.log(`[.] ${college.name} (IPEDS: ${ipedsId}) matches scorecard; no changes.`);
        }
      }

    } catch (err) {
      console.error(`[!] Failed refreshing batch:`, err);
    }

    // Rate-limiting delay between batches
    await delay(1000);
  }

  console.log(`\nCollege Scorecard Refresh Complete!`);
  console.log(`Total Colleges Evaluated: ${colleges.length}`);
  console.log(`Total Colleges ${dryRun ? 'Would Be Updated' : 'Updated'}: ${updatedCount}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
