import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Candidate, House } from '../types/database';

interface SoldOverlayProps {
  candidate: Candidate;
  house: House;
  bid: number;
  onDone: () => void;
}

/**
 * Full-screen "SOLD!" takeover animation shown on the projector when the
 * moderator confirms a draft. Sequence:
 *   1. Impact flash + screen shake
 *   2. Rotating speed-line burst
 *   3. Giant SOLD! slam-in with over-scaling
 *   4. Winning bid counter + house banner slide
 *   5. Hold, then fade out (auto-dismiss)
 */
const SoldOverlay: React.FC<SoldOverlayProps> = ({ candidate, house, bid, onDone }) => {
  const [displayBid, setDisplayBid] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // Animate the bid counter
  useEffect(() => {
    let frame = 0;
    const total = 24;
    const id = setInterval(() => {
      frame += 1;
      const t = 1 - Math.pow(1 - frame / total, 3);
      setDisplayBid(Math.round(t * bid));
      if (frame >= total) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [bid]);

  // Reveal details slightly after the slam
  useEffect(() => {
    const t = setTimeout(() => setShowDetails(true), 550);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss — runs once on mount, unaffected by parent re-renders
  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current(), 5200);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[9998] flex items-center justify-center overflow-hidden"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/92 backdrop-blur-xl" />

      {/* Impact flash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0] }}
        transition={{ duration: 0.5, times: [0, 0.15, 1] }}
        className="absolute inset-0 bg-white z-30"
      />

      {/* Rotating speed-line burst */}
      <motion.div
        initial={{ opacity: 0, scale: 0.4, rotate: 0 }}
        animate={{ opacity: [0, 0.35, 0.2], scale: [0.4, 1.25, 1.1], rotate: 220 }}
        transition={{ duration: 5, ease: 'easeOut' }}
        className="absolute w-[160vmax] h-[160vmax]"
        style={{
          background:
            'repeating-conic-gradient(from 0deg, rgba(255,255,255,0.28) 0deg 1.2deg, transparent 1.2deg 9deg)',
          maskImage: 'radial-gradient(circle, black 0%, black 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 70%)',
        }}
      />

      {/* Radiating rings */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5, scale: 0.2 }}
          animate={{ opacity: 0, scale: 2.4 }}
          transition={{ duration: 1.6, delay: i * 0.22, ease: 'easeOut' }}
          className="absolute rounded-full border-2 border-white/40"
          style={{ width: '40vmin', height: '40vmin' }}
        />
      ))}

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center px-8 text-center">
        {/* SOLD stamp */}
        <motion.div
          initial={{ scale: 4.5, rotate: -18, opacity: 0 }}
          animate={{ scale: 1, rotate: -6, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 16, mass: 1.4 }}
          className="relative"
        >
          <h1
            className="font-display font-black uppercase leading-none text-white"
            style={{
              fontSize: 'clamp(6rem, 18vw, 16rem)',
              WebkitTextStroke: '3px #fff',
              textShadow: '0 0 80px rgba(255,255,255,0.35)',
            }}
          >
            Sold
          </h1>
        </motion.div>

        {/* Winning bid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 22 }}
          className="flex items-baseline gap-4 -mt-4"
        >
          <span
            className="font-display font-black tabular-nums text-white"
            style={{ fontSize: 'clamp(3rem, 8vw, 7rem)', lineHeight: 1 }}
          >
            {displayBid}
          </span>
          <span className="font-display text-2xl md:text-3xl font-light uppercase tracking-[0.4em] text-grey-400">
            Credits
          </span>
        </motion.div>

        {/* Candidate → House banner */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={showDetails ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          className="mt-10 flex items-center gap-6"
        >
          <span className="font-display text-xl md:text-2xl font-bold tracking-[0.2em] uppercase text-grey-300">
            {candidate.anonymous_id}
          </span>
          <motion.span
            initial={{ scaleX: 0 }}
            animate={showDetails ? { scaleX: 1 } : {}}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="block w-16 h-px bg-white/40 origin-center"
          />
          <span className="font-display text-xl md:text-2xl font-bold tracking-[0.2em] uppercase text-grey-500">
            Drafted To
          </span>
          <motion.span
            initial={{ x: -20, opacity: 0 }}
            animate={showDetails ? { x: 0, opacity: 1 } : {}}
            transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 20 }}
            className="font-display text-3xl md:text-5xl font-black uppercase text-white"
          >
            {house.name}
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SoldOverlay;
