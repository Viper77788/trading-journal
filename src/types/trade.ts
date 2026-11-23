export type TradingSession = 'London' | 'NY' | 'Outside';

export type MistakeTag =
  | 'Over Trading'
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
  'Over Trading',
  'FOMO',
  'Revenge Trade',
  'Overleveraged',
  'Moved Stop Loss',
  'Broke Rules',
  'Early Exit',
  'Late Entry',
];

export type TradeChartSlot = 'entry' | 'result';
export type TradeChartType = 'tv' | 'upload';

export interface TradeChartAttachment {
  slot: TradeChartSlot;
  type: TradeChartType;
  tvLink?: string;
  imagePath?: string;
  label?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  contentHash?: string;
  addedAt: string;
}

export const QUICK_REVIEW_REASON_CHIPS: string[] = [
  'Liquidity grab',
  'News spike',
  'Bad entry timing',
  'Counter-trend',
  'Moved SL',
  'Good trade, unlucky',
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
  charts?: TradeChartAttachment[];
  reviewNote?: string;
  createdAt: string;
}
