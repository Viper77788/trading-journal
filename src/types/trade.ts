export type TradingSession = 'London' | 'NY' | 'Outside';

export type MistakeTag =
  | 'FOMO'
  | 'Revenge Trade'
  | 'Overleveraged'
  | 'Moved Stop Loss'
  | 'Broke Rules'
  | 'Early Exit'
  | 'Late Entry'
  | 'None';

export const MISTAKE_TAGS: MistakeTag[] = [
  'None',
  'FOMO',
  'Revenge Trade',
  'Overleveraged',
  'Moved Stop Loss',
  'Broke Rules',
  'Early Exit',
  'Late Entry',
];

export interface TradeEntry {
  id: string;
  tradeNumber: number;
  session: TradingSession;
  asset: string;
  riskPercent: number;
  riskAmount: number;
  setupQuality: number; // 1-5 stars
  disciplineScore: number; // 1-5 stars
  outcome: number; // +/- $
  mistakes: MistakeTag[];
  notes: string;
  createdAt: string;
}
