import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const colleges = await prisma.college.findMany({ select: { name: true } });
  console.log(JSON.stringify(colleges.map(c => c.name)));
}
main().then(() => prisma.$disconnect());
