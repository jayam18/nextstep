"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Search, GraduationCap, Compass, User, MessageSquarePlus } from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import { AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold text-white tracking-tight">
                Next<span className="text-gradient">Step</span>
              </span>
            </div>
            
            {/* Fit Quiz temporarily disabled — re-enable by restoring this block
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/quiz" className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                <Search className="w-4 h-4" />
                Fit Quiz
              </Link>
            </div>
            */}

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsFeedbackOpen(true)}
                className="text-gray-300 hover:text-white border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Feedback</span>
              </button>
              
              <button className="p-2 rounded-full hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
                <User className="w-5 h-5" />
              </button>
              <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-full transition-all glow">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isFeedbackOpen && (
          <FeedbackModal onClose={() => setIsFeedbackOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

