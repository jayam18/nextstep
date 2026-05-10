import { MapPin, Users, TrendingUp, DollarSign, X, ExternalLink, BookOpen, Activity, GraduationCap } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface CollegeModalProps {
  college: any;
  onClose: () => void;
}

export default function CollegeModal({ college, onClose }: CollegeModalProps) {
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">Acceptance Rate</p>
              <div className="text-xl font-bold text-white">{college.acceptanceRate}%</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">Undergraduates</p>
              <div className="text-xl font-bold text-white">{college.students.toLocaleString()}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">Net Price</p>
              <div className="text-xl font-bold text-white">${college.tuition.toLocaleString()}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">Avg GPA (Est.)</p>
              <div className="text-xl font-bold text-white">{college.avgGpa || 'N/A'}</div>
            </div>
          </div>

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
                <p className="text-gray-300 text-sm leading-relaxed">
                  {college.specialPrograms || 'Data currently unavailable for this institution.'}
                </p>
              </section>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Top Majors */}
              <section>
                <h3 className="flex items-center text-lg font-semibold text-white mb-4">
                  <GraduationCap className="w-5 h-5 mr-2 text-green-400" />
                  Top 5 Most Popular Majors
                </h3>
                {college.topMajors ? (
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

              {/* Clubs & Athletics */}
              <section>
                <h3 className="flex items-center text-lg font-semibold text-white mb-3">
                  <Users className="w-5 h-5 mr-2 text-orange-400" />
                  Student Life & Athletics
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {college.clubs || 'Data currently unavailable for this institution.'}
                </p>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {college.socialVibe && <span className="px-2.5 py-1 bg-white/10 rounded-full text-xs text-gray-300">{college.socialVibe}</span>}
                  {college.athleticsVibe && <span className="px-2.5 py-1 bg-white/10 rounded-full text-xs text-gray-300">{college.athleticsVibe}</span>}
                </div>
              </section>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
