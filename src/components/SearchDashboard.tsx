"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, Sparkles, Loader2, ChevronDown } from 'lucide-react';
import CollegeCard from './CollegeCard';
import CollegeModal from './CollegeModal';

interface SearchDashboardProps {
  initialColleges: any[];
}

export default function SearchDashboard({ initialColleges }: SearchDashboardProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>(initialColleges);
  const [isSearching, setIsSearching] = useState(false);
  const [userState, setUserState] = useState<string | null>(null);
  const [userStateCode, setUserStateCode] = useState<string | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<any | null>(null);

  // Fetch user location on mount
  useEffect(() => {
    async function fetchLocation() {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && data.region_code) {
          setUserState(data.region); // e.g. "Illinois"
          setUserStateCode(data.region_code); // e.g. "IL"
          
          // Fetch curated for state
          const stateRes = await fetch(`/api/search?state=${data.region_code}`);
          const stateData = await stateRes.json();
          if (stateData.results && !stateData.fallback) {
            setResults(stateData.results);
          }
        }
      } catch (err) {
        console.error("Failed to detect location", err);
      }
    }
    fetchLocation();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query) {
      if (userStateCode) {
        setIsSearching(true);
        fetch(`/api/search?state=${userStateCode}`)
          .then(res => res.json())
          .then(data => {
            if (data.results) setResults(data.results);
            setIsSearching(false);
          })
          .catch(() => {
            setIsSearching(false);
          });
      } else {
        setResults(initialColleges);
      }
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, userStateCode]); // Removed initialColleges to prevent React loop if parent re-renders

  return (
    <>
      <section className="relative pt-4 pb-2 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-500/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-2">
            <Sparkles className="w-3 h-3" />
            <span>AI-Powered (in future) College Matching</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2">
            Find the college that <span className="text-gradient">fits your vibe.</span>
          </h1>
          
          <p className="text-sm md:text-base text-gray-400 mb-4 max-w-2xl mx-auto hidden sm:block">
            Search by major, location, or vibe. We analyze millions of data points to find where you truly belong.
          </p>

          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-md opacity-25 group-hover:opacity-40 transition duration-500" />
            <div className="relative glass rounded-2xl p-2 flex items-center">
              <div className="pl-4 pr-2">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, city, state, or 'vibe' (e.g., 'Urban', 'STEM focus')..." 
                className="w-full bg-transparent border-none text-white focus:ring-0 text-base md:text-lg placeholder-gray-500 py-3 outline-none"
              />
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors mr-2 border border-white/10">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="mt-8 flex justify-center animate-bounce opacity-60">
            <ChevronDown className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </section>

      <section className="pt-2 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[500px]">
        <div className="flex justify-between items-end mb-4">
          <div>
            {query ? (
              <h2 className="text-3xl font-bold mb-2">Search Results</h2>
            ) : (
              <h2 className="text-3xl font-bold mb-2">
                {userState ? `Curated for ${userState}` : 'Top Ranked Nationwide'}
              </h2>
            )}
            <p className="text-gray-400">
              {query ? `Showing matches for "${query}"` : 'Based on real federal data'}
            </p>
          </div>
        </div>

        {isSearching ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {results.map((college, idx) => (
                <motion.div
                  key={college.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                >
                  <CollegeCard 
                    {...college}
                    locationVibe={college.locationVibe}
                    socialVibe={college.socialVibe}
                    athleticsVibe={college.athleticsVibe}
                    academicVibe={college.academicVibe}
                    campusIdentity={college.campusIdentity}
                    logoUrl={college.logoUrl}
                    onClick={() => setSelectedCollege(college)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-gray-400">No colleges found matching "{query}"</p>
          </div>
        )}
      </section>

      <AnimatePresence>
        {selectedCollege && (
          <CollegeModal 
            college={selectedCollege} 
            onClose={() => setSelectedCollege(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}
