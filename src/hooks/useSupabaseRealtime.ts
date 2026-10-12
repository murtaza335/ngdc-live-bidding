import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Candidate, House, BidLog, RealtimePayload, Phase } from '../types/database';

// Map database columns (snake_case) to Candidate interface (camelCase)
export const mapCandidate = (c: any): Candidate => ({
  id: c.id,
  real_name: c.real_name,
  track: c.track,
  media_type: c.media_type,
  media_url: c.media_url,
  media_urls: c.media_urls,
  pitch: c.pitch,
  status: c.status,
  isPlatinum: c.is_platinum,
  drafted_to_house_id: c.drafted_to_house_id,
  winning_bid: c.winning_bid,
  anonymous_id: c.anonymous_id,
  avatar_url: c.avatar_url,
  contact: c.contact,
});

export function useSupabaseRealtime() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [bidsLog, setBidsLog] = useState<BidLog[]>([]);
  const [phase, setPhase] = useState<Phase>('phase1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      // No backend — consumers fall back to placeholder data.
      setLoading(false);
      return;
    }
    try {
      const [candidatesRes, housesRes, bidsRes, settingsRes] = await Promise.all([
        supabase.from('candidates').select('*').order('id'),
        supabase.from('houses').select('*').order('id'),
        supabase.from('bids_log').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('settings').select('*').eq('key', 'phase').maybeSingle(),
      ]);

      if (candidatesRes.error) throw candidatesRes.error;
      if (housesRes.error) throw housesRes.error;
      if (bidsRes.error) throw bidsRes.error;
      // Settings is optional — ignore error if the table doesn't exist yet
      if (!settingsRes.error && settingsRes.data) setPhase(settingsRes.data.value as Phase);

      const mappedCandidates = candidatesRes.data.map(mapCandidate);
      setCandidates(mappedCandidates as Candidate[]);
      setHouses(housesRes.data as House[]);
      setBidsLog(bidsRes.data as BidLog[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();

    if (!isSupabaseConfigured) return;

    const candidatesChannel = supabase
      .channel('candidates-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' } as any, (payload: unknown) => {
        const p = payload as RealtimePayload<any>;
        setCandidates(prev => {
          if (p.eventType === 'INSERT') {
            return [...prev, mapCandidate(p.new)].sort((a, b) => a.id.localeCompare(b.id));
          }
          if (p.eventType === 'UPDATE') {
            return prev.map(c => (c.id === p.new.id ? mapCandidate(p.new) : c)).sort((a, b) => a.id.localeCompare(b.id));
          }
          if (p.eventType === 'DELETE') {
            return prev.filter(c => c.id !== (p.old as any)?.id);
          }
          return prev;
        });
      })
      .subscribe();

    const housesChannel = supabase
      .channel('houses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'houses' } as any, (payload: unknown) => {
        const p = payload as RealtimePayload<House>;
        setHouses(prev => {
          if (p.eventType === 'INSERT') return [...prev, p.new].sort((a, b) => a.id.localeCompare(b.id));
          if (p.eventType === 'UPDATE') return prev.map(h => (h.id === p.new.id ? p.new : h)).sort((a, b) => a.id.localeCompare(b.id));
          if (p.eventType === 'DELETE') return prev.filter(h => h.id !== (p.old as House)?.id);
          return prev;
        });
      })
      .subscribe();

    const bidsLogChannel = supabase
      .channel('bids-log-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids_log' } as any, (payload: unknown) => {
        const p = payload as RealtimePayload<BidLog>;
        setBidsLog(prev => [p.new, ...prev].slice(0, 50));
      })
      .subscribe();

    const settingsChannel = supabase
      .channel('settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' } as any, (payload: unknown) => {
        const p = payload as RealtimePayload<{ key: string; value: string }>;
        if (p.new?.key === 'phase') setPhase(p.new.value as Phase);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(candidatesChannel);
      supabase.removeChannel(housesChannel);
      supabase.removeChannel(bidsLogChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, [fetchInitialData]);

  return { candidates, houses, bidsLog, phase, loading, error, refetch: fetchInitialData };
}
