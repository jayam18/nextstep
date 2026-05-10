import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Querying top 5 colleges in the database...\n');
  
  // Example query: Find top 5 most expensive colleges
  const colleges = await prisma.college.findMany({
    take: 5,
    orderBy: {
      tuition: 'desc',
    },
    select: {
      name: true,
      tuition: true,
      setting: true,
      specialties: true
    }
  });

  console.table(colleges);
  
  const totalCount = await prisma.college.count();
  console.log(`\nTotal colleges in database: ${totalCount}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
