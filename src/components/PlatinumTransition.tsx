import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Zap } from 'lucide-react';
import { withAutoplay } from '../lib/media';
import type { Candidate } from '../types/database';

interface PlatinumTransitionProps {
  platinumCandidates: Candidate[];
  onComplete: () => void;
}

const PlatinumTransition: React.FC<PlatinumTransitionProps> = ({ platinumCandidates, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPitch, setShowPitch] = useState(false);

  // Platinum member display duration: pitch (3-5s) + work display (remaining)
  const PITCH_DURATION = 4000; // 4 seconds for pitch
  const WORK_DISPLAY_DURATION = 3000; // 3 seconds for work

  useEffect(() => {
    if (platinumCandidates.length === 0) {
      onComplete();
      return;
    }

    const cycleCandidate = () => {
      setShowPitch(true);
      
      // Show pitch for 4 seconds
      setTimeout(() => {
        setShowPitch(false);
        
        // Show work for 3 seconds
        setTimeout(() => {
          if (currentIndex < platinumCandidates.length - 1) {
            setCurrentIndex(i => i + 1);
          } else {
            // All platinum candidates shown
            setTimeout(() => onComplete(), 500);
          }
        }, WORK_DISPLAY_DURATION);
      }, PITCH_DURATION);
    };

    const timer = setTimeout(cycleCandidate, 100);
    return () => clearTimeout(timer);
  }, [currentIndex, platinumCandidates.length, onComplete]);

  const currentCandidate = platinumCandidates[currentIndex];

  if (!currentCandidate) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
    >
      {/* Background ambient glow */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, ease: 'easeOut' }}
        className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-amber-900/30"
      />

      {/* Particle burst */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.4, 0], scale: [0.5, 1.5, 2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.15) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-5xl px-8">
        {/* PLATINUM banner */}
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 flex items-center gap-6"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-amber-400"
            >
              <Crown className="w-12 h-12" />
            </motion.div>
            <div>
              <div className="font-display text-5xl md:text-7xl font-black uppercase tracking-[0.1em] text-amber-300">
                PLATINUM
              </div>
              <div className="font-display text-xl md:text-2xl font-light uppercase tracking-[0.3em] text-amber-500">
                TEAM LEADS
              </div>
            </div>
          </div>
          <motion.div
            animate={{ scaleX: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-48 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"
          />
        </motion.div>

        {/* Candidate counter */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4 }}
          className="mb-8 font-display text-lg font-medium text-amber-400/80 uppercase tracking-[0.2em]"
        >
          TEAM LEAD {currentIndex + 1} OF {platinumCandidates.length}
        </motion.div>

        {/* Main candidate card */}
        <motion.div
          key={currentCandidate.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl aspect-video relative"
        >
          {/* Media display */}
          <div className="absolute inset-0 rounded-none overflow-hidden">
            {currentCandidate.media_type === 'video' && (
              <iframe
                key={currentCandidate.id}
                src={withAutoplay(currentCandidate.media_url)}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            )}
            {currentCandidate.media_type === 'image' && (
              <img
                src={currentCandidate.media_url}
                alt={currentCandidate.anonymous_id}
                className="w-full h-full object-cover"
              />
            )}
            {currentCandidate.media_type === 'pdf' && (
              <div className="w-full h-full flex items-center justify-center bg-white/5">
                <svg className="w-24 h-24 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Pitch overlay - BIG DIALOGUE for 3-5 seconds */}
          <AnimatePresence mode="wait">
            {showPitch && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center z-20 px-8"
              >
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-center max-w-3xl"
                >
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <Zap className="w-8 h-8 text-amber-400" />
                    <span className="font-display text-2xl font-bold uppercase tracking-[0.2em] text-amber-400">
                      THEIR PITCH
                    </span>
                    <Zap className="w-8 h-8 text-amber-400" />
                  </div>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="font-display text-4xl md:text-5xl lg:text-6xl font-light leading-relaxed text-white"
                    style={{ textShadow: '0 0 60px rgba(255,215,0,0.3)' }}
                  >
                    "{currentCandidate.pitch}"
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Work display label */}
          <AnimatePresence mode="wait">
            {!showPitch && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/80 backdrop-blur-md px-6 py-3 rounded"
              >
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="font-display text-lg font-medium uppercase tracking-[0.15em] text-amber-300">
                  SHOWCASING WORK
                </span>
                <Zap className="w-5 h-5 text-amber-400" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Candidate info below */}
        <motion.div
          key={currentCandidate.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-10 text-center"
        >
          {currentCandidate.avatar_url && (
            <img
              src={currentCandidate.avatar_url}
              alt={currentCandidate.real_name}
              className="w-24 h-24 rounded-full object-cover border-4 border-amber-400/50 mx-auto mb-4"
            />
          )}
          <div className="font-display text-3xl md:text-4xl font-black mb-2">
            {currentCandidate.real_name}
          </div>
          <div className="font-display text-lg font-medium text-amber-400 uppercase tracking-[0.15em] mb-1">
            {currentCandidate.track}
          </div>
          <div className="text-grey-400 text-sm uppercase tracking-[0.2em]">
            {currentCandidate.anonymous_id}
          </div>
        </motion.div>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-16 flex items-center justify-center gap-2"
        >
          {platinumCandidates.map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentIndex
                  ? 'bg-amber-400 w-8 animate-pulse'
                  : i < currentIndex
                  ? 'bg-amber-400'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PlatinumTransition;