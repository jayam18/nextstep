import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const colleges = await prisma.college.findMany({
    where: { studentLifeSnippet: null },
    take: 30,
    select: { name: true, location: true }
  });
  console.log(JSON.stringify(colleges));
}
main().finally(() => prisma.$disconnect());
