"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Bug, 
  Lightbulb, 
  AlertTriangle, 
  MessageSquare, 
  Star, 
  Loader2, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

interface FeedbackModalProps {
  onClose: () => void;
}

const CATEGORIES = [
  { value: 'General', label: 'General', icon: MessageSquare, color: 'text-blue-400 border-blue-500/20 bg-blue-500/5' },
  { value: 'Bug', label: 'Bug Report', icon: Bug, color: 'text-red-400 border-red-500/20 bg-red-500/5' },
  { value: 'Feature idea', label: 'Feature Idea', icon: Lightbulb, color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
  { value: 'Data is wrong', label: 'Incorrect Data', icon: AlertTriangle, color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' },
];

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [category, setCategory] = useState('General');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setSubmitError('Message is required.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const pagePath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : 'Server';

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          message,
          email: email || undefined,
          rating: rating || undefined,
          pagePath,
          userAgent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback. Please try again.');
      }

      setIsSuccess(true);
      
      // Auto-close modal after 2.5 seconds on success
      setTimeout(() => {
        onClose();
      }, 2500);

    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      
      {/* Modal Box */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] glass-card"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          /* Success State */
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <CheckCircle className="w-16 h-16 text-green-500 mb-4 animate-pulse" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-2">Thank you!</h3>
            <p className="text-gray-300 text-sm max-w-sm mb-6">
              Your feedback helps us make NextStep better. We appreciate your response.
            </p>
            <button 
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-6 py-2 rounded-full transition-all duration-200"
            >
              Close
            </button>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-white/[0.01]">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                Submit Feedback
              </h2>
              <p className="text-gray-400 text-xs mt-1">
                Help us improve. Bug, feature request, or incorrect data? Let us know.
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh] custom-scrollbar">
              
              {/* Error Alert */}
              {submitError && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Category selector */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  Feedback Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-sm font-medium transition-all ${
                          isSelected 
                            ? 'border-blue-500 text-white bg-blue-500/10 shadow-lg shadow-blue-500/5 scale-[1.02]' 
                            : 'border-white/5 hover:border-white/10 text-gray-400 hover:text-gray-200 bg-white/5'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="feedback-message" className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  Your Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="feedback-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you experienced, what we should add, or what's wrong..."
                  className="w-full bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-xl p-3 text-white placeholder-gray-500 text-sm outline-none transition-all resize-none min-h-[100px]"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="feedback-email" className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Email Address <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <p className="text-[10px] text-gray-500 mb-2">
                  We will only contact you if we need clarification.
                </p>
                <input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-xl p-3 text-white placeholder-gray-500 text-sm outline-none transition-all"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  How valuable is this site so far? <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isLit = hoveredRating !== null 
                      ? star <= hoveredRating 
                      : rating !== null && star <= rating;
                    
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(null)}
                        className="p-1 rounded hover:bg-white/5 transition-colors focus:outline-none"
                      >
                        <Star 
                          className={`w-7 h-7 transition-all ${
                            isLit 
                              ? 'fill-amber-400 text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]' 
                              : 'text-gray-600 hover:text-gray-400'
                          }`}
                        />
                      </button>
                    );
                  })}
                  {rating !== null && (
                    <span className="text-xs text-gray-400 font-medium ml-2">
                      ({rating} out of 5)
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3 bg-white/[0.01]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-white/10 rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2 rounded-full transition-all duration-200 glow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
