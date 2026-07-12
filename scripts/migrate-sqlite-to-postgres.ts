/**
 * DB1 — One-time data migration: prisma/dev.db (SQLite) → Postgres (DATABASE_URL).
 *
 * Reads every table straight out of the legacy SQLite file with the `sqlite3` CLI
 * (avoids needing a second Prisma client) and inserts into the Postgres database
 * the Prisma schema now points at, preserving all ids and relations.
 *
 * Usage:
 *   npx prisma db push                                  # create the schema first
 *   npx tsx scripts/migrate-sqlite-to-postgres.ts       # aborts if target has data
 *   npx tsx scripts/migrate-sqlite-to-postgres.ts --force   # wipe target, then migrate
 */
import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'child_process';
import path from 'path';

const prisma = new PrismaClient();
const SQLITE_DB = path.join(__dirname, '../prisma/dev.db');

// SQLite stores Prisma DateTime columns as epoch milliseconds.
const DATE_COLUMNS: Record<string, string[]> = {
  College: ['createdAt', 'updatedAt', 'scorecardRetrievedAt'],
  CareerPath: [],
  CollegeProgram: [],
  CollegeAid: ['retrievedAt'],
  CollegeMajor: ['retrievedAt'],
  MajorRanking: ['retrievedAt'],
  TuitionReciprocity: ['retrievedAt'],
};

function readTable(table: string): any[] {
  const out = execFileSync('sqlite3', ['-json', SQLITE_DB, `SELECT * FROM "${table}"`], {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
  if (!out.trim()) return [];
  const rows: any[] = JSON.parse(out);
  for (const col of DATE_COLUMNS[table] ?? []) {
    for (const row of rows) {
      if (row[col] != null) row[col] = new Date(Number(row[col]));
    }
  }
  return rows;
}

async function insertChunked(label: string, rows: any[], createMany: (data: any[]) => Promise<{ count: number }>) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 250) {
    const res = await createMany(rows.slice(i, i + 250));
    inserted += res.count;
  }
  console.log(`  ${label}: ${inserted}/${rows.length} inserted`);
  if (inserted !== rows.length) throw new Error(`${label}: expected ${rows.length}, inserted ${inserted}`);
}

async function main() {
  console.log(`Migrating ${SQLITE_DB} → ${process.env.DATABASE_URL?.replace(/:\/\/.*@/, '://<redacted>@')}`);

  const existing = await prisma.college.count();
  if (existing > 0) {
    if (!process.argv.includes('--force')) {
      throw new Error(
        `Target database already has ${existing} colleges. Re-run with --force to wipe and re-migrate.`
      );
    }
    console.log(`--force: wiping ${existing} colleges (+cascades) and career paths from target…`);
    await prisma.college.deleteMany(); // cascades programs/majors/rankings/aid/reciprocity + join rows
    await prisma.careerPath.deleteMany();
  }

  const colleges = readTable('College');
  const careerPaths = readTable('CareerPath');
  const joins = readTable('_CareerPathToCollege'); // A = CareerPath.id, B = College.id
  const programs = readTable('CollegeProgram');
  const aid = readTable('CollegeAid');
  const majors = readTable('CollegeMajor');
  const rankings = readTable('MajorRanking');
  const reciprocity = readTable('TuitionReciprocity');

  await insertChunked('College', colleges, (d) => prisma.college.createMany({ data: d }));
  await insertChunked('CareerPath', careerPaths, (d) => prisma.careerPath.createMany({ data: d }));

  // Implicit m2m join table: reconnect each career path to its colleges.
  for (const cp of careerPaths) {
    const collegeIds = joins.filter((j) => j.A === cp.id).map((j) => ({ id: j.B }));
    await prisma.careerPath.update({ where: { id: cp.id }, data: { colleges: { connect: collegeIds } } });
  }
  console.log(`  _CareerPathToCollege: ${joins.length} links reconnected`);

  await insertChunked('CollegeProgram', programs, (d) => prisma.collegeProgram.createMany({ data: d }));
  await insertChunked('CollegeAid', aid, (d) => prisma.collegeAid.createMany({ data: d }));
  await insertChunked('CollegeMajor', majors, (d) => prisma.collegeMajor.createMany({ data: d }));
  await insertChunked('MajorRanking', rankings, (d) => prisma.majorRanking.createMany({ data: d }));
  await insertChunked('TuitionReciprocity', reciprocity, (d) => prisma.tuitionReciprocity.createMany({ data: d }));

  // Final source-vs-target tally
  const tally: [string, number, number][] = [
    ['College', colleges.length, await prisma.college.count()],
    ['CareerPath', careerPaths.length, await prisma.careerPath.count()],
    ['CollegeProgram', programs.length, await prisma.collegeProgram.count()],
    ['CollegeAid', aid.length, await prisma.collegeAid.count()],
    ['CollegeMajor', majors.length, await prisma.collegeMajor.count()],
    ['MajorRanking', rankings.length, await prisma.majorRanking.count()],
    ['TuitionReciprocity', reciprocity.length, await prisma.tuitionReciprocity.count()],
  ];
  console.log('\nSource vs target:');
  let ok = true;
  for (const [name, src, dst] of tally) {
    const match = src === dst;
    ok = ok && match;
    console.log(`  ${match ? '✓' : '✗'} ${name}: ${src} → ${dst}`);
  }
  if (!ok) throw new Error('Row-count mismatch — do not trust this migration.');
  console.log('\nMigration complete. Verify with: npx tsx scripts/export-db-to-json.ts && git diff src/data/colleges.json');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
