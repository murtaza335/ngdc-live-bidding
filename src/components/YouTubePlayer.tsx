import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { getYouTubeId, loadYouTubeApi } from '../lib/youtube';

export interface YouTubePlayerHandle {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
  setMuted: (muted: boolean) => void;
}

interface YouTubePlayerProps {
  url: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  onReady?: (duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

/**
 * A controllable YouTube embed. Exposes imperative play/pause/seek/mute through
 * a ref and reports playback events so callers can mirror state elsewhere.
 */
const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  (
    {
      url,
      autoplay = false,
      muted = true,
      controls = true,
      className,
      onReady,
      onPlay,
      onPause,
      onProgress,
      onEnded,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const pollRef = useRef<number | null>(null);
    const videoId = getYouTubeId(url);

    const stopPoll = () => {
      if (pollRef.current !== null) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const startPoll = () => {
      stopPoll();
      pollRef.current = window.setInterval(() => {
        const p = playerRef.current;
        if (!p || typeof p.getCurrentTime !== 'function') return;
        onProgress?.(p.getCurrentTime() || 0, p.getDuration?.() || 0);
      }, 500);
    };

    useEffect(() => {
      let cancelled = false;
      const host = containerRef.current;

      loadYouTubeApi().then((YT) => {
        if (cancelled || !host || !videoId) return;

        // The IFrame API replaces whatever element it is given, so hand it a
        // dedicated child node instead of a React-managed element.
        const mountNode = document.createElement('div');
        mountNode.style.width = '100%';
        mountNode.style.height = '100%';
        host.appendChild(mountNode);

        playerRef.current = new YT.Player(mountNode, {
          videoId,
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            mute: muted ? 1 : 0,
            controls: controls ? 1 : 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: (e: any) => {
              if (muted) e.target.mute?.();
              onReady?.(e.target.getDuration?.() || 0);
              if (autoplay) e.target.playVideo?.();
            },
            onStateChange: (e: any) => {
              const state = e.data;
              if (state === YT.PlayerState.PLAYING) {
                onPlay?.();
                startPoll();
              } else if (state === YT.PlayerState.PAUSED) {
                onPause?.();
                stopPoll();
              } else if (state === YT.PlayerState.ENDED) {
                stopPoll();
                onEnded?.();
              }
            },
          },
        });
      });

      return () => {
        cancelled = true;
        stopPoll();
        try {
          playerRef.current?.destroy?.();
        } catch {
          /* ignore */
        }
        playerRef.current = null;
        if (host) host.innerHTML = '';
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoId]);

    useImperativeHandle(ref, () => ({
      play: () => playerRef.current?.playVideo?.(),
      pause: () => playerRef.current?.pauseVideo?.(),
      seekTo: (s: number) => playerRef.current?.seekTo?.(s, true),
      getCurrentTime: () => playerRef.current?.getCurrentTime?.() ?? 0,
      getDuration: () => playerRef.current?.getDuration?.() ?? 0,
      isPlaying: () => playerRef.current?.getPlayerState?.() === 1,
      setMuted: (m: boolean) => {
        if (!playerRef.current) return;
        if (m) playerRef.current.mute?.();
        else playerRef.current.unMute?.();
      },
    }));

    if (!videoId) return null;

    return (
      <div className={className ?? 'w-full h-full'}>
        <div ref={containerRef} className="w-full h-full" />
      </div>
    );
  }
);

YouTubePlayer.displayName = 'YouTubePlayer';

export default YouTubePlayer;
