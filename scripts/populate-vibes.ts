// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Phase 5: Populating Vibe Metrics...");
  
  // 1. Load the LLM-generated vibes JSON
  const vibesPath = path.join(process.cwd(), 'data', 'vibes.json');
  let llmVibes: Record<string, any> = {};
  if (fs.existsSync(vibesPath)) {
    llmVibes = JSON.parse(fs.readFileSync(vibesPath, 'utf8'));
    console.log(`Loaded LLM knowledge base with ${Object.keys(llmVibes).length} curated colleges.`);
  }

  // 2. Fetch all colleges from DB
  const colleges = await prisma.college.findMany();
  console.log(`Found ${colleges.length} colleges in database to update.`);

  let updatedCount = 0;

  for (const college of colleges) {
    let socialLife = 3;
    let sportsCulture = 3;
    let academicRigor = 3;
    let tags = "Large State School, Research";
    
    // Check if we have specific LLM data for this college
    const exactMatch = llmVibes[college.name];
    if (exactMatch) {
      socialLife = exactMatch.socialLife;
      sportsCulture = exactMatch.sportsCulture;
      academicRigor = exactMatch.academicRigor;
      tags = exactMatch.tags;
    } else {
      // Fallback heuristics using LLM logic
      let fallbackTags = [];
      
      // Heuristics based on name
      if (college.name.includes("Institute of Technology") || college.name.includes("Polytechnic")) {
        academicRigor = 4;
        socialLife = 2;
        fallbackTags.push("STEM Focus", "Rigorous");
      }
      if (college.name.includes("State University")) {
        sportsCulture = 4;
        socialLife = 4;
        fallbackTags.push("Large State School", "Public Ivy");
      }
      if (college.name.includes("Christian") || college.name.includes("Catholic") || college.name.includes("Loyola")) {
        fallbackTags.push("Religious Affiliation");
      }
      if (college.name.includes("Arts") || college.name.includes("Conservatory")) {
        fallbackTags.push("Arts & Humanities");
      }
      
      if (fallbackTags.length === 0) fallbackTags = ["Research", "Vibrant College Town"];
      tags = fallbackTags.join(", ");
    }

    // Update the database
    await prisma.college.update({
      where: { id: college.id },
      data: {
        socialLife,
        sportsCulture,
        academicRigor,
        tags,
      }
    });
    updatedCount++;
    if (updatedCount % 50 === 0) {
      console.log(`Updated ${updatedCount}/${colleges.length} colleges...`);
    }
  }

  console.log(`Successfully populated vibe metrics for all ${colleges.length} colleges!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
