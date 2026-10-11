import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2, VolumeX, ChevronLeft, ChevronRight,
  Send, Zap, UserCheck, SkipForward, PartyPopper, Play, Pause, RotateCcw,
  Shuffle, LayoutGrid, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon,
  Expand, X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';
import { useAudio } from '../hooks/useAudio';
import { broadcastEvent } from '../hooks/useEventBus';
import { runBalancedSnakeDraft } from '../lib/snake';
import { PLACEHOLDER_HOUSES, PLACEHOLDER_CANDIDATES } from '../data/placeholder';
import type { Candidate, House, BidLog, Phase } from '../types/database';

// ============================================================
// Media Player Components for Admin ↔ Projector Sync
// ============================================================

interface BaseMediaInfo {
  candidateId: string;
  mediaType: 'video' | 'image' | 'pdf';
  mediaUrl: string;
  mediaIndex?: number;
  action?: 'play' | 'pause' | 'seek' | 'sync';
}

interface SyncedMediaProps {
  src: string;
  onSync?: (media: BaseMediaInfo) => void;
  candidateId: string;
  mediaType: 'video' | 'image' | 'pdf';
}

const SyncedVideoPlayer: React.FC<SyncedMediaProps & { 
  onPlay?: (info: BaseMediaInfo) => void;
  onPause?: (info: BaseMediaInfo) => void;
  onSeek?: (info: BaseMediaInfo, currentTime: number) => void;
}> = ({ 
  src, candidateId, mediaType, onPlay, onPause, onSeek 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mediaRef = useRef<BaseMediaInfo>({ candidateId, mediaType, mediaUrl: src });

  const handlePlay = () => {
    setIsPlaying(true);
    onPlay?.(mediaRef.current);
  };

  const handlePause = () => {
    setIsPlaying(false);
    onPause?.(mediaRef.current);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onSeek?.(mediaRef.current, time);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      />
      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center gap-3 text-white">
          <button onClick={togglePlay} className="p-2 bg-white/20 rounded-full hover:bg-white/30">
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => {
                const time = parseFloat(e.target.value);
                setCurrentTime(time);
                if (videoRef.current) {
                  videoRef.current.currentTime = time;
                }
                onSeek?.(mediaRef.current, time);
              }}
              className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
            />
          </div>
          <span className="text-xs font-mono text-grey-300">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <button 
            onClick={toggleFullscreen} 
            className="p-2 bg-white/20 rounded-full hover:bg-white/30"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <X className="w-5 h-5" /> : <Expand className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

const SyncedImageViewer: React.FC<SyncedMediaProps> = ({ 
  src, onSync, candidateId, mediaType 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mediaRef = useRef<BaseMediaInfo>({ candidateId, mediaType, mediaUrl: src });

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Sync fullscreen state with admin
    onSync?.(mediaRef.current);
  };

  return (
    <div className="relative w-full h-full" onClick={handleFullscreen}>
      <img 
        src={src} 
        alt="Candidate media"
        className={`w-full h-full object-contain ${isFullscreen ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
      />
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <img 
            src={src} 
            alt="Candidate media fullscreen"
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
          <button 
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      )}
      <div className="absolute bottom-2 right-2 text-xs text-grey-400 bg-black/50 px-2 py-1 rounded">
        Click to expand
      </div>
    </div>
  );
};

interface ImageCarouselProps {
  images: string[];
  candidateId: string;
  onSync?: (media: BaseMediaInfo) => void;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ 
  images, candidateId, onSync 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const goToNext = () => {
    setCurrentIndex(i => (i + 1) % images.length);
    onSync?.({
      candidateId,
      mediaIndex: (currentIndex + 1) % images.length,
      mediaType: 'image',
      mediaUrl: images[(currentIndex + 1) % images.length],
    });
  };
  const goToPrev = () => {
    setCurrentIndex(i => (i - 1 + images.length) % images.length);
    onSync?.({
      candidateId,
      mediaIndex: (currentIndex - 1 + images.length) % images.length,
      mediaType: 'image',
      mediaUrl: images[(currentIndex - 1 + images.length) % images.length],
    });
  };

  return (
    <div className="relative w-full h-full">
      {!isFullscreen && (
        <>
          <button 
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full hover:bg-white/30 z-10"
            aria-label="Previous image"
          >
            <ChevronLeftIcon className="w-6 h-6 text-white" />
          </button>
          <button 
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full hover:bg-white/30 z-10"
            aria-label="Next image"
          >
            <ChevronRightIcon className="w-6 h-6 text-white" />
          </button>
        </>
      )}
      <img 
        src={images[currentIndex]} 
        alt={`Image ${currentIndex + 1}`}
        className={`w-full h-full object-contain ${isFullscreen ? 'cursor-zoom-out' : ''}`}
        onClick={() => setIsFullscreen(true)}
      />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to image ${i + 1}`}
          />
        ))}
      </div>
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <button 
            onClick={goToPrev}
            className="absolute left-4 p-3 bg-white/20 rounded-full hover:bg-white/30"
            aria-label="Previous image"
          >
            <ChevronLeftIcon className="w-8 h-8 text-white" />
          </button>
          <img 
            src={images[currentIndex]} 
            alt={`Image ${currentIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
          <button 
            onClick={goToNext}
            className="absolute right-4 p-3 bg-white/20 rounded-full hover:bg-white/30"
            aria-label="Next image"
          >
            <ChevronRightIcon className="w-8 h-8 text-white" />
          </button>
          <button 
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-3 bg-white/20 rounded-full hover:bg-white/30"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-3 h-3 rounded-full transition-all ${
                  i === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 text-xs text-grey-400 bg-black/50 px-2 py-1 rounded">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const AdminView: React.FC = () => {
  const audio = useAudio();
  const [candidates, setCandidates] = useState<Candidate[]>(PLACEHOLDER_CANDIDATES);
  const [houses, setHouses] = useState<House[]>(PLACEHOLDER_HOUSES);
  const [bidsLog, setBidsLog] = useState<BidLog[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null);
  const [customBid, setCustomBid] = useState<string>('');
  const [showRealName, setShowRealName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timerSec, setTimerSec] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [phase, setPhase] = useState<Phase>('phase1');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const currentCandidate = candidates[currentIdx];

  // Fetch initial data + subscribe to realtime
  useEffect(() => {
    (async () => {
      const [candRes, houseRes, bidRes, setRes] = await Promise.all([
        supabase.from('candidates').select('*').order('id'),
        supabase.from('houses').select('*').order('id'),
        supabase.from('bids_log').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('settings').select('*').eq('key', 'phase').maybeSingle(),
      ]);
      if (candRes.data && candRes.data.length) setCandidates(candRes.data as Candidate[]);
      if (houseRes.data && houseRes.data.length) setHouses(houseRes.data as House[]);
      if (bidRes.data) setBidsLog(bidRes.data as BidLog[]);
      if (!setRes.error && setRes.data) setPhase(setRes.data.value as Phase);
    })();

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' } as any, (payload: any) => {
        if (payload.eventType === 'UPDATE') {
          setCandidates(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c));
        }
        if (payload.eventType === 'INSERT') {
          setCandidates(prev => (prev.some(c => c.id === payload.new.id) ? prev : [...prev, payload.new]));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'houses' } as any, (payload: any) => {
        if (payload.eventType === 'UPDATE') {
          setHouses(prev => prev.map(h => h.id === payload.new.id ? { ...h, ...payload.new } : h));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids_log' } as any, (payload: any) => {
        setBidsLog(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' } as any, (payload: any) => {
        if (payload.new?.key === 'phase') setPhase(payload.new.value as Phase);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;
    if (timerActive && timerSec > 0) {
      id = setInterval(() => {
        setTimerSec(s => {
          if (s <= 1) { clearInterval(id!); setTimerActive(false); return 0; }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(id);
  }, [timerActive, timerSec]);

  // Keep the latest handlers/targets in a ref so keyboard shortcuts never
  // fire against stale closures (a bug when navigating candidates quickly).
  const latest = useRef({
    toggleTimer: () => {},
    confirmSold: () => {},
    nextCand: () => {},
    prevCand: () => {},
    houses: [] as House[],
    setSelectedHouseId: (_: string | null) => {},
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.tagName === 'INPUT') return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          latest.current.toggleTimer();
          break;
        case 'Enter':
          latest.current.confirmSold();
          break;
        case 'ArrowRight':
          latest.current.nextCand();
          break;
        case 'ArrowLeft':
          latest.current.prevCand();
          break;
        case '1': case '2': case '3': case '4': case '5':
          latest.current.setSelectedHouseId(latest.current.houses[Number(e.key) - 1]?.id ?? null);
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const toggleTimer = () => {
    const nextActive = !timerActive;
    const startFrom = timerSec > 0 ? timerSec : 60;
    if (timerSec === 0) setTimerSec(60);
    setTimerActive(nextActive);
    broadcastEvent({ type: nextActive ? 'start_timer' : 'pause_timer', value: startFrom });
  };
  const nextCand = () => {
    if (currentIdx < candidates.length - 1) {
      const nextId = candidates[currentIdx + 1].id;
      setCurrentIdx(i => i + 1);
      resetTimer();
      broadcastEvent({ type: 'advance_candidate', value: nextId });
    }
  };
  const prevCand = () => {
    if (currentIdx > 0) {
      const prevId = candidates[currentIdx - 1].id;
      setCurrentIdx(i => i - 1);
      resetTimer();
      broadcastEvent({ type: 'prev_candidate', value: prevId });
    }
  };
  const resetTimer = () => { setTimerActive(false); setTimerSec(60); };

  const showMsg = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const bid = async (amount: number) => {
    if (!amount || amount <= 0) {
      showMsg('err', 'Enter a valid bid amount');
      return;
    }
    if (!currentCandidate || !selectedHouseId) {
      showMsg('err', 'Select a house first');
      return;
    }
    if (currentCandidate.status === 'drafted') {
      showMsg('err', 'This candidate is already drafted');
      return;
    }
    const house = houses.find(h => h.id === selectedHouseId);
    if (!house) return;
    if (house.remaining_credits < amount) {
      showMsg('err', `${house.name} lacks ${amount - house.remaining_credits} credits`);
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('bids_log').insert({
      candidate_id: currentCandidate.id,
      house_id: selectedHouseId,
      bid_amount: amount,
    });

    if (error) {
      showMsg('err', error.message);
      setLoading(false);
      return;
    }

    // Mark the candidate as bidding (so the projector locks onto them)
    if (currentCandidate.status === 'available') {
      await supabase.from('candidates').update({ status: 'bidding' }).eq('id', currentCandidate.id);
      setCandidates(prev => prev.map(c =>
        c.id === currentCandidate.id ? { ...c, status: 'bidding' } : c
      ));
    }

    if (soundEnabled) audio.playBidSound();
    setBidsLog(prev => [
      { id: Date.now(), candidate_id: currentCandidate.id, house_id: selectedHouseId!, bid_amount: amount, created_at: new Date().toISOString() },
      ...prev,
    ]);
    showMsg('ok', `${house.name} bid ${amount}`);
    setCustomBid('');
    setLoading(false);
  };

  const confirmSold = async () => {
    if (!currentCandidate || loading) return;
    if (currentCandidate.status === 'drafted') {
      showMsg('err', 'Already drafted');
      return;
    }

    // Determine the actual winning bid + house (highest bid for this candidate)
    const candidateBids = bidsLog.filter(b => b.candidate_id === currentCandidate.id);
    const highest = candidateBids.reduce((m, b) => Math.max(m, b.bid_amount), 0);
    if (highest === 0) {
      showMsg('err', 'No bids to confirm — use PASS instead');
      return;
    }

    const winningBid = candidateBids.find(b => b.bid_amount === highest)!;
    const winnerHouseId = winningBid.house_id;
    const winnerHouse = houses.find(h => h.id === winnerHouseId);
    if (!winnerHouse) return;

    if (selectedHouseId && selectedHouseId !== winnerHouseId) {
      showMsg('ok', `Highest bidder is ${winnerHouse.name} — drafting to them`);
    }

    setLoading(true);
    await supabase.from('candidates').update({
      status: 'drafted',
      drafted_to_house_id: winnerHouseId,
      winning_bid: highest,
    }).eq('id', currentCandidate.id);

    await supabase.from('houses').update({
      remaining_credits: Math.max(0, winnerHouse.remaining_credits - highest),
    }).eq('id', winnerHouseId);

    setCandidates(prev => prev.map(c =>
      c.id === currentCandidate.id
        ? { ...c, status: 'drafted', drafted_to_house_id: winnerHouseId, winning_bid: highest }
        : c
    ));
    setHouses(prev => prev.map(h =>
      h.id === winnerHouseId
        ? { ...h, remaining_credits: Math.max(0, h.remaining_credits - highest) }
        : h
    ));

    if (soundEnabled) {
      audio.playSoldSound();
      confetti({ particleCount: 80, spread: 120, scalar: 1.2 });
    }

    showMsg('ok', `${currentCandidate.anonymous_id} → ${winnerHouse.name} for ${highest}`);
    nextCand();
    setLoading(false);
  };

  const handlePass = async () => {
    if (!currentCandidate || loading) return;
    setLoading(true);
    await supabase.from('candidates').update({
      status: 'available', winning_bid: 0, drafted_to_house_id: null,
    }).eq('id', currentCandidate.id);

    setCandidates(prev => prev.map(c =>
      c.id === currentCandidate.id ? { ...c, status: 'available', winning_bid: 0, drafted_to_house_id: null } : c
    ));
    showMsg('ok', `${currentCandidate.anonymous_id} passed — added to snake pool`);
    nextCand();
    setLoading(false);
  };

  // Broadcast confetti to projector + fire locally
  const triggerConfetti = () => {
    broadcastEvent({ type: 'trigger_confetti' });
    confetti({
      particleCount: 100,
      spread: 120,
      startVelocity: 45,
      scalar: 1.3,
      colors: ['#ffffff', '#d4d4d4', '#a3a3a3', '#737373'],
      zIndex: 9999,
    });
  };

  // Broadcast reveal identity to projector
  const toggleReveal = () => {
    const next = !showRealName;
    setShowRealName(next);
    broadcastEvent({ type: 'reveal_identity', value: next });
  };

  // Timer controls that broadcast state to projector
  const startTimer = () => {
    const startFrom = timerSec > 0 ? timerSec : 60;
    if (timerSec === 0) setTimerSec(60);
    setTimerActive(true);
    broadcastEvent({ type: 'start_timer', value: startFrom });
  };
  const pauseTimer = () => {
    setTimerActive(false);
    broadcastEvent({ type: 'pause_timer', value: timerSec });
  };
  const resetTimerBroadcast = () => {
    resetTimer();
    broadcastEvent({ type: 'reset_timer' });
  };

  // ---- Phase control (draft ↔ reveal) ----
  const togglePhase = async (next: Phase) => {
    setPhase(next);
    broadcastEvent({ type: 'set_phase', value: next });
    await supabase.from('settings').upsert({ key: 'phase', value: next });
    showMsg('ok', next === 'phase2' ? 'Switched to House Reveal' : 'Switched to Anchor Draft');
  };

  // ---- Snake draft of leftover members ----
  const leftovers = candidates.filter(c => c.status !== 'drafted');
  
  // Calculate current member counts per house for balanced distribution
  const memberCounts = new Map<string, number>();
  houses.forEach(h => memberCounts.set(h.id, 0));
  candidates.filter(c => c.status === 'drafted').forEach(c => {
    if (c.drafted_to_house_id) {
      memberCounts.set(c.drafted_to_house_id, (memberCounts.get(c.drafted_to_house_id) || 0) + 1);
    }
  });

  const runSnake = async () => {
    if (leftovers.length === 0) {
      showMsg('err', 'No leftover members to assign');
      return;
    }
    const result = runBalancedSnakeDraft(leftovers, houses, memberCounts);
    setLoading(true);
    for (const a of result.assignments) {
      await supabase.from('candidates').update({
        status: 'drafted',
        drafted_to_house_id: a.houseId,
        winning_bid: 0,
      }).eq('id', a.candidateId);
    }
    setCandidates(prev => prev.map(c => {
      const a = result.assignments.find(x => x.candidateId === c.id);
      return a ? { ...c, status: 'drafted', drafted_to_house_id: a.houseId, winning_bid: 0 } : c;
    }));
    broadcastEvent({ type: 'snake_done' });
    if (soundEnabled) audio.playSoldSound();
    showMsg('ok', `Balanced snake draft complete — ${result.assignments.length} members assigned`);
    setLoading(false);
  };

  // Keep keyboard shortcut targets fresh on every render
  latest.current = { toggleTimer, confirmSold, nextCand, prevCand, houses, setSelectedHouseId };

  if (!currentCandidate) {
    return <div className="p-8 text-grey-500">No candidates loaded.</div>;
  }

  const trackLabel: Record<string, string> = {
    'Programmer': 'Programmer',
    '2D Artist': '2D',
    '3D Artist': '3D',
    'Game Designer': 'Designer',
  };

  // Media sync helpers
  const broadcastMediaSync = useCallback((media: BaseMediaInfo) => {
    broadcastEvent({ type: 'media_sync', media: { ...media, action: 'sync' } });
  }, []);

  const broadcastMediaPlay = useCallback((media: BaseMediaInfo) => {
    broadcastEvent({ type: 'media_play', media: { ...media, action: 'play' } });
  }, []);

  const broadcastMediaPause = useCallback((media: BaseMediaInfo) => {
    broadcastEvent({ type: 'media_pause', media: { ...media, action: 'pause' } });
  }, []);

  const broadcastMediaSeek = useCallback((media: BaseMediaInfo, currentTime: number) => {
    broadcastEvent({ type: 'media_seek', media: { ...media, action: 'seek', currentTime } });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8 overflow-hidden">
      <div className="max-w-7xl mx-auto h-screen flex flex-col">

        {/* HEADER */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl font-black tracking-tight">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                audio.setEnabled(next);
              }}
              className="p-2 text-grey-500 hover:text-white transition-colors"
              aria-label="Sound"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <span className="font-mono text-sm text-grey-500">
              [Space] bid timer  [Enter] confirm  [1-5] house  [←/→] navigate
            </span>
          </div>
        </header>

        <AnimatePresence>
          {msg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 font-mono text-sm rounded ${
                msg.type === 'ok'
                  ? 'bg-white/10 border border-white/20 text-white'
                  : 'bg-red-400/10 border border-red-400/30 text-red-300'
              }`}
            >
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
          {/* LEFT — candidate list */}
          <nav className="col-span-2 overflow-y-auto pr-2">
            <div className="space-y-1">
              {candidates.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setCurrentIdx(i);
                    setSelectedHouseId(null);
                    resetTimer();
                    broadcastEvent({ type: 'advance_candidate', value: c.id });
                  }}
                  className={`w-full text-left p-2 rounded transition-all ${
                    i === currentIdx
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="font-display text-sm">{c.anonymous_id}</div>
                  <div className="text-xs text-grey-400 mt-0.5">
                    {trackLabel[c.track]} · {c.score}/15
                  </div>
                </button>
              ))}
            </div>
</nav>

            {/* CENTER — candidate preview + controls */}
          <section className="col-span-5 flex flex-col">
            {/* Media / candidate card */}
            <div className="card mb-4 aspect-video overflow-hidden relative">
              {/* Multiple images carousel */}
              {currentCandidate.media_type === 'image' && currentCandidate.media_urls && currentCandidate.media_urls.length > 1 && (
                <ImageCarousel 
                  images={currentCandidate.media_urls}
                  candidateId={currentCandidate.id}
                  onSync={broadcastMediaSync}
                />
              )}
              {currentCandidate.media_type === 'video' && (
                <SyncedVideoPlayer 
                  src={currentCandidate.media_url}
                  candidateId={currentCandidate.id}
                  mediaType="video"
                  onPlay={broadcastMediaPlay}
                  onPause={broadcastMediaPause}
                  onSeek={broadcastMediaSeek}
                />
              )}
              {currentCandidate.media_type === 'image' && (!currentCandidate.media_urls || currentCandidate.media_urls.length <= 1) && (
                <SyncedImageViewer 
                  src={currentCandidate.media_url}
                  candidateId={currentCandidate.id}
                  mediaType="image"
                  onSync={broadcastMediaSync}
                />
              )}
              {currentCandidate.media_type === 'pdf' && (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <Send className="w-16 h-16 text-grey-400" />
                </div>
              )}
            </div>

            {/* Pitch */}
            <blockquote className="text-sm italic text-grey-300 mb-4">
              "{currentCandidate.pitch}"
            </blockquote>

            {/* Track + status row */}
            <div className="flex items-center gap-3 mb-4">
              <span className="pill px-3 py-1 text-xs uppercase text-grey-300">
                {currentCandidate.track}
              </span>
              <span className={`pill px-3 py-1 text-xs font-semibold ${
                currentCandidate.status === 'drafted' ? 'text-white' :
                currentCandidate.status === 'bidding' ? 'text-blue-400' :
                'text-grey-400'
              }`}>
                {currentCandidate.status.toUpperCase()}
              </span>
            </div>

            {/* Reveal toggle + Confetti trigger */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={toggleReveal}
                className={`pill px-3 py-1.5 text-xs font-medium transition-colors ${
                  showRealName ? 'bg-white text-black' : 'hover:bg-white/10'
                }`}
              >
                <UserCheck className="w-4 h-4 inline mr-1" />
                {showRealName ? 'Hide Identity' : 'Reveal Identity'}
              </button>
              <button
                onClick={triggerConfetti}
                className="pill px-3 py-1.5 text-xs font-medium hover:bg-white/10 transition-colors"
              >
                <PartyPopper className="w-4 h-4 inline mr-1" />
                Confetti
              </button>
            </div>

            {/* Reveal view */}
            <AnimatePresence>
              {showRealName && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-4 card"
                >
                  <div className="font-bold">{currentCandidate.real_name}</div>
                  <div className="text-sm text-grey-400">{currentCandidate.contact}</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={prevCand}
                disabled={currentIdx === 0}
                className="p-2 bg-white/5 border border-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-display text-2xl font-bold w-40 text-center">
                {currentCandidate.anonymous_id}
              </span>
              <button
                onClick={nextCand}
                disabled={currentIdx === candidates.length - 1}
                className="p-2 bg-white/5 border border-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </section>

          {/* RIGHT — bidding controls */}
          <aside className="col-span-3 space-y-4">
            {/* Timer */}
            <div className="card p-4">
              <div className="font-display text-5xl font-black text-center mb-2">
                {timerSec}
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(timerSec / 60) * 100}%` }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={timerActive ? pauseTimer : startTimer}
                  className="flex-1 py-2 text-sm font-bold hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-1"
                >
                  {timerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {timerActive ? 'PAUSE' : 'START'}
                </button>
                <button
                  onClick={resetTimerBroadcast}
                  className="flex-1 py-2 text-sm font-bold hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  RESET
                </button>
              </div>
            </div>

            {/* House selection */}
            <div className="grid grid-cols-5 gap-2">
              {houses.map((house, idx) => (
                <button
                  key={house.id}
                  onClick={() => setSelectedHouseId(house.id)}
                  className={`py-3 font-display text-sm font-bold transition-all ${
                    selectedHouseId === house.id
                      ? 'border-2 border-white'
                      : 'border border-white/10 hover:border-white/30'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Quick bid buttons */}
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 5].map(a => (
                <button
                  key={a}
                  onClick={() => bid(a)}
                  disabled={!selectedHouseId || loading}
                  className="py-3 bg-white/5 border border-white/10 font-bold hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                  +{a}
                </button>
              ))}
              <div className="col-span-2">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={customBid}
                  onChange={e => setCustomBid(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') bid(parseInt(customBid) || 0); }}
                  placeholder="custom..."
                  className="w-full px-3 py-2 bg-black border border-white/10 text-sm font-mono focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>

            {/* Confirm / Pass */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={confirmSold}
                disabled={!selectedHouseId || loading}
                className="py-3 border border-white font-display font-bold uppercase hover:bg-white hover:text-black disabled:opacity-30 transition-colors"
              >
                <Zap className="w-4 h-4 inline mr-1" />
                SOLD
              </motion.button>
              <button
                onClick={handlePass}
                disabled={loading}
                className="py-3 border border-white/10 font-display font-bold uppercase hover:bg-red-400/10 hover:border-red-400/30 hover:text-red-300 transition-colors"
              >
                <SkipForward className="w-4 h-4 inline mr-1" />
                PASS
              </button>
            </div>

            {/* House credits quick adjust */}
            <div>
              <div className="text-xs text-grey-500 mb-2 uppercase tracking-wider">House Credits</div>
              <div className="grid grid-cols-5 gap-1">
                {houses.map((house) => (
                  <div key={house.id} className="text-center">
                    <div className="font-display text-sm font-bold">
                      {house.remaining_credits}
                    </div>
                    <div className="text-xs text-grey-600">
                      H{houses.indexOf(house) + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Draft flow: phase + snake */}
            <div className="card p-4">
              <div className="text-xs text-grey-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                <LayoutGrid className="w-3.5 h-3.5" />
                Draft Flow
              </div>

              {/* Phase toggle */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => togglePhase('phase1')}
                  className={`py-2 text-xs font-bold uppercase transition-colors ${
                    phase === 'phase1' ? 'bg-white text-black' : 'border border-white/10 hover:bg-white/10'
                  }`}
                >
                  Phase 1 · Draft
                </button>
                <button
                  onClick={() => togglePhase('phase2')}
                  className={`py-2 text-xs font-bold uppercase transition-colors ${
                    phase === 'phase2' ? 'bg-white text-black' : 'border border-white/10 hover:bg-white/10'
                  }`}
                >
                  Phase 2 · Reveal
                </button>
              </div>

              {/* Snake draft */}
              <button
                onClick={runSnake}
                disabled={loading || leftovers.length === 0}
                className={`w-full py-2.5 text-xs font-bold uppercase border transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white ${
                  leftovers.length > 0
                    ? 'border-white/40 ring-1 ring-white/20 animate-pulse hover:bg-white hover:text-black'
                    : 'border-white/20 hover:bg-white hover:text-black'
                }`}
              >
                <Shuffle className="w-4 h-4 inline mr-1" />
                Snake Draft Leftovers ({leftovers.length})
              </button>
              <p className="text-[10px] text-grey-600 mt-2 leading-relaxed">
                Shuffles undrafted + passed members into teams (fewest credits pick first, free of charge).
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AdminView;