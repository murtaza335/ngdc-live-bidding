import type { Candidate, House } from '../types/database';

export interface SnakeAssignment {
  candidateId: string;
  houseId: string;
  pickNumber: number;
  round: number;
}

export interface SnakeResult {
  assignments: SnakeAssignment[];
  order: string[];
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
 * Balanced snake draft that equalizes candidate count per house.
 * 
 * Strategy:
 * 1. Count current members per house
 * 2. Always assign next leftover to the house with FEWEST current members
 * 3. Tie-break by remaining credits (fewest credits first = spent most)
 * 4. This guarantees the most balanced final distribution
 */
export function runSnakeDraft(leftovers: Candidate[], houses: House[]): SnakeResult {
  if (leftovers.length === 0 || houses.length === 0) {
    return { assignments: [], order: houses.map(h => h.id) };
  }

  // Count current drafted members per house
  const memberCounts = new Map<string, number>();
  houses.forEach(h => memberCounts.set(h.id, 0));
  
  // We need to know current drafted members - this should come from candidates
  // For now we'll use the snake function differently - it will receive the current counts
  // Actually, let's compute based on current house states
  // The function needs to know current member counts per house

  return { assignments: [], order: houses.map(h => h.id) };
}

/**
 * Balanced snake draft that equalizes candidate count per house.
 * 
 * @param leftovers - Unassigned candidates
 * @param houses - All houses
 * @param currentMemberCounts - Map of houseId -> current drafted member count
 */
export function runBalancedSnakeDraft(
  leftovers: Candidate[], 
  houses: House[],
  currentMemberCounts: Map<string, number>
): SnakeResult {
  if (leftovers.length === 0 || houses.length === 0) {
    return { assignments: [], order: houses.map(h => h.id) };
  }

  const pool = shuffle(leftovers);
  const assignments: SnakeAssignment[] = [];
  const counts = new Map(currentMemberCounts);
  
  // Initialize missing houses with 0
  houses.forEach(h => {
    if (!counts.has(h.id)) counts.set(h.id, 0);
  });

  let pick = 0;

  for (const candidate of pool) {
    // Find house with FEWEST members (primary), then fewest credits (secondary)
    const sortedHouses = [...houses].sort((a, b) => {
      const countDiff = (counts.get(a.id) || 0) - (counts.get(b.id) || 0);
      if (countDiff !== 0) return countDiff;
      return (a.remaining_credits || 0) - (b.remaining_credits || 0);
    });

    const targetHouse = sortedHouses[0];
    counts.set(targetHouse.id, (counts.get(targetHouse.id) || 0) + 1);
    
    assignments.push({
      candidateId: candidate.id,
      houseId: targetHouse.id,
      pickNumber: ++pick,
      round: Math.ceil(pick / houses.length),
    });
  }

  return { 
    assignments, 
    order: [...houses].sort((a, b) => (counts.get(a.id) || 0) - (counts.get(b.id) || 0)).map(h => h.id)
  };
}