"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CollegeCard from '@/components/CollegeCard';
import { Loader2, ArrowRight } from 'lucide-react';

const QUESTIONS = [
  {
    id: 'specialty',
    title: 'What do you want to study?',
    options: ['Business', 'Engineering', 'Arts', 'Computer Science', 'Biology', 'Undecided']
  },
  {
    id: 'preferredSetting',
    title: 'What kind of campus vibe do you prefer?',
    options: ['Urban', 'Suburban', 'Rural', 'Any']
  },
  {
    id: 'socialLifeImportance',
    title: 'How important is social life / Greek life to you?',
    options: ['Not Important', 'Somewhat Important', 'Very Important']
  },
  {
    id: 'sportsImportance',
    title: 'How important is a big sports culture?',
    options: ['Not Important', 'Somewhat Important', 'Very Important']
  },
  {
    id: 'maxTuition',
    title: 'What is your maximum annual tuition budget?',
    options: ['$20,000', '$40,000', '$60,000', 'No Limit']
  }
];

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleSelect = async (option: string) => {
    const currentQ = QUESTIONS[step];
    const newAnswers = { ...answers, [currentQ.id]: option };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      await submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers: Record<string, string>) => {
    setLoading(true);

    // Map string answers to API format
    const mapSocial = { 'Not Important': 1, 'Somewhat Important': 3, 'Very Important': 5 };
    const mapTuition = { '$20,000': 20000, '$40,000': 40000, '$60,000': 60000, 'No Limit': 100000 };

    const payload = {
      specialty: finalAnswers.specialty,
      preferredSetting: finalAnswers.preferredSetting,
      socialLifeImportance: mapSocial[finalAnswers.socialLifeImportance as keyof typeof mapSocial],
      sportsImportance: mapSocial[finalAnswers.sportsImportance as keyof typeof mapSocial],
      maxTuition: mapTuition[finalAnswers.maxTuition as keyof typeof mapTuition]
    };

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResults(data.matches || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (results.length > 0) {
    return (
      <div className="min-h-screen py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Your Top Matches</h1>
          <p className="text-gray-400">Based on your preferences, here are the colleges that fit you best.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((college, idx) => (
            <CollegeCard key={idx} {...college} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -z-10" />

      <div className="w-full max-w-2xl glass-card rounded-3xl p-8 md:p-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-center">Analyzing millions of data points...</h2>
            <p className="text-gray-400 mt-2 text-center">Finding your perfect college fit.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <div className="text-sm font-medium text-blue-400 mb-2">Step {step + 1} of {QUESTIONS.length}</div>
                <h2 className="text-3xl font-bold leading-tight">{QUESTIONS[step].title}</h2>
              </div>
              
              <div className="space-y-4">
                {QUESTIONS[step].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(opt)}
                    className="w-full text-left px-6 py-4 rounded-xl glass border border-white/10 hover:border-blue-500/50 hover:bg-white/5 transition-all group flex justify-between items-center"
                  >
                    <span className="text-lg font-medium">{opt}</span>
                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:text-blue-400 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
