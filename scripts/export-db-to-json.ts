import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log("Exporting database to JSON...");
  
  const colleges = await prisma.college.findMany({
    include: {
      careerPaths: true
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
