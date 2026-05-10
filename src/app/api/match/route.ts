import { NextResponse } from 'next/server';
import collegesData from '@/data/colleges.json';

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

    const allColleges = collegesData as any[];

    const scoredColleges = allColleges.map((college) => {
      let score = 100;
      let reasons: string[] = [];

      // 1. Tuition Check
      if (college.tuition > maxTuition) {
        score -= 40; 
        reasons.push("Over budget");
      } else {
        reasons.push("Within budget");
      }

      // 2. Setting Match (locationVibe)
      const collegeSetting = college.locationVibe || "Any";
      if (preferredSetting !== "Any" && !collegeSetting.includes(preferredSetting)) {
        score -= 15;
      } else if (preferredSetting !== "Any" && collegeSetting.includes(preferredSetting)) {
        reasons.push(`Matches ${preferredSetting} setting`);
      }

      // 3. Social Life Match (Map categorical to 1-5)
      let social = 3;
      if (college.socialVibe === "Greek Life Heavy") social = 5;
      else if (college.socialVibe === "Quiet") social = 1;
      
      const socialDiff = Math.abs(socialLifeImportance - social);
      score -= socialDiff * 4; 
      
      // 4. Sports Culture Match
      let sports = 3;
      if (college.athleticsVibe === "D1 Powerhouse") sports = 5;
      else if (college.athleticsVibe === "Non-Athletic/Artsy") sports = 1;
      
      const sportsDiff = Math.abs(sportsImportance - sports);
      score -= sportsDiff * 4;

      // 5. Specialty Match (topMajors)
      const topMajors = college.topMajors || "";
      if (specialty && specialty !== "Undecided") {
        if (!topMajors.includes(specialty)) {
          score -= 20;
        } else {
          score += 10;
          reasons.push(`Strong ${specialty} program`);
        }
      }

      const finalScore = Math.min(Math.max(score, 0), 100);

      return {
        ...college,
        matchScore: finalScore,
        matchReasons: reasons.slice(0, 3)
      };
    });

    scoredColleges.sort((a, b) => b.matchScore - a.matchScore);
    return NextResponse.json({ matches: scoredColleges.slice(0, 12) });
  } catch (error) {
    console.error("Error in matching algorithm:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
