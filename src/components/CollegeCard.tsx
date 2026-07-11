import { MapPin, Users, TrendingUp, DollarSign, HeartPulse } from 'lucide-react';
import Image from 'next/image';
import { getEffectiveTuition } from '@/lib/tuition';
import { getPremedPath } from '@/lib/premed';

interface CollegeCardProps {
  name: string;
  location: string;
  acceptanceRate: number;
  tuition: number;
  students: number;
  imageUrl: string;
  tags: string | string[]; // Can be array or comma-separated string from DB
  matchScore?: number; // From Fit Engine
  ranking?: number;
  careerPaths?: { id: string, name: string }[];
  locationVibe?: string;
  socialVibe?: string;
  athleticsVibe?: string;
  academicVibe?: string;
  campusIdentity?: string;
  logoUrl?: string;
  onClick?: () => void;
  // T1 Tuition Props
  tuitionInState?: number | null;
  tuitionOutOfState?: number | null;
  avgNetPrice?: number | null;
  userStateCode?: string | null;
  // T2 Reciprocity Props
  reciprocity?: any[];
  // S1 Programs (used for the pre-med path chip)
  programs?: any[];
}

export default function CollegeCard({ 
  name, 
  location, 
  acceptanceRate, 
  tuition, 
  students, 
  imageUrl, 
  tags,
  matchScore,
  ranking,
  careerPaths,
  locationVibe,
  socialVibe,
  athleticsVibe,
  academicVibe,
  campusIdentity,
  logoUrl,
  onClick,
  tuitionInState,
  tuitionOutOfState,
  avgNetPrice,
  userStateCode,
  reciprocity,
  programs
}: CollegeCardProps) {
  const parsedTags = typeof tags === 'string' ? tags.split(',') : tags;
  const premedPath = getPremedPath(programs);

  // Determine state-aware tuition with reciprocity helper
  const tuitionInStateVal = tuitionInState !== undefined ? tuitionInState : null;
  const tuitionOutOfStateVal = tuitionOutOfState !== undefined ? tuitionOutOfState : null;

  const { tuition: displayTuition, rule, isLocal, originalOutOfState } = getEffectiveTuition({
    tuitionInState: tuitionInStateVal,
    tuitionOutOfState: tuitionOutOfStateVal,
    tuition,
    location,
    reciprocity
  }, userStateCode || null);

  let tuitionTypeLabel = '';
  if (isLocal) {
    tuitionTypeLabel = 'In-State';
  } else if (rule) {
    tuitionTypeLabel = `${rule.program} Rate`;
  } else if (tuitionInStateVal !== null && tuitionOutOfStateVal !== null && tuitionInStateVal !== tuitionOutOfStateVal) {
    tuitionTypeLabel = 'Out-of-State';
  }

  return (
    <div 
      onClick={onClick}
      className="desk-card glass-card rounded-2xl group cursor-pointer"
    >
      <div className="relative h-48 w-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-6 rounded-t-2xl overflow-hidden">
        {/* Background removed as requested, using logo instead */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] to-transparent opacity-90" />
        
        {/* Match Score Badge */}
        {matchScore !== undefined && (
          <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md border border-blue-500/30 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <span className="text-blue-400">★</span>
            {Math.round(matchScore)}% Match
          </div>
        )}

        {/* Ranking Badge */}
        {ranking !== undefined && (
          <div className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur-md border border-white/10 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
            #{ranking}
          </div>
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pb-12">
          {logoUrl ? (
            <div className="w-24 h-24 bg-white rounded-2xl p-2 shadow-xl border-4 border-gray-900 relative overflow-hidden group-hover:scale-105 transition-transform mb-2">
              <img src={logoUrl} alt={`${name} logo`} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-24 h-24 bg-gray-800 rounded-2xl border-4 border-gray-900 flex items-center justify-center mb-2">
               <span className="text-gray-500 text-xs text-center px-2">No Logo</span>
            </div>
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3 z-10">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{name}</h3>
            <div className="flex items-center text-sm text-gray-300">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              {location}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-5">
        <div className="grid grid-cols-3 gap-4 mb-5 pb-5 border-b border-white/5">
          <div>
            <p className="text-xs text-gray-400 mb-1">Acceptance</p>
            <div className="flex items-center text-sm font-semibold text-white">
              <TrendingUp className="w-3.5 h-3.5 mr-1 text-green-400" />
              {acceptanceRate}%
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Tuition</p>
            <div className="flex flex-col">
              <div className="flex items-center text-sm font-semibold text-white">
                <DollarSign className="w-3.5 h-3.5 mr-0.5 text-blue-400" />
                <span>{(displayTuition / 1000).toFixed(1)}k</span>
                {originalOutOfState && (
                  <span className="line-through text-[11px] text-gray-500 font-normal ml-1.5">
                    ${(originalOutOfState / 1000).toFixed(0)}k
                  </span>
                )}
              </div>
              {tuitionTypeLabel && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 mt-1 rounded-md inline-block w-max leading-none ${
                  tuitionTypeLabel.includes('In-State') || tuitionTypeLabel.includes('MSEP') || tuitionTypeLabel.includes('WUE') || tuitionTypeLabel.includes('ACM') || tuitionTypeLabel.includes('NEBHE')
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {tuitionTypeLabel}
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Students</p>
            <div className="flex items-center text-sm font-semibold text-white">
              <Users className="w-3.5 h-3.5 mr-1 text-purple-400" />
              {(students / 1000).toFixed(1)}k
            </div>
          </div>
        </div>
        
        {/* Career Paths */}
        {careerPaths && careerPaths.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {careerPaths.map((career) => (
              <span key={career.id} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs font-semibold rounded-md border border-purple-500/30">
                {career.name}
              </span>
            ))}
          </div>
        )}

        {/* Categorical Vibes */}
        <div className="flex flex-wrap gap-2">
          {premedPath && (
            <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-xs font-semibold text-rose-300 border border-rose-500/25 inline-flex items-center gap-1">
              <HeartPulse className="w-3 h-3" />
              {premedPath === 'direct' ? 'Direct Med Path' : 'Med Early Assurance'}
            </span>
          )}
          {locationVibe && <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-xs font-medium text-blue-300 border border-blue-500/20">{locationVibe}</span>}
          {socialVibe && <span className="px-2.5 py-1 rounded-full bg-pink-500/10 text-xs font-medium text-pink-300 border border-pink-500/20">{socialVibe}</span>}
          {athleticsVibe && <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-xs font-medium text-orange-300 border border-orange-500/20">{athleticsVibe}</span>}
          {academicVibe && <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-xs font-medium text-emerald-300 border border-emerald-500/20">{academicVibe}</span>}
          {campusIdentity && <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-xs font-medium text-indigo-300 border border-indigo-500/20">{campusIdentity}</span>}

          {/* Legacy Tags (if any exist) */}
          {parsedTags.filter(t => t.trim()).map((tag: string, idx: number) => (
            <span key={idx} className="px-2.5 py-1 rounded-full bg-white/5 text-xs font-medium text-gray-300 border border-white/10">
              {tag.trim()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
