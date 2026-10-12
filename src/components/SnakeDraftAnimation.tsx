import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, ArrowRight, ArrowLeft, Users } from 'lucide-react';
import { withAutoplay } from '../lib/media';
import type { Candidate, House } from '../types/database';
import type { SnakeAssignment } from '../lib/snake';

interface SnakeDraftAnimationProps {
  assignments: SnakeAssignment[];
  candidates: Candidate[];
  houses: House[];
  onComplete: () => void;
  duration?: number; // 5-7 seconds
}

const SnakeDraftAnimation: React.FC<SnakeDraftAnimationProps> = ({
  assignments,
  candidates,
  houses,
  onComplete,
  duration = 6000,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);

  // Get candidate and house for each assignment
  const getCandidate = (id: string) => candidates.find(c => c.id === id);
  const getHouse = (id: string) => houses.find(h => h.id === id);

  useEffect(() => {
    if (assignments.length === 0) {
      onComplete();
      return;
    }

    // Calculate step duration to fit within total duration
    const stepDuration = duration / Math.max(assignments.length, 1);
    let step = 0;

    const interval = setInterval(() => {
      if (step < assignments.length) {
        setCurrentStep(step);
        step++;
      } else {
        clearInterval(interval);
        setIsAnimating(false);
        setShowResult(true);
        // Show final result for 2 seconds then complete
        setTimeout(() => onComplete(), 2000);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [assignments.length, duration, onComplete]);

  // Current assignment being animated
  const currentAssignment = assignments[currentStep];
  const currentCandidate = currentAssignment ? getCandidate(currentAssignment.candidateId) : null;
  const currentHouse = currentAssignment ? getHouse(currentAssignment.houseId) : null;

  // All assignments grouped by house for final display
  const assignmentsByHouse = assignments.reduce((acc, a) => {
    if (!acc[a.houseId]) acc[a.houseId] = [];
    acc[a.houseId].push(a);
    return acc;
  }, {} as Record<string, SnakeAssignment[]>);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Animated background */}
      <motion.div
        animate={{
          background: [
            'radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, transparent 70%)',
            'radial-gradient(ellipse at center, rgba(168,85,247,0.15) 0%, transparent 70%)',
            'radial-gradient(ellipse at center, rgba(239,68,68,0.15) 0%, transparent 70%)',
            'radial-gradient(ellipse at center, rgba(16,185,129,0.15) 0%, transparent 70%)',
            'radial-gradient(ellipse at center, rgba(255,184,0,0.15) 0%, transparent 70%)',
          ]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0"
      />

      {/* Grid lines animation */}
      <motion.div
        animate={{
          opacity: [0.1, 0.3, 0.1],
          scale: [0.9, 1.1, 0.9]
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {!showResult ? (
        // ANIMATION PHASE - Shows each pick
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-6xl px-8">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 flex items-center gap-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="text-purple-400"
            >
              <Shuffle className="w-10 h-10" />
            </motion.div>
            <div>
              <div className="font-display text-4xl md:text-6xl font-black uppercase tracking-[0.1em] bg-gradient-to-r from-blue-400 via-purple-400 to-amber-400 bg-clip-text text-transparent">
                SNAKE DRAFT
              </div>
              <div className="font-display text-lg font-light uppercase tracking-[0.3em] text-grey-400">
                Balanced Team Distribution
              </div>
            </div>
          </motion.div>

          {/* Progress */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-8 font-display text-xl font-medium text-grey-300 uppercase tracking-[0.15em]"
          >
            PICK {currentStep + 1} OF {assignments.length}
          </motion.div>

          {/* Main animation card */}
          <motion.div
            key={currentAssignment?.candidateId ?? 'waiting'}
            initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 1.1, rotateY: -15 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-4xl aspect-video relative card overflow-hidden"
          >
            {/* Candidate media */}
            {currentCandidate && (
              <>
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
              </>
            )}

            {/* House assignment reveal */}
            <AnimatePresence mode="wait">
              {currentHouse && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -40 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col items-center justify-end p-8 z-10"
                >
                  <div className="text-center w-full max-w-md">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <motion.span
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="text-3xl"
                      >
                        {currentHouse.id === 'house-1' ? '🔵' : currentHouse.id === 'house-2' ? '🟣' : currentHouse.id === 'house-3' ? '🔴' : currentHouse.id === 'house-4' ? '🟢' : '🟡'}
                      </motion.span>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="font-display text-3xl md:text-4xl font-black uppercase tracking-[0.05em]"
                        style={{ color: currentHouse.color_hex }}
                      >
                        {currentHouse.name.toUpperCase()}
                      </motion.div>
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
                      className="flex items-center justify-center gap-4"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-center"
                      >
                        <div className="font-display text-2xl font-bold text-grey-300">CANDIDATE</div>
                        <div className="font-display text-xl font-medium text-white mt-1">
                          {currentCandidate?.anonymous_id}
                        </div>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ delay: 0.25, duration: 0.4 }}
                        className="w-px h-12 bg-white/30"
                      />
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-center"
                      >
                        <div className="font-display text-2xl font-bold text-grey-300">PICK</div>
                        <div className="font-display text-xl font-medium text-white mt-1">
                          #{currentAssignment.pickNumber}
                        </div>
                      </motion.div>
                    </motion.div>

                    {currentCandidate && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                        className="mt-6 font-display text-sm font-medium uppercase tracking-[0.2em] text-grey-400"
                      >
                        {currentCandidate.track}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Direction indicator - snake pattern */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isAnimating ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-grey-500"
            >
              <motion.span
                animate={{ x: [-10, 10, -10] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <ArrowLeft className="w-6 h-6" />
              </motion.span>
              <span className="font-display text-xs uppercase tracking-[0.3em]">SNAKE ORDER</span>
              <motion.span
                animate={{ x: [-10, 10, -10] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
              >
                <ArrowRight className="w-6 h-6" />
              </motion.span>
            </motion.div>
          </motion.div>

          {/* Candidate queue preview */}
          <div className="mt-8 w-full max-w-4xl">
            <div className="font-display text-sm font-medium uppercase tracking-[0.15em] text-grey-500 mb-4">
              UPCOMING PICKS
            </div>
            <div className="flex gap-2 overflow-x-auto pb-4">
              {assignments.slice(currentStep + 1, currentStep + 6).map((a, i) => {
                const c = getCandidate(a.candidateId);
                const h = getHouse(a.houseId);
                if (!c || !h) return null;
                return (
                  <motion.div
                    key={a.candidateId}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    className="flex-shrink-0 w-40 card flex flex-col items-center p-3 border-l-4"
                    style={{ borderColor: h.color_hex }}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden mb-2 bg-white/10">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt={c.anonymous_id} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-6 h-6 text-grey-500 mx-auto mt-3" />
                      )}
                    </div>
                    <div className="font-display text-xs font-bold text-center text-white">
                      {c.anonymous_id}
                    </div>
                    <div className="text-[10px] text-center text-grey-500 uppercase tracking-[0.1em]">
                      → {h.name}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        // FINAL RESULT PHASE
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-7xl px-8 py-8"
        >
          <div className="text-center mb-10">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="inline-flex items-center gap-3 mb-4"
            >
              <Users className="w-8 h-8 text-green-400" />
              <span className="font-display text-3xl md:text-4xl font-black uppercase tracking-[0.1em] text-green-400">
                SNAKE DRAFT COMPLETE
              </span>
              <Users className="w-8 h-8 text-green-400" />
            </motion.div>
            <div className="font-display text-lg font-light uppercase tracking-[0.3em] text-grey-400">
              All {assignments.length} candidates distributed across 5 houses
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4">
            {houses.map((house, i) => {
              const houseAssignments = assignmentsByHouse[house.id] || [];
              const houseCandidates = houseAssignments.map(a => getCandidate(a.candidateId)).filter(Boolean) as Candidate[];
              
              return (
                <motion.div
                  key={house.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="card flex flex-col h-full border-l-4"
                  style={{ borderColor: house.color_hex }}
                >
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: house.color_hex }} />
                      <span className="font-display text-lg font-bold" style={{ color: house.color_hex }}>
                        {house.name.toUpperCase()}
                      </span>
                    </div>
                    <div className="font-display text-3xl font-black text-white">
                      {houseCandidates.length}
                    </div>
                    <div className="text-grey-500 text-sm uppercase tracking-[0.1em]">MEMBERS</div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {houseCandidates.length === 0 ? (
                      <p className="text-grey-600 text-sm italic text-center py-8">No members assigned</p>
                    ) : (
                      houseCandidates.map((candidate, idx) => (
                        <motion.div
                          key={candidate.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 + idx * 0.05 + 0.3, duration: 0.3 }}
                          className="flex items-center gap-3 p-2 bg-white/5 rounded"
                        >
                          <span className="font-display text-sm font-bold text-grey-500 w-6 text-center">
                            {idx + 1}
                          </span>
                          {candidate.avatar_url && (
                            <img src={candidate.avatar_url} alt={candidate.real_name} className="w-8 h-8 rounded-full object-cover" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate text-white">{candidate.real_name}</div>
                            <div className="text-[10px] text-grey-500 uppercase tracking-[0.1em]">{candidate.track}</div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SnakeDraftAnimation;