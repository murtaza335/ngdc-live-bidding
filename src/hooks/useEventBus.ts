import { useEffect, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type EventType =
  | 'reveal_identity'
  | 'trigger_confetti'
  | 'start_timer'
  | 'pause_timer'
  | 'reset_timer'
  | 'advance_candidate'
  | 'prev_candidate'
  | 'set_phase'
  | 'snake_done';

export interface EventPayload {
  type: EventType;
  value?: boolean | number | string;
  timestamp: number;
}

const CHANNEL_NAME = 'ngdc-events';

// Shared broadcaster channel, created & subscribed once per browser tab.
let broadcasterChannel: RealtimeChannel | null = null;
let broadcasterReady = false;
const pendingEvents: EventPayload[] = [];

function sendRaw(payload: EventPayload) {
  if (!broadcasterChannel) return;
  // `send` exists at runtime; cast to satisfy the generic channel typing.
  (broadcasterChannel as unknown as { send: (msg: unknown) => void }).send({
    type: 'broadcast',
    event: 'event',
    payload,
  });
}

function getBroadcasterChannel(): RealtimeChannel {
  if (!broadcasterChannel) {
    broadcasterChannel = supabase.channel(CHANNEL_NAME, {
      config: { broadcast: { self: false } },
    });
    broadcasterChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        broadcasterReady = true;
        // Flush anything queued before the socket was ready
        pendingEvents.splice(0).forEach(sendRaw);
      }
    });
  }
  return broadcasterChannel;
}

/**
 * Broadcast an event to all connected clients (admin → projector sync).
 * Events fired before the realtime socket is ready are queued and flushed.
 */
export function broadcastEvent(payload: Omit<EventPayload, 'timestamp'>) {
  const fullPayload: EventPayload = { ...payload, timestamp: Date.now() };
  getBroadcasterChannel();
  if (broadcasterReady) {
    sendRaw(fullPayload);
  } else {
    pendingEvents.push(fullPayload);
  }
}

/**
 * React hook that subscribes to broadcasted events from the admin panel.
 */
export function useEventBus(handler: (payload: EventPayload) => void) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  const handleMessage = useCallback((payload: EventPayload) => {
    handlerRef.current(payload);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(CHANNEL_NAME, { config: { broadcast: { self: false } } })
      .on(
        'broadcast',
        { event: 'event' },
        (payload: { payload: EventPayload }) => {
          handleMessage(payload.payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleMessage]);
}
