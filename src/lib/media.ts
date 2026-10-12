/**
 * Append autoplay parameters to a media URL.
 *
 * Embedded players (YouTube/Vimeo) require `mute=1` for autoplay to work under
 * browser autoplay policies. Already-present query strings are preserved.
 */
export function withAutoplay(url: string): string {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  const params = 'autoplay=1&mute=1';
  // Avoid duplicating if the author already specified autoplay
  if (/[?&]autoplay=/.test(url)) return url;
  return `${url}${separator}${params}`;
}

/**
 * Detect hosted embed players (YouTube/Vimeo) that must be rendered inside an
 * <iframe> rather than a native <video> element.
 */
export function isEmbedUrl(url: string): boolean {
  if (!url) return false;
  return /youtube\.com\/embed|youtube-nocookie\.com\/embed|player\.vimeo\.com|vimeo\.com\/video/.test(url);
}
