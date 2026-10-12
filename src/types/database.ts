export type Track = 'Programmer' | '2D Artist' | '3D Artist' | 'Game Designer';
export type MediaType = 'video' | 'image' | 'pdf';
export type CandidateStatus = 'available' | 'bidding' | 'drafted';
export type Phase = 'phase1' | 'phase2' | 'platinum_transition' | 'snake_draft';

export interface Candidate {
  id: string;
  real_name: string;
  track: Track;
  media_type: MediaType;
  media_url: string;
  media_urls?: string[];
  pitch: string;
  status: CandidateStatus;
  isPlatinum: boolean;
  drafted_to_house_id: string | null;
  winning_bid: number;
  anonymous_id: string;
  avatar_url?: string;
  contact?: string;
}

export interface House {
  id: string;
  name: string;
  ob_lead: string;
  color_hex: string;
  initial_credits: number;
  remaining_credits: number;
}

export interface BidLog {
  id: number;
  candidate_id: string;
  house_id: string;
  bid_amount: number;
  created_at: string;
}

export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T | null;
}

export interface EventPayload {
  type: string;
  value?: boolean | number | string;
  timestamp: number;
  // Media sync payload
  media?: {
    candidateId: string;
    mediaIndex?: number;
    mediaType: 'video' | 'image' | 'pdf';
    mediaUrl: string;
    action: 'play' | 'pause' | 'seek' | 'sync';
    currentTime?: number;
    duration?: number;
    fullscreen?: boolean;
  };
  // Additional event payloads
  house_id?: string;
}

export interface AppState {
  candidates: Candidate[];
  houses: House[];
  bidsLog: BidLog[];
  currentCandidateId: string | null;
  phase: Phase;
  timerActive: boolean;
  timerSeconds: number;
  soundEnabled: boolean;
}