import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Candidate, House } from '../types/database';

interface SoldOverlayProps {
  candidate: Candidate;
  house: House | null;
  bid: number;
  onDone: () => void;
}

const HOUSE_COLORS = {
  'House Alpha': '#3B82F6',
  'House Bravo': '#A855F7',
  'House Crimson': '#EF4444',
  'House Emerald': '#10B981',
  'House Amber': '#FFB800',
};

const DISCO_COLORS = [
  '#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF',
  '#06D6A0', '#FF006E', '#FB5607', '#FFBE0B', '#8338EC',
];

const SoldOverlay: React.FC<SoldOverlayProps> = ({ candidate, house, bid, onDone }) => {
  const [displayBid, setDisplayBid] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const onDoneRef = useRef(onDone);
  const houseColor = house ? HOUSE_COLORS[house.name as keyof typeof HOUSE_COLORS] || '#FFFFFF' : '#FFFFFF';

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
      {/* Animated colorful backdrop */}
      <motion.div
        animate={{
          background: [
            'radial-gradient(ellipse at center, rgba(255,0,110,0.4) 0%, transparent 70%)',
            'radial-gradient(ellipse at center, rgba(251,86,7,0.4) 0%, transparent 70%)',
            'radial-gradient(ellipse at center, rgba(255,190,11,0.4) 0%, transparent 70%)',
            'radial-gradient(ellipse at center, rgba(131,56,236,0.4) 0%, transparent 70%)',
            'radial-gradient(ellipse at center, rgba(58,134,255,0.4) 0%, transparent 70%)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0"
      />

      {/* Moving light beams */}
      <motion.div
        animate={{
          rotate: [0, 360],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0deg 80deg, rgba(255,0,110,0.2) 80deg 100deg, transparent 100deg 260deg, rgba(251,86,7,0.2) 260deg 280deg, transparent 280deg 360deg)',
          maskImage: 'radial-gradient(circle, black 0%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 70%)',
        }}
      />

      {/* Disco ball sparkles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: [-100, 100],
            y: [-100, 100],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          className="absolute w-3 h-3 rounded-full"
          style={{
            background: DISCO_COLORS[i % DISCO_COLORS.length],
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            boxShadow: '0 0 20px currentColor, 0 0 40px currentColor',
          }}
        />
      ))}

      {/* Impact flash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.9, 0] }}
        transition={{ duration: 0.4, times: [0, 0.1, 1] }}
        className="absolute inset-0 bg-white z-30"
      />

      {/* Colorful speed-line burst */}
      <motion.div
        initial={{ opacity: 0, scale: 0.3, rotate: 0 }}
        animate={{
          opacity: [0, 0.5, 0.3, 0],
          scale: [0.3, 1.5, 1.2, 1.5],
          rotate: [0, 180, 360, 540],
        }}
        transition={{ duration: 4, ease: 'easeOut' }}
        className="absolute w-[160vmax] h-[160vmax]"
        style={{
          background:
            'conic-gradient(from 0deg, ' +
            DISCO_COLORS.map((c, i) => `${c} ${i * 36}deg ${(i + 1) * 36}deg`).join(', ') +
            ')',
          maskImage: 'radial-gradient(circle, black 0%, black 25%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 70%)',
        }}
      />

      {/* Radiating colored rings */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.6, scale: 0.15, borderColor: DISCO_COLORS[i % DISCO_COLORS.length] }}
          animate={{
            opacity: 0,
            scale: 3,
            borderColor: DISCO_COLORS[(i + 3) % DISCO_COLORS.length],
          }}
          transition={{ duration: 1.8, delay: i * 0.15, ease: 'easeOut' }}
          className="absolute rounded-full border-4"
          style={{ width: '50vmin', height: '50vmin' }}
        />
      ))}

      {/* House color rings */}
      {house && [0, 1, 2].map((i) => (
        <motion.div
          key={`house-${i}`}
          initial={{ opacity: 0.7, scale: 0.2, borderColor: houseColor }}
          animate={{
            opacity: 0,
            scale: 2.5,
            borderColor: houseColor,
          }}
          transition={{ duration: 2, delay: i * 0.1 + 0.3, ease: 'easeOut' }}
          className="absolute rounded-full border-4"
          style={{ width: '60vmin', height: '60vmin' }}
        />
      ))}

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center px-8 text-center">
        {/* SOLD stamp with rainbow gradient */}
        <motion.div
          initial={{ scale: 4.5, rotate: -18, opacity: 0 }}
          animate={{ scale: 1, rotate: -4, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15, mass: 1.4 }}
          className="relative"
        >
          <h1
            className="font-display font-black uppercase leading-none"
            style={{
              fontSize: 'clamp(6rem, 18vw, 16rem)',
              background: 'linear-gradient(45deg, #FF006E, #FB5607, #FFBE0B, #8338EC, #3A86FF, #06D6A0, #FF006E)',
              backgroundSize: '300% 300%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 60px rgba(255,0,110,0.5), 0 0 120px rgba(251,86,7,0.3)',
              WebkitTextStroke: '2px transparent',
            }}
          >
            Sold
          </h1>
        </motion.div>

        {/* Winning bid with house color */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 22 }}
          className="flex items-baseline gap-4 -mt-4"
        >
          <span
            className="font-display font-black tabular-nums"
            style={{
              fontSize: 'clamp(3rem, 8vw, 7rem)',
              lineHeight: 1,
              background: `linear-gradient(135deg, ${houseColor}, ${DISCO_COLORS[0]}, ${DISCO_COLORS[2]})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              backgroundSize: '200% 200%',
            }}
          >
            {displayBid}
          </span>
          <span className="font-display text-2xl md:text-3xl font-light uppercase tracking-[0.4em] text-grey-300">
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
            className="block w-16 h-px"
            style={{ background: `linear-gradient(90deg, ${houseColor}, ${DISCO_COLORS[2]}, ${houseColor})` }}
          />
          <span className="font-display text-xl md:text-2xl font-bold tracking-[0.2em] uppercase text-grey-400">
            Drafted To
          </span>
          <motion.span
            initial={{ x: -20, opacity: 0 }}
            animate={showDetails ? { x: 0, opacity: 1 } : {}}
            transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 20 }}
            className="font-display text-3xl md:text-5xl font-black uppercase"
            style={{
              background: `linear-gradient(135deg, ${houseColor}, ${DISCO_COLORS[0]}, ${DISCO_COLORS[2]})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {house?.name ?? '—'}
          </motion.span>
        </motion.div>

        {/* House badge with pulsing glow */}
        {house && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 300, damping: 20 }}
            className="mt-8 flex items-center gap-3"
            style={{ color: houseColor }}
          >
            <motion.span
              animate={{ boxShadow: ['0 0 10px', '0 0 30px 10px', '0 0 10px'] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="relative"
              style={{
                background: `linear-gradient(135deg, ${houseColor}22, ${houseColor}44)`,
                border: `2px solid ${houseColor}`,
                borderRadius: '12px',
                padding: '12px 24px',
              }}
            >
              <span className="font-display text-sm md:text-lg font-bold uppercase tracking-wider">
                {house.name.toUpperCase()} • TEAM LEAD ASSIGNED
              </span>
              <span
                className="absolute -inset-1 rounded-lg opacity-50 blur-xl animate-pulse"
                style={{ background: houseColor }}
              />
            </motion.span>
          </motion.div>
        )}
      </div>

      {/* Continuous confetti burst */}
      {Array.from({ length: 100 }).map((_, i) => {
          const tx = 'rotate(' + Math.random() * 45 + 'deg)';
          const left = 5 + Math.random() * 90;
          const radius = Math.random() > 0.5 ? '50%' : '0';
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 0, rotate: 0, scale: 0.5 }}
              animate={{
                y: [0, -800],
                rotate: [0, 720],
                opacity: [1, 0.8, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 1.5,
                ease: 'circOut',
                repeat: 999999,
                repeatDelay: Math.random() * 2,
              }}
              className="absolute w-2 h-2"
              style={{
                background: DISCO_COLORS[i % DISCO_COLORS.length],
                left: left + '%',
                top: '120%',
                borderRadius: radius,
                transform: tx,
              }}
            />
          );
        })}
    </motion.div>
  );
};

export default SoldOverlay;