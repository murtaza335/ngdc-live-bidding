/**
 * Minimal wrapper around the YouTube IFrame Player API so videos can be
 * controlled programmatically (play / pause / seek / mute) and kept in sync
 * between the admin panel and the projector.
 */

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<any> | null = null;

/** Extract a YouTube video id from embed / watch / youtu.be / shorts URLs. */
export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/embed\/([^?/&]+)/,
    /youtube-nocookie\.com\/embed\/([^?/&]+)/,
    /youtube\.com\/watch\?v=([^?/&]+)/,
    /youtu\.be\/([^?/&]+)/,
    /youtube\.com\/shorts\/([^?/&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) return m[1];
  }
  return null;
}

export function isYouTubeUrl(url: string): boolean {
  return getYouTubeId(url) !== null;
}

/** Load the YouTube IFrame API once and resolve with the global `YT` object. */
export function loadYouTubeApi(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  const w = window;
  if (w.YT && w.YT.Player) return Promise.resolve(w.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    const previous = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      if (typeof previous === 'function') previous();
      resolve(w.YT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });

  return apiPromise;
}
