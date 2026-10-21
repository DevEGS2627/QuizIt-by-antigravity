/**
 * EGS Quizit! Inter-school Quiz Arena — Type Definitions & Data Contracts
 * Use these interfaces to build any frontend (React, Vue, Svelte, Solid, Next.js, or Vanilla JS)
 */

export type MediaType = 'image' | 'audio' | 'video' | null;

export type QuestionStatus = 'available' | 'drawn' | 'archived' | 'reset';

export type DrawMethod = 'physical_chit' | 'fair_random_reel' | 'manual';

export type ScoreEventType =
  | 'correct'
  | 'wrong'
  | 'pounce_correct'
  | 'pounce_incorrect'
  | 'manual_adjustment';

export interface Team {
  id: string; // e.g., 'team-1'
  name: string; // e.g., 'Phoenix Vanguard'
  school: string; // e.g., "St. Jude's Academy"
  shortName: string; // e.g., 'PHX'
  color: string; // Hex color code (e.g., '#ff2d55')
  logoIcon?: string; // Lucide icon identifier or SVG
  scoresByRound: number[]; // Array of 6 numbers: points scored per round [R1, R2, R3, R4, R5, R6]
  totalScore: number; // Sum of points
  hasPounced: boolean; // Flag if team has currently pressed pounce buzzer
  pounceTimestamp: string | null; // ISO timestamp when pounce was registered
}

export interface Question {
  id: string;
  tag: string; // e.g. 'R1-001'
  round: number; // 1 to 6
  question: string;
  answer: string;
  source?: string;
  mediaType?: MediaType;
  mediaUrl?: string | null;
  status: QuestionStatus;
  drawnAt?: string;
}

export interface RoundMetadata {
  id: number;
  name: string; // e.g., 'The Awakening'
  category: string; // e.g., 'General Knowledge & Current Affairs'
  badge: string; // e.g., 'R1'
}

export interface QuizRules {
  correctPoints: number; // Default: 10
  wrongPoints: number; // Default: 0
  pounceCorrectPoints: number; // Default: 10
  pounceIncorrectPoints: number; // Default: -5
  defaultTimerDuration: number; // Default: 45 seconds
  warningTimerThreshold: number; // Default: 10 seconds (triggers urgency ticks)
  soundEnabled: boolean; // Default: true
  speechRate: number; // Default: 1.0 (TTS speed)
  allowAudiencePass: boolean; // Default: true
}

export interface LiveQuizState {
  activeRound: number; // 1-6
  activeTeamId: string; // ID of current team whose turn it is
  activeQuestion: Question | null;
  isAnswerRevealed: boolean;
  hasBeenScored: boolean;
  isTimerRunning: boolean;
  timerSeconds: number;
}

export interface DrawHistoryEntry {
  timestamp: string;
  questionId: string;
  questionTag: string;
  round: number;
  method: DrawMethod;
  teamId: string;
  teamName: string;
}

export interface ScoreAuditEvent {
  timestamp: string;
  type: ScoreEventType;
  teamId: string;
  teamName: string;
  pointsDelta: number;
  questionTag: string | null;
  round: number;
  reason: string;
  operator: string;
}
