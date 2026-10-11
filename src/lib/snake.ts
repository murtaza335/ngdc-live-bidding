import type { Candidate, House } from '../types/database';

export interface SnakeAssignment {
  candidateId: string;
  houseId: string;
  pickNumber: number; // overall pick index (1-based)
  round: number;
}

export interface SnakeResult {
  assignments: SnakeAssignment[];
  order: string[]; // house ids in snake pick order (round 1)
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Snake draft of leftover members across houses.
 *
 * - House pick order is the houses sorted by **remaining credits ascending**
 *   (the house that spent the most picks first, to balance teams).
 * - The pool is shuffled first so distribution is fair/random.
 * - Round 1 goes left→right, round 2 right→left, etc. (true snake).
 *
 * Returns the list of assignments (free — no credit deduction).
 */
export function runSnakeDraft(leftovers: Candidate[], houses: House[]): SnakeResult {
  if (leftovers.length === 0 || houses.length === 0) {
    return { assignments: [], order: houses.map(h => h.id) };
  }

  // Fewest credits first
  const order = [...houses]
    .sort((a, b) => a.remaining_credits - b.remaining_credits)
    .map(h => h.id);

  const pool = shuffle(leftovers);

  const assignments: SnakeAssignment[] = [];
  let pick = 0;

  for (let i = 0; i < pool.length; i++) {
    const round = Math.floor(i / order.length);
    const posInRound = i % order.length;
    // Even rounds L→R, odd rounds R→L
    const houseIndex = round % 2 === 0 ? posInRound : order.length - 1 - posInRound;
    const houseId = order[houseIndex];

    assignments.push({
      candidateId: pool[i].id,
      houseId,
      pickNumber: ++pick,
      round: round + 1,
    });
  }

  return { assignments, order };
}
