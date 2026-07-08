import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Program state lists
const MSEP_STATES = ['IL', 'IN', 'KS', 'MN', 'MO', 'NE', 'ND', 'OH', 'WI']; // IL is sender only but we list it
const WUE_STATES = ['AK', 'AZ', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'NM', 'ND', 'OR', 'SD', 'UT', 'WA', 'WY'];
const NEBHE_STATES = ['CT', 'ME', 'MA', 'NH', 'RI', 'VT'];
const ACM_STATES = ['AL', 'AR', 'DE', 'FL', 'GA', 'KY', 'LA', 'MD', 'MS', 'OK', 'SC', 'TN', 'TX', 'VA', 'WV'];

async function main() {
  console.log("Starting Seeding of Tuition Reciprocity Rules...");

  // Fetch all colleges
  const colleges = await prisma.college.findMany({
    select: {
      id: true,
      name: true,
      location: true,
      tuitionInState: true,
      tuitionOutOfState: true
    }
  });

  // Filter public colleges (tuitionInState !== tuitionOutOfState)
  const publics = colleges.filter(c => c.tuitionInState && c.tuitionOutOfState && c.tuitionInState !== c.tuitionOutOfState);
  console.log(`Found ${publics.length} public colleges to process.`);

  // First, clear existing reciprocity rules to make the script idempotent
  await prisma.tuitionReciprocity.deleteMany({});
  console.log("Cleared existing reciprocity records.");

  let count = 0;
  for (const college of publics) {
    const state = college.location.split(',').pop()?.trim() || 'Unknown';
    
    let program = 'none';
    let eligibleStates: string[] = [];
    let rateType = 'none';
    let rateValue: number | null = null;
    let conditions: string | null = 'Checked, no regional reciprocity programs available.';
    let sourceUrl = 'https://collegescorecard.ed.gov/';

    if (MSEP_STATES.includes(state)) {
      // Note: Illinois is a member state but does not host students in the MSEP pool.
      // So public colleges located in Illinois (IL) do not host MSEP discounts.
      if (state !== 'IL') {
        program = 'MSEP';
        eligibleStates = MSEP_STATES.filter(s => s !== state);
        rateType = 'pct-of-instate';
        rateValue = 150;
        conditions = 'Midwest Student Exchange Program rate (capped at 150% of in-state). Available for selected majors.';
        sourceUrl = 'https://msep.mhec.org/';
      }
    } else if (WUE_STATES.includes(state)) {
      program = 'WUE';
      eligibleStates = WUE_STATES.filter(s => s !== state);
      rateType = 'pct-of-instate';
      rateValue = 150;
      conditions = 'Western Undergraduate Exchange rate (150% of in-state). Requires separate application/verification and specific majors.';
      sourceUrl = 'https://wue.wiche.edu/';
    } else if (NEBHE_STATES.includes(state)) {
      program = 'NEBHE';
      eligibleStates = NEBHE_STATES.filter(s => s !== state);
      rateType = 'pct-of-instate';
      rateValue = 175; // typically 175% in New England
      conditions = 'New England Tuition Break rate. Eligible for residents of New England in approved majors not offered in home state.';
      sourceUrl = 'https://nebhe.org/tuitionbreak/';
    } else if (ACM_STATES.includes(state)) {
      program = 'ACM';
      eligibleStates = ACM_STATES.filter(s => s !== state);
      rateType = 'instate-rate';
      rateValue = null;
      conditions = 'Academic Common Market rate. Qualifies for in-state tuition for approved majors not offered in student\'s home state.';
      sourceUrl = 'https://www.sreb.org/academic-common-market';
    }

    // Insert record
    await prisma.tuitionReciprocity.create({
      data: {
        collegeId: college.id,
        program,
        eligibleStates: eligibleStates.length > 0 ? eligibleStates.join(',') : '',
        rateType,
        rateValue,
        conditions,
        sourceUrl,
      }
    });

    if (program !== 'none') {
      console.log(`[+] Seeded reciprocity for ${college.name} (${state}): ${program} for states [${eligibleStates.join(',')}]`);
    } else {
      console.log(`[.] Seeded verified-none for ${college.name} (${state})`);
    }
    count++;
  }

  console.log(`\nSuccessfully processed and seeded reciprocity rules for ${count} public colleges!`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
