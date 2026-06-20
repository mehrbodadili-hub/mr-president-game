/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Identity = 'citizen' | 'freemason';

export type RoleType =
  | 'pope'            // پاپ
  | 'priest'          // کشیش
  | 'president'       // رئیس جمهور
  | 'vice_president'  // معاون
  | 'reporter'        // گزارشگر
  | 'journalist'      // خبرنگار
  | 'mayor'           // شهردار
  | 'doctor'          // دکتر
  | 'police'          // پلیس
  | 'detective'       // کارآگاه
  | 'judge'           // قاضی
  | 'lawyer'          // وکیل
  | 'none';           // بدون نقش (شهروند ساده یا فراماسون بدون نقش)

export interface Player {
  id: string;
  name: string;
  identity: Identity;
  masonNumber: number; // For Freemasons, priority number (1, 2, 3...)
  role: RoleType;
  isAlive: boolean;
  isImprisoned: boolean; // Sent to prison by Judge (max 3 spots)
  imprisonedAtCycle?: number; // The cycle when they were sent to prison
  hasShield: boolean; // Initial shield for Pope, President, Mayor, Judge
  shieldBroken: boolean;
  isBlocked: boolean; // Blocked by Priest for current night
  hasTerroristAbility: boolean; // Receives random terrorist ability
  hasTerroristAbilityCycle?: number; // The cycle number when this ability was given (or last extended)
  terroristUsed: boolean;
}

export type GamePhase = 'setup' | 'day0' | 'night0' | 'day' | 'night' | 'gameover' | 'chaos';

export interface GameLog {
  id: string;
  cycle: number; // Day/Night cycle number
  phase: 'day' | 'night' | 'setup';
  message: string;
  type: 'info' | 'kill' | 'protect' | 'block' | 'ability' | 'vote' | 'system';
  timestamp: string;
}

export interface Cabinet {
  presidentId: string | null;
  vicePresidentId: string | null;
  mayorId: string | null;
  judgeId: string | null;
}

export interface NightState {
  currentStep: number; // 1 to 8 for the night order
  priestTargetRole: RoleType | 'terrorist' | 'freemason' | null;
  priestTargetPlayerId: string | null;
  doctorTargetId: string | null;
  terroristTargetId: string | null;
  policeTargetId: string | null;
  detectiveTargetId: string | null;
  journalistTargetType: 'night' | 'day' | null;
  masonTargetId: string | null;
  reporterTargetId: string | null;
}
