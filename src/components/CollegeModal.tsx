import { MapPin, Users, TrendingUp, DollarSign, X, ExternalLink, BookOpen, Activity, GraduationCap, ShieldCheck, Trophy, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getEffectiveTuition } from '@/lib/tuition';

interface CollegeModalProps {
  college: any;
  userStateCode?: string | null;
  onClose: () => void;
}

const PROGRAM_TYPE_LABELS: Record<string, string> = {
  'constituent-school': 'School',
  'honors-college': 'Honors',
  'co-op': 'Co-op',
  'research': 'Research',
  'accelerated': 'Accelerated',
  'study-abroad': 'Study Abroad',
  'pre-med': 'Pre-Med',
  'other': 'Signature',
};

export default function CollegeModal({ college, userStateCode, onClose }: CollegeModalProps) {
  if (!college) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      {/* Modal Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Hero */}
        <div className="relative h-48 sm:h-64 flex-shrink-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${college.imageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 flex items-end gap-6">
            {college.logoUrl && (
              <div className="w-24 h-24 bg-white rounded-xl p-2 shadow-xl border-4 border-gray-900 hidden sm:block flex-shrink-0">
                <img src={college.logoUrl} alt={`${college.name} logo`} className="w-full h-full object-contain" />
              </div>
            )}
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">{college.name}</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" />{college.location}</span>
                {college.website && (
                  <a href={college.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-400 hover:text-blue-300 transition-colors">
                    <ExternalLink className="w-4 h-4 mr-1" /> Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {/* Quick Stats Grid */}
          {(() => {
            const isPrivate = college.tuitionInState && college.tuitionOutOfState && college.tuitionInState === college.tuitionOutOfState;
            
            const tuitionInStateVal = college.tuitionInState !== undefined ? college.tuitionInState : null;
            const tuitionOutOfStateVal = college.tuitionOutOfState !== undefined ? college.tuitionOutOfState : null;

            const { tuition: displayTuition, rule, originalOutOfState } = getEffectiveTuition({
              tuitionInState: tuitionInStateVal,
              tuitionOutOfState: tuitionOutOfStateVal,
              tuition: college.tuition,
              location: college.location,
              reciprocity: college.reciprocity
            }, userStateCode || null);

            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-gray-400 text-xs mb-1">Acceptance Rate</p>
                    <div className="text-xl font-bold text-white">{college.acceptanceRate}%</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-gray-400 text-xs mb-1">Undergraduates</p>
                    <div className="text-xl font-bold text-white">{college.students.toLocaleString()}</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-gray-400 text-xs mb-1">Avg GPA (Est.)</p>
                    <div className="text-xl font-bold text-white">{college.avgGpa || 'N/A'}</div>
                  </div>

                  {isPrivate ? (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-gray-400 text-xs mb-1">Tuition</p>
                      <div className="text-xl font-bold text-white">
                        ${(college.tuitionInState || college.tuition).toLocaleString()}
                      </div>
                      {college.tuitionYear && <span className="text-[10px] text-gray-500">{college.tuitionYear}</span>}
                    </div>
                  ) : (
                    <>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-gray-400 text-xs mb-1">In-State Tuition</p>
                        <div className="text-xl font-bold text-white">
                          ${(college.tuitionInState || college.tuition).toLocaleString()}
                        </div>
                        {college.tuitionYear && <span className="text-[10px] text-gray-500">{college.tuitionYear}</span>}
                      </div>

                      {originalOutOfState ? (
                        <>
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4 opacity-50">
                            <p className="text-gray-400 text-xs mb-1">Out-of-State Tuition</p>
                            <div className="text-xl font-bold text-white line-through">
                              ${originalOutOfState.toLocaleString()}
                            </div>
                            {college.tuitionYear && <span className="text-[10px] text-gray-500">{college.tuitionYear}</span>}
                          </div>
                          
                          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 shadow-lg shadow-emerald-500/5">
                            <p className="text-emerald-400 text-xs mb-1 font-semibold">
                              {rule?.program} Tuition
                            </p>
                            <div className="text-xl font-bold text-white">
                              ${displayTuition.toLocaleString()}
                            </div>
                            {college.tuitionYear && <span className="text-[10px] text-emerald-400">{college.tuitionYear}</span>}
                          </div>
                        </>
                      ) : (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                          <p className="text-gray-400 text-xs mb-1">Out-of-State Tuition</p>
                          <div className="text-xl font-bold text-white">
                            ${(college.tuitionOutOfState || college.tuition).toLocaleString()}
                          </div>
                          {college.tuitionYear && <span className="text-[10px] text-gray-500">{college.tuitionYear}</span>}
                        </div>
                      )}
                    </>
                  )}

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Avg Net Price</p>
                      <div className="text-xl font-bold text-white">
                        ${(college.avgNetPrice || college.tuition).toLocaleString()}
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 leading-tight">
                      What families actually pay after aid, on average.
                    </span>
                  </div>
                </div>

                {rule && (
                  <div className="flex flex-col gap-1.5 p-4 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span className="font-semibold">
                        {rule.program} Reciprocity Program Rate Applied!
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 pl-7 leading-relaxed">
                      You are seeing a tuition of <strong>${displayTuition.toLocaleString()}/yr</strong> instead of the standard out-of-state rate of <strong>${originalOutOfState?.toLocaleString()}/yr</strong> because you are a resident of <strong>{userStateCode}</strong>.
                    </p>
                    {rule.conditions && (
                      <p className="text-xs text-gray-400 pl-7 mt-1">
                        <strong>Conditions:</strong> {rule.conditions}
                      </p>
                    )}
                    <div className="text-xs text-gray-400 pl-7 mt-1.5">
                      <a 
                        href={rule.sourceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 w-max"
                      >
                        Official {rule.program} Portal
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}

                {college.tuitionSourceUrl && (
                  <div className="flex justify-end mb-6 text-xs text-gray-500">
                    <a 
                      href={college.tuitionSourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-blue-400 transition-colors flex items-center gap-1"
                    >
                      Data Source: College Scorecard ({college.tuitionYear || '2023-24'})
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </>
            );
          })()}

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Test Scores */}
              <section>
                <h3 className="flex items-center text-lg font-semibold text-white mb-4">
                  <Activity className="w-5 h-5 mr-2 text-blue-400" />
                  Academic Requirements
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-gray-400">SAT Math (Midpoint)</span>
                    <span className="font-semibold text-white">{college.satMath || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-gray-400">SAT Reading (Midpoint)</span>
                    <span className="font-semibold text-white">{college.satReading || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-gray-400">ACT Composite</span>
                    <span className="font-semibold text-white">{college.actComposite || 'N/A'}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">*Scores reflect the midpoint of admitted students.</p>
              </section>

              {/* Special Programs */}
              <section>
                <h3 className="flex items-center text-lg font-semibold text-white mb-3">
                  <BookOpen className="w-5 h-5 mr-2 text-purple-400" />
                  Special Programs
                </h3>
                {college.programs?.length ? (
                  <div className="space-y-3">
                    {college.programs
                      .filter((p: any) => p.prominence === 1)
                      .map((p: any) => (
                        <div key={p.id} className="rounded-xl p-4 bg-gradient-to-br from-purple-500/15 to-blue-500/10 border border-purple-500/30">
                          <p className="text-[10px] uppercase tracking-wider text-purple-300 font-semibold mb-1">
                            🏛 Jewel of the university
                          </p>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-white">{p.name}</h4>
                            {p.sourceUrl && (
                              <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-purple-300 transition-colors flex-shrink-0" aria-label={`${p.name} source`}>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed mt-1">{p.description}</p>
                          {p.knownFor && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {p.knownFor.split(',').map((field: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-[11px] text-purple-300">
                                  {field.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    <ul className="space-y-2">
                      {college.programs
                        .filter((p: any) => p.prominence > 1)
                        .map((p: any) => (
                          <li key={p.id} className="bg-white/5 border border-white/5 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-medium text-gray-200">{p.name}</span>
                              <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0">
                                {PROGRAM_TYPE_LABELS[p.type] || 'Program'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed mt-1">{p.description}</p>
                            {p.knownFor && (
                              <p className="text-[11px] text-purple-300/80 mt-1">{p.knownFor}</p>
                            )}
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {college.specialPrograms || 'Data currently unavailable for this institution.'}
                  </p>
                )}
              </section>

              {/* Paying for It (G1) */}
              <section>
                <h3 className="flex items-center text-lg font-semibold text-white mb-1">
                  <DollarSign className="w-5 h-5 mr-2 text-emerald-400" />
                  Paying for It
                </h3>
                {college.netPrice48_75k != null && (
                  <p className="text-[11px] text-gray-500 mb-3">
                    Families earning $48k–$75k typically pay ~${college.netPrice48_75k.toLocaleString()}/yr here after aid.
                  </p>
                )}
                {college.aid?.length ? (
                  <div className="space-y-2">
                    {(() => {
                      const awardText = (a: any) => {
                        if (a.typicalAwardMin != null && a.typicalAwardMax != null) return `$${a.typicalAwardMin.toLocaleString()}–$${a.typicalAwardMax.toLocaleString()}/yr`;
                        if (a.typicalAwardMax != null) return `up to $${a.typicalAwardMax.toLocaleString()}/yr`;
                        if (a.typicalAwardMin != null) return `at least $${a.typicalAwardMin.toLocaleString()}/yr`;
                        return null;
                      };
                      const groups: [string, string, (a: any) => boolean][] = [
                        ['This college\'s aid pledge', 'institutional', (a) => a.kind === 'institutional'],
                        ['State grants & scholarships', 'state', (a) => a.kind === 'state' || a.kind === 'merit'],
                        ['Federal aid (all colleges)', 'federal', (a) => a.kind === 'federal'],
                      ];
                      return groups.map(([label, key, match]) => {
                        const entries = college.aid.filter(match);
                        if (!entries.length) return null;
                        const highlight = key === 'institutional';
                        return (
                          <div key={key}>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-3 mb-1.5">{label}</p>
                            <ul className="space-y-2">
                              {entries.map((a: any) => (
                                <li key={a.id} className={`rounded-lg p-3 border ${highlight ? 'relative mt-2 rotate-[-0.5deg] bg-emerald-500/10 border-emerald-500/25 shadow-[6px_6px_14px_rgba(0,0,0,0.45)]' : 'bg-white/5 border-white/5'}`}>
                                  {highlight && <span className="tape" aria-hidden="true" />}
                                  <div className="flex items-start justify-between gap-2">
                                    <span className={`text-sm font-medium ${highlight ? 'text-emerald-200' : 'text-gray-200'}`}>{a.name}</span>
                                    <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-emerald-300 transition-colors flex-shrink-0" aria-label={`${a.name} source: ${a.sourceName}`}>
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                  {(awardText(a) || a.awardNote) && (
                                    <p className={`text-xs mt-1 ${highlight ? 'text-emerald-300' : 'text-gray-300'}`}>
                                      {[awardText(a), a.awardNote].filter(Boolean).join(' — ')}
                                    </p>
                                  )}
                                  {a.eligibility && <p className="text-[11px] text-gray-500 mt-1">{a.eligibility}</p>}
                                  {a.howToApply && (
                                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-gray-400">
                                      Apply: {a.howToApply}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Aid data for this college is still being researched.</p>
                )}
              </section>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Majors & Outcomes */}
              <section>
                <h3 className="flex items-center text-lg font-semibold text-white mb-1">
                  <GraduationCap className="w-5 h-5 mr-2 text-green-400" />
                  Top Majors
                </h3>
                {college.majors?.length ? (
                  <>
                    <p className="text-[11px] text-gray-500 mb-3">
                      Hover over a major to see typical earnings and loan debt.
                    </p>
                    {(() => {
                      const renderMajor = (m: any) => {
                        const vsNational = m.medianEarnings4yr && m.medianEarnings4yrNational
                          ? m.medianEarnings4yr - m.medianEarnings4yrNational
                          : null;
                        const topQuartile = m.medianEarnings4yr && m.nationalP75 && m.medianEarnings4yr >= m.nationalP75;
                        const aboveMedian = vsNational != null && vsNational >= 0;
                        const ranking = m.rankings?.[0];
                        return (
                          <li key={m.id} className="group bg-white/5 rounded-lg p-3 border border-white/5 hover:border-green-500/20 transition-colors">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-sm font-medium text-gray-200">{m.name}</span>
                              {m.degreeShare != null && (
                                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded whitespace-nowrap flex-shrink-0">
                                  {m.degreeShare}% of degrees
                                </span>
                              )}
                            </div>
                            {(ranking || topQuartile || aboveMedian) && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                {ranking && (
                                  <a href={ranking.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/25 rounded-full text-[11px] text-amber-300 hover:bg-amber-500/20 transition-colors">
                                    <Trophy className="w-3 h-3" />
                                    {ranking.rank ? `#${ranking.rank}` : ''} {ranking.source} ({ranking.year})
                                  </a>
                                )}
                                {topQuartile ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-[11px] text-emerald-300">
                                    <TrendingUp className="w-3 h-3" />
                                    Top 25% nationally · grad earnings
                                  </span>
                                ) : aboveMedian ? (
                                  <span className="px-2 py-0.5 bg-emerald-500/5 border border-emerald-500/15 rounded-full text-[11px] text-emerald-300/80">
                                    Above national median · grad earnings
                                  </span>
                                ) : null}
                              </div>
                            )}
                            <div className="hidden group-hover:block mt-2">
                              {m.medianEarnings4yr ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full text-[11px] text-green-300">
                                    Median ${Math.round(m.medianEarnings4yr / 1000)}k · 4 yrs after grad
                                  </span>
                                  {vsNational != null && (
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] border ${vsNational >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                      {vsNational >= 0 ? '+' : '−'}${Math.round(Math.abs(vsNational) / 1000)}k vs national median
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <p className="text-[11px] text-gray-500">Earnings not reported for this program (cohort too small).</p>
                              )}
                              {m.medianDebt != null && (
                                <p className="text-[11px] text-gray-500 mt-1.5">
                                  Median federal loan debt at graduation: ${m.medianDebt.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      };
                      const topFive = college.majors.slice(0, 5);
                      const rankedExtras = college.majors.slice(5).filter((m: any) => m.rankings?.length);
                      return (
                        <>
                          <ul className="space-y-2">{topFive.map(renderMajor)}</ul>
                          {rankedExtras.length > 0 && (
                            <>
                              <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber-300/90 font-semibold mt-4 mb-2">
                                <Trophy className="w-3 h-3" />
                                Also nationally ranked
                              </p>
                              <ul className="space-y-2">{rankedExtras.map(renderMajor)}</ul>
                            </>
                          )}
                        </>
                      );
                    })()}
                    <a
                      href={college.majors[0].sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 justify-end mt-2 text-[11px] text-gray-500 hover:text-blue-400 transition-colors"
                    >
                      Earnings & debt: College Scorecard field-of-study data
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                ) : college.topMajors ? (
                  <ul className="space-y-2">
                    {college.topMajors.split(', ').map((major: string, i: number) => {
                      const [name, pct] = major.split(' (');
                      return (
                        <li key={i} className="flex justify-between items-center bg-white/5 rounded-lg p-3 border border-white/5">
                          <span className="text-sm font-medium text-gray-200">{name}</span>
                          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                            {pct.replace(')', '')} of degrees
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-sm">Major data not available.</p>
                )}
              </section>

              {/* Student Life */}
              <section>
                <h3 className="flex items-center text-lg font-semibold text-white mb-3">
                  <Sparkles className="w-5 h-5 mr-2 text-pink-400" />
                  Campus Vibe
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  {college.studentLifeSnippet || college.clubs || 'Data currently unavailable for this institution.'}
                </p>
                {college.socialVibe && <span className="inline-block px-2.5 py-1 bg-pink-500/10 border border-pink-500/20 rounded-full text-xs text-pink-300">{college.socialVibe}</span>}
              </section>

              {/* Athletics */}
              <section>
                <h3 className="flex items-center text-lg font-semibold text-white mb-3">
                  <Trophy className="w-5 h-5 mr-2 text-orange-400" />
                  Athletics Culture
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  {college.athleticsSnippet || 'Data currently unavailable for this institution.'}
                </p>
                {college.athleticsVibe && <span className="inline-block px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs text-orange-300">{college.athleticsVibe}</span>}
              </section>

              {/* Safety */}
              <section>
                <h3 className="flex items-center text-lg font-semibold text-white mb-3">
                  <ShieldCheck className="w-5 h-5 mr-2 text-emerald-400" />
                  Safety & Surroundings
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {college.safetySnippet || 'Data currently unavailable for this institution.'}
                </p>
              </section>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
