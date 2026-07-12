import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log("Exporting database to JSON...");
  
  const colleges = await prisma.college.findMany({
    // Secondary sort keys keep the export deterministic — Postgres returns
    // tied/unordered rows in arbitrary order, which would churn the JSON diff.
    include: {
      careerPaths: { orderBy: { name: 'asc' } },
      reciprocity: { orderBy: [{ program: 'asc' }, { eligibleStates: 'asc' }] },
      programs: {
        orderBy: [{ prominence: 'asc' }, { name: 'asc' }]
      },
      majors: {
        orderBy: [{ degreesAwarded: 'desc' }, { name: 'asc' }],
        include: { rankings: { orderBy: { source: 'asc' } } }
      },
      aid: { orderBy: [{ kind: 'asc' }, { name: 'asc' }] }
    },
    orderBy: {
      ranking: 'asc'
    }
  });

  const outDir = path.join(__dirname, '../src/data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFile = path.join(outDir, 'colleges.json');
  fs.writeFileSync(outFile, JSON.stringify(colleges, null, 2));

  console.log(`Successfully exported ${colleges.length} colleges to src/data/colleges.json`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
