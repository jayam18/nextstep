import { NextResponse } from 'next/server';
import collegesData from '@/data/colleges.json';

// The dataset contains duplicate rows for some institutions (IPEDS matching
// artifacts). Keep one row per name, preferring the one with a logo, then the
// better (lower) ranking.
function dedupeByName(colleges: any[]): any[] {
  const seen = new Map<string, any>();
  for (const c of colleges) {
    const prev = seen.get(c.name);
    if (!prev) {
      seen.set(c.name, c);
      continue;
    }
    const preferCurrent =
      (!prev.logoUrl && c.logoUrl) ||
      (!!prev.logoUrl === !!c.logoUrl && (c.ranking ?? Infinity) < (prev.ranking ?? Infinity));
    if (preferCurrent) seen.set(c.name, c);
  }
  return [...seen.values()];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const state = searchParams.get('state'); // e.g. "California" or "CA"

    const colleges = collegesData as any[];
    // Pre-filter to only include colleges with an acceptance rate > 0
    const validColleges = dedupeByName(colleges.filter(c => c.acceptanceRate > 0));

    if (q) {
      const searchTerms = q.toLowerCase().split(' ').filter(t => t.trim() !== '');
      
      const results = validColleges.filter(college => {
        // Every search term must match AT LEAST ONE field (AND logic across terms, OR logic across fields)
        return searchTerms.every(term => {
          const inName = college.name?.toLowerCase().includes(term);
          const inAliases = college.aliases?.toLowerCase().includes(term);
          const inLocation = college.location?.toLowerCase().includes(term);
          const inTags = college.tags?.toLowerCase().includes(term);
          const inLocVibe = college.locationVibe?.toLowerCase().includes(term);
          const inSocVibe = college.socialVibe?.toLowerCase().includes(term);
          const inAthVibe = college.athleticsVibe?.toLowerCase().includes(term);
          const inAcadVibe = college.academicVibe?.toLowerCase().includes(term);
          const inIdenVibe = college.campusIdentity?.toLowerCase().includes(term);
          const inCareer = college.careerPaths?.some((p: any) => p.name.toLowerCase().includes(term));
          // S1: match constituent schools & signature programs ("Wharton", "Grainger", "co-op")
          const inPrograms = college.programs?.some((p: any) =>
            p.name.toLowerCase().includes(term) ||
            p.knownFor?.toLowerCase().includes(term) ||
            p.type.toLowerCase().includes(term)
          );
          // M1: match majors ("aerospace", "nursing", "computer science")
          const inMajors = college.majors?.some((m: any) => m.name.toLowerCase().includes(term));

          return inName || inAliases || inLocation || inTags || inLocVibe || inSocVibe || inAthVibe || inAcadVibe || inIdenVibe || inCareer || inPrograms || inMajors;
        });
      });

      return NextResponse.json({ results: results.slice(0, 12), total: results.length });
    } else if (state) {
      // Curated by state
      const stateMatch = validColleges.filter(c => 
        c.location.includes(`, ${state}`) || c.location.includes(state)
      );

      // Sort by acceptance rate (asc)
      stateMatch.sort((a, b) => a.acceptanceRate - b.acceptanceRate);

      if (stateMatch.length === 0) {
        // Fallback
        validColleges.sort((a, b) => a.acceptanceRate - b.acceptanceRate);
        return NextResponse.json({ results: validColleges.slice(0, 6), fallback: true });
      }

      return NextResponse.json({ results: stateMatch.slice(0, 6) });
    }

    // Default fallback if no params
    validColleges.sort((a, b) => a.acceptanceRate - b.acceptanceRate);
    return NextResponse.json({ results: validColleges.slice(0, 6) });

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
