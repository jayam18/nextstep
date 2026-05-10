import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      maxTuition, 
      preferredSetting, 
      socialLifeImportance, 
      sportsImportance,
      specialty 
    } = body;

    // Fetch all colleges (in a real app, you might pre-filter by tuition via DB query)
    const allColleges = await prisma.college.findMany();

    const scoredColleges = allColleges.map((college) => {
      let score = 100;
      let reasons: string[] = [];

      // 1. Tuition Check (Hard filter or heavy penalty)
      if (college.tuition > maxTuition) {
        score -= 40; // Heavy penalty if over budget
        reasons.push("Over budget");
      } else {
        reasons.push("Within budget");
      }

      // 2. Setting Match
      const collegeSetting = college.setting || "Any";
      if (preferredSetting !== "Any" && collegeSetting !== preferredSetting && collegeSetting !== "Any") {
        score -= 15;
      } else if (preferredSetting !== "Any" && collegeSetting === preferredSetting) {
        reasons.push(`Matches ${preferredSetting} setting`);
      }

      // 3. Social Life Match (1 to 5)
      // Neutral fallback if missing
      const social = college.socialLife ?? 3;
      const socialDiff = Math.abs(socialLifeImportance - social);
      score -= socialDiff * 4; 
      
      // 4. Sports Culture Match
      const sports = college.sportsCulture ?? 3;
      const sportsDiff = Math.abs(sportsImportance - sports);
      score -= sportsDiff * 4;

      // 5. Specialty Match
      const specialties = college.specialties || "";
      if (specialty && specialty !== "Undecided") {
        if (specialties && !specialties.includes(specialty)) {
          score -= 20;
        } else if (specialties.includes(specialty)) {
          score += 10; // Bonus for having the specialty
          reasons.push(`Strong ${specialty} program`);
        }
      }

      // Normalize score to 0-100 max
      const finalScore = Math.min(Math.max(score, 0), 100);

      return {
        ...college,
        matchScore: finalScore,
        matchReasons: reasons.slice(0, 3) // Top 3 reasons
      };
    });

    // Sort by highest score first
    scoredColleges.sort((a, b) => b.matchScore - a.matchScore);

    // Return Top 12 matches
    return NextResponse.json({ matches: scoredColleges.slice(0, 12) });
  } catch (error) {
    console.error("Error in matching algorithm:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
