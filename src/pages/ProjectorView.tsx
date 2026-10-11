import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, FileText, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSupabaseRealtime } from '../hooks/useSupabaseRealtime';
import { useAudio } from '../hooks/useAudio';
import { useEventBus } from '../hooks/useEventBus';
import SoldOverlay from '../components/SoldOverlay';
import HouseReveal from '../components/HouseReveal';
import { PLACEHOLDER_HOUSES, PLACEHOLDER_CANDIDATES } from '../data/placeholder';
import type { Candidate, House, Phase } from '../types/database';

const ProjectorView: React.FC = () => {
  const { candidates, houses, bidsLog, phase, loading } = useSupabaseRealtime();
  const audio = useAudio();
  const [currentCandidate, setCurrentCandidate] = useState<Candidate | null>(null);
  const [bidPulseKey, setBidPulseKey] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showRealName, setShowRealName] = useState(false);
  const [brokenMedia, setBrokenMedia] = useState<Record<string, boolean>>({});
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [timerSec, setTimerSec] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [soldInfo, setSoldInfo] = useState<{ candidate: Candidate; house: House | null; bid: number } | null>(null);
  const [phaseOverride, setPhaseOverride] = useState<Phase | null>(null);
  // Media sync state
  const [syncedMedia, setSyncedMedia] = useState<{
    candidateId: string;
    mediaIndex?: number;
    mediaType: 'video' | 'image' | 'pdf';
    mediaUrl: string;
    currentTime?: number;
    duration?: number;
    isPlaying?: boolean;
    isFullscreen?: boolean;
  } | null>(null);

  const allCandidates = candidates.length ? candidates : PLACEHOLDER_CANDIDATES;
  const allHouses = houses.length ? houses : PLACEHOLDER_HOUSES;

  // Effective phase: broadcast override wins, otherwise the persisted setting
  const effectivePhase = phaseOverride ?? phase;

  // If the persisted phase changes (via settings realtime), clear the override
  useEffect(() => {
    setPhaseOverride(null);
  }, [phase]);

  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 120,
      startVelocity: 45,
      scalar: 1.3,
      colors: ['#ffffff', '#d4d4d4', '#a3a3a3', '#737373'],
      zIndex: 9999,
    });
  };

  // ---- Listen to admin broadcasts (confetti, reveal, phase, candidate, timer, media) ----
  useEventBus((payload) => {
    if (payload.type === 'reveal_identity') {
      setShowRealName(Boolean(payload.value));
      if (soundEnabled) audio.playRevealSound();
    }
    if (payload.type === 'trigger_confetti') {
      fireConfetti();
    }
    if (payload.type === 'snake_done') {
      fireConfetti();
      if (soundEnabled) audio.playSoldSound();
    }
    if (
      (payload.type === 'advance_candidate' || payload.type === 'prev_candidate') &&
      typeof payload.value === 'string'
    ) {
      setPinnedId(payload.value);
      setShowRealName(false);
    }
    if (payload.type === 'start_timer') {
      if (typeof payload.value === 'number' && payload.value > 0) setTimerSec(payload.value);
      setTimerRunning(true);
    }
    if (payload.type === 'pause_timer') {
      setTimerRunning(false);
    }
    if (payload.type === 'reset_timer') {
      setTimerRunning(false);
      setTimerSec(60);
    }
    if (payload.type === 'set_phase' && typeof payload.value === 'string') {
      setPhaseOverride(payload.value as Phase);
    }
    if (payload.type === 'broadcast_bid' && typeof payload.value === 'number') {
      setBidPulseKey(k => k + 1);
      if (soundEnabled) audio.playBidSound();
    }
    if (payload.type === 'confirm_sold' && typeof payload.value === 'string') {
      const candidateId = payload.value;
      const candidate = allCandidates.find(c => c.id === candidateId);
      if (candidate && candidate.status === 'drafted') {
        const house = allHouses.find(h => h.id === candidate.drafted_to_house_id);
        setSoldInfo({ candidate, house: house ?? null, bid: candidate.winning_bid || 0 });
        fireConfetti();
        if (soundEnabled) audio.playSoldSound();
      }
    }
    if (payload.type === 'pass_candidate' && typeof payload.value === 'string') {
      setPinnedId(payload.value);
      setShowRealName(false);
    }
    if (payload.type === 'house_selected' && typeof payload.value === 'string') {
      // House selection sync - projector can update highlighted house state
    }
    // Media sync events
    if (payload.type === 'media_sync' && payload.media) {
      setSyncedMedia(payload.media);
    }
    if (payload.type === 'media_play' && payload.media) {
      setSyncedMedia(prev => prev ? { ...prev, ...payload.media!, isPlaying: true } : null);
    }
    if (payload.type === 'media_pause' && payload.media) {
      setSyncedMedia(prev => prev ? { ...prev, ...payload.media!, isPlaying: false } : null);
    }
    if (payload.type === 'media_seek' && payload.media) {
      setSyncedMedia(prev => prev ? { ...prev, ...payload.media!, currentTime: payload.media!.currentTime } : null);
    }
  });

  // Local synchronized countdown (mirrors admin timer)
  useEffect(() => {
    if (!timerRunning || timerSec <= 0) return;
    const id = setInterval(() => {
      setTimerSec(s => {
        if (s <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning, timerSec]);

  useEffect(() => {
    // Follow admin selection if pinned; otherwise auto-pick next on stage
    if (pinnedId) {
      const pinned = allCandidates.find(c => c.id === pinnedId);
      if (pinned) {
        setCurrentCandidate(pinned);
        return;
      }
    }
    const onStage =
      allCandidates.find(c => c.status === 'bidding') ||
      allCandidates.find(c => c.status === 'available') ||
      allCandidates[0];
    setCurrentCandidate(onStage);
  }, [allCandidates, pinnedId]);

  // Reset the identity reveal only when the on-stage candidate changes
  const currentId = currentCandidate?.id;
  useEffect(() => {
    setShowRealName(false);
  }, [currentId]);

  // Trigger the SOLD takeover when a candidate NEWLY gets drafted
  const draftedSeenRef = useRef<Set<string>>(new Set());
  const draftsInitializedRef = useRef(false);

  useEffect(() => {
    if (loading) return;

    // On first load, remember everyone already drafted so we don't replay old sales
    if (!draftsInitializedRef.current) {
      candidates.forEach(c => {
        if (c.status === 'drafted') draftedSeenRef.current.add(c.id);
      });
      draftsInitializedRef.current = true;
      return;
    }

    // A candidate that is no longer drafted (e.g. passed) can be sold again later
    candidates.forEach(c => {
      if (c.status !== 'drafted') draftedSeenRef.current.delete(c.id);
    });

    // Candidates that just transitioned to drafted
    const newlyDrafted = candidates.filter(
      c => c.status === 'drafted' && c.drafted_to_house_id && !draftedSeenRef.current.has(c.id)
    );
    if (newlyDrafted.length === 0) return;

    // Mark them all as handled
    newlyDrafted.forEach(c => draftedSeenRef.current.add(c.id));

    // Bulk assignment (snake draft) — skip the per-member takeover
    if (newlyDrafted.length > 1) return;

    const drafted = newlyDrafted[0];
    const house = allHouses.find(h => h.id === drafted.drafted_to_house_id);
    if (!house) return;

    const highest =
      bidsLog
        .filter(b => b.candidate_id === drafted.id)
        .reduce((m, b) => Math.max(m, b.bid_amount), 0) || drafted.winning_bid || 0;

    setSoldInfo({ candidate: drafted, house, bid: highest });
    fireConfetti();
    if (soundEnabled) audio.playSoldSound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates, allHouses]);


  // Bid pulse + sound on new bid for current candidate
  const lastBidIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (loading || bidsLog.length === 0) return;
    const latestBid = bidsLog[0];
    const prevId = lastBidIdRef.current;
    lastBidIdRef.current = latestBid.id;

    // Skip the first load and duplicate events (no beep just from fetching)
    if (prevId === null || prevId === latestBid.id) return;

    if (currentCandidate && latestBid.candidate_id === currentCandidate.id) {
      setBidPulseKey(k => k + 1);
      if (soundEnabled) audio.playBidSound();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bidsLog]);

  const getCurrentBid = () => {
    if (!currentCandidate) return { amount: 0, house: null };
    const candidateBids = bidsLog.filter(b => b.candidate_id === currentCandidate.id);
    if (! candidateBids.length) return { amount: 0, house: null };
    const highest = candidateBids.reduce((max, b) => Math.max(max, b.bid_amount), 0);
    const highestBid = candidateBids.find(b => b.bid_amount === highest);
    const house = highestBid ? allHouses.find(h => h.id === highestBid.house_id) : null;
    return { amount: highest, house: house ?? null };
  };

  const currentBid = getCurrentBid();
  const recentBids = currentCandidate
    ? bidsLog.filter(b => b.candidate_id === currentCandidate.id).slice(0, 5)
    : [];

  // Local reveal toggle with Space (admin can also broadcast reveal)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setShowRealName(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const renderMedia = (candidate: Candidate) => {
    // Check for synced media from admin
    const hasSyncedMedia = syncedMedia && syncedMedia.candidateId === candidate.id;

    if (brokenMedia[candidate.id] && !hasSyncedMedia) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-white/5">
          <FileText className="w-20 h-20 text-grey-600" strokeWidth={1} />
          <span className="font-display text-sm uppercase tracking-widest text-grey-500">
            Media unavailable
          </span>
        </div>
      );
    }

    // If we have synced media from admin, show that
    if (hasSyncedMedia && syncedMedia) {
      const sm = syncedMedia;
      if (sm.mediaType === 'video') {
        return (
          <SyncedProjectorVideo
            src={sm.mediaUrl}
            currentTime={sm.currentTime || 0}
            isPlaying={sm.isPlaying || false}
          />
        );
      }
      if (sm.mediaType === 'image') {
        return (
          <SyncedProjectorImage
            src={sm.mediaUrl}
            isFullscreen={sm.isFullscreen || false}
          />
        );
      }
    }

    // Default media display
    if (candidate.media_type === 'video') {
      return (
        <iframe
          src={candidate.media_url}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          onError={() => setBrokenMedia(m => ({ ...m, [candidate.id]: true }))}
        />
      );
    }
    if (candidate.media_type === 'image') {
      return (
        <img
          src={candidate.media_url}
          alt={candidate.anonymous_id}
          className="w-full h-full object-cover"
          onError={() => setBrokenMedia(m => ({ ...m, [candidate.id]: true }))}
        />
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center">
        <FileText className="w-24 h-24 text-grey-600" strokeWidth={1} />
      </div>
    );
  };

  // Synced video player for projector (read-only, controlled by admin)
  const SyncedProjectorVideo: React.FC<{
    src: string;
    currentTime: number;
    isPlaying: boolean;
  }> = ({ src, currentTime, isPlaying }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
      }
    }, [currentTime]);

    useEffect(() => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
      }
    }, [isPlaying]);

    return (
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        muted
        playsInline
      />
    );
  };

  // Synced image viewer for projector (read-only, controlled by admin)
  const SyncedProjectorImage: React.FC<{
    src: string;
    isFullscreen: boolean;
  }> = ({ src, isFullscreen }) => {
    const [isZoomed, setIsZoomed] = useState(false);

    return (
      <div className="relative w-full h-full" onClick={() => setIsZoomed(!isZoomed)}>
        <img 
          src={src} 
          alt="Synced media"
          className={`w-full h-full object-contain ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
        />
        {isFullscreen && (
          <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
            <img 
              src={src} 
              alt="Zoomed"
              className="max-w-[90vw] max-h-[90vh] object-contain"
            />
            <button 
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        )}
      </div>
    );
  };

  // ---- PHASE 2: House Reveal / final lineups ----
  if (effectivePhase === 'phase2') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="reveal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <HouseReveal houses={allHouses} candidates={allCandidates} />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      animate={soldInfo ? { x: [0, -12, 10, -8, 6, -3, 0], y: [0, 6, -5, 4, -2, 0] } : { x: 0, y: 0 }}
      transition={{ duration: 0.55 }}
      className="h-screen w-screen bg-black text-white flex flex-col select-none overflow-hidden"
    >
      {/* ============================================================
          TOP BAR — minimal
      ============================================================ */}
      <header className="flex items-center justify-between px-10 pt-8 pb-6">
        <div className="flex items-baseline gap-6">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            NGDC HOUSE DRAFT
          </h1>
          <span className="font-display text-3xl font-bold text-grey-500">
            2026
          </span>
        </div>

        <div className="flex items-center gap-8">
          {/* Synced countdown timer */}
          <AnimatePresence>
            {timerSec > 0 && (timerRunning || timerSec < 60) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-3"
              >
                <span className="font-display text-sm tracking-[0.3em] uppercase text-grey-500">
                  Clock
                </span>
                <span
                  className={`font-display text-3xl font-black tabular-nums ${
                    timerSec <= 10 ? 'text-white animate-pulse' : 'text-grey-200'
                  }`}
                >
                  {timerSec}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <span className="pill px-5 py-2 text-xs font-semibold uppercase text-grey-300">
            Phase 1 · Anchor Draft
          </span>
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              audio.setEnabled(next);
            }}
            className="text-grey-500 hover:text-white transition-colors"
            aria-label="Toggle sound"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="rule w-full h-px" />

      {/* ============================================================
          MAIN STAGE — artwork left, bid right
      ============================================================ */}
      <main className="flex-1 flex min-h-0">
        {currentCandidate ? (
          <>
            {/* LEFT — Artwork */}
            <section className="flex-1 flex flex-col justify-center px-16 min-w-0">
              <div className="mb-10">
                <div className="flex items-center gap-6 mb-8">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={showRealName ? 'real' : 'anon'}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                      className="font-display text-xl font-bold tracking-[0.2em] text-grey-400 uppercase"
                    >
                      {showRealName ? currentCandidate.real_name : currentCandidate.anonymous_id}
                    </motion.span>
                  </AnimatePresence>
                  <span className="w-12 h-px bg-white/20" />
                  <span className="pill px-4 py-1.5 text-xs font-medium uppercase text-grey-300">
                    {currentCandidate.track}
                  </span>
                  <span className="pill px-4 py-1.5 text-xs font-medium uppercase text-grey-300">
                    Score {currentCandidate.score}/15
                  </span>
                </div>
              </div>

              {/* Artwork — the hero element */}
              <motion.div
                key={currentCandidate.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative card rounded-none overflow-hidden w-full max-w-4xl aspect-video"
              >
                {renderMedia(currentCandidate)}

                {/* Identity reveal overlay */}
                <AnimatePresence>
                  {showRealName && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center gap-4"
                    >
                      {currentCandidate.avatar_url && (
                        <img
                          src={currentCandidate.avatar_url}
                          alt={currentCandidate.real_name}
                          className="w-32 h-32 rounded-full object-cover border-2 border-white/30"
                        />
                      )}
                      <div className="text-center">
                        <div className="font-display text-4xl font-black">
                          {currentCandidate.real_name}
                        </div>
                        {currentCandidate.contact && (
                          <div className="font-mono text-sm text-grey-400 mt-2">
                            {currentCandidate.contact}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mt-10 text-2xl text-grey-400 font-light italic leading-relaxed max-w-3xl"
              >
                “{currentCandidate.pitch}”
              </motion.p>
            </section>

            {/* Vertical divider */}
            <div className="rule w-px my-16" />

            {/* RIGHT — Bid spotlight */}
            <aside className="w-[42%] flex flex-col justify-center px-16 relative">
              {/* Drafted stamp */}
              <AnimatePresence>
                {currentCandidate.status === 'drafted' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 2, rotate: -8 }}
                    animate={{ opacity: 1, scale: 1, rotate: -4 }}
                    className="absolute top-16 left-16 z-20 border-4 border-white px-8 py-3"
                  >
                    <span className="font-display text-3xl font-black uppercase tracking-widest">
                      Drafted
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <span className="font-display text-sm font-semibold tracking-[0.35em] text-grey-500 uppercase mb-6">
                Current Highest Bid
              </span>

              {/* THE number */}
              <motion.div
                key={bidPulseKey}
                initial={{ scale: bidPulseKey > 0 ? 1.12 : 1 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="bid-display text-white"
                style={{ fontSize: 'clamp(10rem, 18vw, 20rem)' }}
              >
                {currentBid.amount}
              </motion.div>

              <span className="font-display text-2xl font-light text-grey-500 uppercase tracking-[0.3em] mt-2">
                Credits
              </span>

              {/* Leading house */}
              <div className="mt-14 flex items-center gap-5">
                <span className="font-display text-sm tracking-[0.35em] text-grey-500 uppercase">
                  Leading
                </span>
                <span className="flex-1 h-px bg-white/10" />
                <motion.span
                  key={currentBid.house?.id ?? 'none'}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-display text-4xl font-bold"
                >
                  {currentBid.house ? currentBid.house.name.toUpperCase() : '— NO BIDS —'}
                </motion.span>
              </div>

              {/* Recent bids — minimal list */}
              <div className="mt-16 space-y-0">
                <AnimatePresence>
                  {recentBids.map((bid, i) => {
                    const house = allHouses.find(h => h.id === bid.house_id);
                    if (!house) return null;
                    return (
                      <motion.div
                        key={bid.id}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="flex items-baseline justify-between py-3 border-b border-white/5"
                        style={{ opacity: 1 - i * 0.18 }}
                      >
                        <span className="font-display text-lg font-semibold text-grey-300">
                          {house.name}
                        </span>
                        <span className="font-display text-2xl font-bold tabular-nums">
                          {bid.bid_amount}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </aside>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-grey-600 text-xl font-light">Waiting for next candidate…</p>
          </div>
        )}
      </main>

      {/* ============================================================
          BOTTOM — House standings, minimal
      ============================================================ */}
      <footer className="border-t border-white/10">
        <div className="grid grid-cols-5 divide-x divide-white/10">
          {allHouses.map(house => {
            const isLeading = currentBid.house?.id === house.id;
            return (
              <div
                key={house.id}
                className={`px-8 py-6 transition-colors duration-500 ${
                  isLeading ? 'bg-white/[0.06]' : ''
                }`}
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span
                    className={`font-display text-sm font-semibold tracking-widest uppercase ${
                      isLeading ? 'text-white' : 'text-grey-400'
                    }`}
                  >
                    {house.name}
                  </span>
                  {isLeading && (
                    <span className="pill px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                      Leading
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="bid-display text-5xl font-black">
                    {house.remaining_credits}
                  </span>
                  <span className="text-grey-600 text-sm">/ {house.initial_credits}</span>
                </div>
              </div>
            );
          })}
        </div>
      </footer>

      {/* SOLD takeover overlay */}
      <AnimatePresence>
        {soldInfo && (
          <SoldOverlay
            key={`${soldInfo.candidate.id}-${soldInfo.bid}`}
            candidate={soldInfo.candidate}
            house={soldInfo.house}
            bid={soldInfo.bid}
            onDone={() => setSoldInfo(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProjectorView;
