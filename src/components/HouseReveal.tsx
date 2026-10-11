import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { getAvatarForId } from '../data/avatars';
import type { Candidate, House } from '../types/database';

interface HouseRevealProps {
  houses: House[];
  candidates: Candidate[];
}

const ROLE_LABEL: Record<string, string> = {
  'Programmer': 'Programmer',
  '2D Artist': '2D Artist',
  '3D Artist': '3D Artist',
  'Game Designer': 'Game Designer',
};

const HouseReveal: React.FC<HouseRevealProps> = ({ houses, candidates }) => {
  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden select-none">
      {/* Header */}
      <header className="flex items-center justify-between px-12 pt-10 pb-6">
        <div className="flex items-baseline gap-6">
          <h1 className="font-display text-4xl font-black tracking-tight">
            HOUSE REVEAL
          </h1>
          <span className="font-display text-4xl font-black text-grey-600">
            FINAL LINEUPS
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-grey-400" />
          <span className="pill px-5 py-2 text-xs font-semibold uppercase text-grey-300">
            Phase 2 · Reveal
          </span>
        </div>
      </header>

      <div className="rule w-full h-px" />

      {/* Lineups */}
      <div className="flex-1 grid grid-cols-5 divide-x divide-white/10 min-h-0">
        {houses.map((house, houseIdx) => {
          const members = candidates.filter(c => c.drafted_to_house_id === house.id);
          const spent = house.initial_credits - house.remaining_credits;
          const usedAvatars = new Set<number>();

          return (
            <motion.div
              key={house.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: houseIdx * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col px-7 py-8 min-h-0"
            >
              {/* House header */}
              <div className="mb-6">
                <div className="font-display text-xs tracking-[0.35em] uppercase text-grey-500 mb-2">
                  House {houseIdx + 1}
                </div>
                <h2 className="font-display text-3xl font-black leading-tight">
                  {house.name}
                </h2>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-grey-500">{house.ob_lead}</span>
                  <span className="font-mono text-grey-400">
                    {spent} <span className="text-grey-600">spent</span>
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-black">
                    {members.length}
                  </span>
                  <span className="text-grey-600 text-xs uppercase tracking-widest">
                    members
                  </span>
                </div>
              </div>

              <div className="rule w-full h-px mb-5" />

              {/* Roster cards */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {members.length === 0 && (
                  <p className="text-grey-600 text-sm italic">No members drafted.</p>
                )}

                {members.map((member, i) => {
                  const avatar = getAvatarForId(member.id, usedAvatars);
                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: houseIdx * 0.12 + i * 0.08 + 0.2, duration: 0.45 }}
                      className="group flex items-center gap-4 card card-hover p-3 transition-colors"
                    >
                      {/* Pick number — jersey style */}
                      <div className="font-display text-2xl font-black text-grey-600 w-8 text-center tabular-nums group-hover:text-white transition-colors">
                        {i + 1}
                      </div>

                      {/* Avatar */}
                      <img
                        src={avatar}
                        alt={member.real_name}
                        className="w-14 h-14 rounded-full object-cover border border-white/15 grayscale group-hover:grayscale-0 transition-all duration-500"
                        loading="lazy"
                      />

                      {/* Name + role */}
                      <div className="min-w-0">
                        <div className="font-display font-bold text-lg leading-tight truncate">
                          {member.real_name}
                        </div>
                        <div className="text-xs uppercase tracking-wider text-grey-500">
                          {ROLE_LABEL[member.track] ?? member.track}
                        </div>
                      </div>

                      {/* Score chip */}
                      <div className="ml-auto text-right">
                        <div className="font-display text-sm font-bold text-grey-300 tabular-nums">
                          {member.winning_bid > 0 ? `${member.winning_bid}` : '—'}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-grey-600">
                          bid
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default HouseReveal;
