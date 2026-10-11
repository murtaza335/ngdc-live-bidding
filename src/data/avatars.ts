// Curated pool of internet avatars used for the House Reveal lineup.
// Assigned deterministically so the projector and admin always agree.
export const AVATAR_POOL: string[] = [
  'https://i.pravatar.cc/400?img=12',
  'https://i.pravatar.cc/400?img=15',
  'https://i.pravatar.cc/400?img=23',
  'https://i.pravatar.cc/400?img=32',
  'https://i.pravatar.cc/400?img=45',
  'https://i.pravatar.cc/400?img=47',
  'https://i.pravatar.cc/400?img=52',
  'https://i.pravatar.cc/400?img=56',
  'https://i.pravatar.cc/400?img=60',
  'https://i.pravatar.cc/400?img=64',
  'https://i.pravatar.cc/400?img=68',
  'https://i.pravatar.cc/400?img=9',
];

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Deterministically pick an avatar for a candidate.
 * `usedIndexes` guarantees distinct avatars within a team.
 */
export function getAvatarForId(id: string, usedIndexes: Set<number>): string {
  const start = hashCode(id) % AVATAR_POOL.length;
  for (let i = 0; i < AVATAR_POOL.length; i++) {
    const idx = (start + i) % AVATAR_POOL.length;
    if (!usedIndexes.has(idx)) {
      usedIndexes.add(idx);
      return AVATAR_POOL[idx];
    }
  }
  // Pool exhausted — reuse from start
  return AVATAR_POOL[start];
}
