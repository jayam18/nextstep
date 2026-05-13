import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.college.updateMany({
    data: {
      studentLifeSnippet: null,
      athleticsSnippet: null,
      safetySnippet: null
    }
  });
  console.log("Database reset complete.");
}
main().finally(() => prisma.$disconnect());
