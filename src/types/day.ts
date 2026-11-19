import { TradeEntry } from './trade';

export type EmotionTag =
  | 'Patient'
  | 'Impatient'
  | 'FOMO'
  | 'Calm'
  | 'Anxious'
  | 'Overconfident'
  | 'Revenge'
  | 'Focused';

export const EMOTION_TAGS: EmotionTag[] = [
  'Patient',
  'Calm',
  'Focused',
  'Impatient',
  'FOMO',
  'Anxious',
  'Overconfident',
  'Revenge',
];

export interface SessionChecklistState {
  checkedEconomicCalendar: boolean;
  confirmedAllowedWindows: boolean;
  mentalStateCalm: boolean;
}

export interface DailyAuditState {
  stuckToMaxTrades: boolean | null; // null = use auto-suggestion
  respectedRiskCap: boolean | null;
  executedInAllowedWindows: boolean | null;
  emotions: EmotionTag[];
  customEmotion: string;
  keyLesson: string;
  savedAt?: string;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  checklist: SessionChecklistState;
  trades: TradeEntry[];
  audit: DailyAuditState;
  maxTradesSnapshot?: number;
  updatedAt: string;
}
