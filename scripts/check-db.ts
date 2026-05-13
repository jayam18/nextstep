import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const colleges = await prisma.college.findMany({
    select: { name: true, studentLifeSnippet: true },
    take: 10
  });
  console.log(JSON.stringify(colleges, null, 2));
}
main().finally(() => prisma.$disconnect());
