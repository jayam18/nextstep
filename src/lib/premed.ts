// Pre-med path detection from S1 CollegeProgram rows.
// Tier 1 "direct": BS/MD-style guaranteed/conditional admission programs.
// Tier 2 "early-assurance": apply mid-college for guaranteed med school admission.
// Standard pre-med advising (tier 3) is deliberately not badged — nearly every
// college offers it, so a badge would carry no information.

const DIRECT_MED = /BS\/MD|BA\/MD/i;

export type PremedPath = 'direct' | 'early-assurance' | null;

export function getPremedPath(programs?: { type: string; name: string; knownFor?: string | null }[]): PremedPath {
  if (!programs?.length) return null;
  if (programs.some(p => p.type === 'accelerated' && DIRECT_MED.test(`${p.name} ${p.knownFor ?? ''}`))) {
    return 'direct';
  }
  if (programs.some(p => p.type === 'pre-med')) {
    return 'early-assurance';
  }
  return null;
}
