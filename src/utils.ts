/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Player, Identity, RoleType } from './types';

/**
 * Plays a simple timer sound effect.
 */
export function playTimerSound(): void {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.type = 'square';
  oscillator.frequency.value = 880; // Higher frequency beep
  gainNode.gain.value = 0.1;

  oscillator.start();
  // Short beep
  gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
  oscillator.stop(audioCtx.currentTime + 0.5);
}

/**
 * Calculates the number of Masons based on total player count.
 * Rule: 29% of players. Decimals <= 0.50 round down, > 0.50 round up.
 */
export function calculateMasonCount(total: number): number {
  const percentageVal = total * 0.29;
  const intPart = Math.floor(percentageVal);
  const fracPart = percentageVal - intPart;
  
  // Custom round: decimals <= 0.50 round down, > 0.50 round up
  // (Standard rounding does this, but we implement the logic explicitly to adhere strictly to the rule)
  if (fracPart > 0.50) {
    return intPart + 1;
  } else {
    return intPart;
  }
}

/**
 * Calculates initial prison capacity based on player count.
 * Rule: < 10 = 1, 11-20 = 2, > 20 = 3
 */
export function calculatePrisonCapacity(total: number): number {
  if (total <= 10) return 1;
  if (total <= 20) return 2;
  return 3;
}

/**
 * Helper to generate a random 6-character ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 8);
}

/**
 * Distribute identities: randomly assigns Freemasons (exactly 29% rounded)
 * and Simple Citizens to the list of player names.
 */
export function initializePlayers(names: string[]): Player[] {
  const total = names.length;
  const masonCount = calculateMasonCount(total);
  
  // Create shuffled array indices
  const indices = Array.from({ length: total }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  const masonIndicesArray = indices.slice(0, masonCount);
  const masonNumberMap = new Map<number, number>();
  
  // Assign Mason numbers based on their random position in the shuffled array
  masonIndicesArray.forEach((playerIndex, idx) => {
    masonNumberMap.set(playerIndex, idx + 1);
  });
  
  return names.map((name, index) => {
    const masonNo = masonNumberMap.get(index) || 0;
    const isMason = masonNo > 0;
    
    return {
      id: generateId(),
      name: name.trim() || (((typeof localStorage !== 'undefined' && localStorage.getItem('president_lang')) || 'fa').startsWith('en') ? `Player ${index + 1}` : `بازیکن ${index + 1}`),
      identity: isMason ? 'freemason' : 'citizen',
      masonNumber: masonNo,
      role: 'none',
      isAlive: true,
      isImprisoned: false,
      hasShield: false,
      shieldBroken: false,
      isBlocked: false,
      hasTerroristAbility: false,
      terroristUsed: false,
    };
  });
}

/**
 * Checks if a role is initially equipped with a shield
 */
export function hasInitialShield(role: RoleType): boolean {
  return ['pope', 'president', 'judge'].includes(role);
}
