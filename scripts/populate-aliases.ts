import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Common nicknames/abbreviations families actually type into search.
// Keyed by the exact `name` in the College table; comma-separated aliases.
const ALIASES: Record<string, string> = {
  'Massachusetts Institute of Technology': 'MIT',
  'California Institute of Technology': 'Caltech',
  'University of Pennsylvania': 'Penn, UPenn',
  'University of California-Los Angeles': 'UCLA',
  'University of California-Berkeley': 'Berkeley, Cal, UC Berkeley',
  'University of California-San Diego': 'UCSD, UC San Diego',
  'University of California-Davis': 'UC Davis',
  'University of California-Santa Cruz': 'UCSC, UC Santa Cruz',
  'University of Michigan-Ann Arbor': 'UMich, Michigan',
  'University of Illinois Urbana-Champaign': 'UIUC, U of I, Illinois',
  'Georgia Institute of Technology-Main Campus': 'Georgia Tech, GaTech',
  'Virginia Polytechnic Institute and State University': 'Virginia Tech, VA Tech',
  'Washington University in St Louis': 'WashU, WUSTL',
  'University of Southern California': 'USC',
  'Carnegie Mellon University': 'CMU',
  'Johns Hopkins University': 'JHU, Hopkins',
  'University of North Carolina at Chapel Hill': 'UNC, Chapel Hill, Tar Heels',
  'University of Virginia-Main Campus': 'UVA',
  'The University of Texas at Austin': 'UT Austin, Texas',
  'Texas A&M University-College Station': 'TAMU, A&M, Texas A&M',
  'Ohio State University Agricultural Technical Institute': 'Ohio State, OSU',
  'Boston University': 'BU',
  'Boston College': 'BC',
  'George Washington University': 'GW, GWU',
  'Rensselaer Polytechnic Institute': 'RPI',
  'Worcester Polytechnic Institute': 'WPI',
  'Brigham Young University': 'BYU',
  'University of Florida': 'UF, Gators',
  'University of Georgia': 'UGA',
  'University of Wisconsin-Madison': 'UW Madison, Wisconsin',
  'University of Washington-Seattle Campus': 'UW, UDub',
  'University of Massachusetts-Amherst': 'UMass',
  'University of Pittsburgh-Pittsburgh Campus': 'Pitt',
  'North Carolina State University at Raleigh': 'NC State, NCSU',
  'Southern Methodist University': 'SMU',
  'Stony Brook University': 'SUNY Stony Brook, SBU',
  'Rutgers University-Camden': 'Rutgers',
  'Northeastern University Oakland': 'Northeastern, NEU',
  'University of Notre Dame': 'Notre Dame, Fighting Irish',
  'Florida State University': 'FSU, Seminoles',
  'Michigan State University': 'MSU, Sparty',
  'Indiana University-Bloomington': 'IU, Indiana, Hoosiers',
  'University of Colorado Boulder': 'CU Boulder',
  'University of Oklahoma-Health Sciences Center': 'OU, Oklahoma, Sooners',
  'University of Nebraska-Lincoln': 'UNL, Huskers',
  'William & Mary': 'W&M, William and Mary',
  'Saint Louis University': 'SLU',
  'University of Miami': 'UMiami, The U',
  'University of Connecticut': 'UConn, Huskies',
  'University of Maryland-College Park': 'UMD, Maryland, Terps',
  'Vanderbilt University': 'Vandy',
  'University of Chicago': 'UChicago',
  'Case Western Reserve University': 'CWRU, Case',
  'University of Arizona': 'UArizona, U of A, Wildcats',
  'University of Delaware': 'UDel, Blue Hens',
  'The University of Tennessee-Knoxville': 'UT Knoxville, Vols',
  'University of South Carolina-Columbia': 'UofSC, Gamecocks',
};

async function main() {
  let updated = 0;
  const missing: string[] = [];

  for (const [name, aliases] of Object.entries(ALIASES)) {
    const result = await prisma.college.updateMany({
      where: { name },
      data: { aliases },
    });
    if (result.count === 0) missing.push(name);
    updated += result.count;
  }

  console.log(`Set aliases on ${updated} college rows.`);
  if (missing.length) console.warn('No rows matched:', missing.join('; '));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
