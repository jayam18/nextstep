import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();
const collegesJson = JSON.parse(fs.readFileSync('./src/data/colleges.json', 'utf8'));

async function main() {
  for (let i = 0; i < collegesJson.length; i++) {
    const college = collegesJson[i];
    await prisma.college.update({
      where: { id: college.id },
      data: { ranking: i + 1 }
    });
  }
  console.log('Rankings populated successfully based on JSON order.');
}

main().finally(() => prisma.$disconnect());
