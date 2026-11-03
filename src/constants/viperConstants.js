export const CONTRACTS = [
  { id: 'MGCZ6', label: 'MGCZ6 (E-Micro Gold Futures)', tickValue: 1.0, multiplier: 10 },
  { id: 'GCZ6', label: 'GCZ6 (Standard Gold Futures)', tickValue: 10.0, multiplier: 100 },
  { id: 'MGC', label: 'MGC (Micro Gold Continuous)', tickValue: 1.0, multiplier: 10 },
  { id: 'GC', label: 'GC (Gold Continuous)', tickValue: 10.0, multiplier: 100 },
  { id: 'NQZ6', label: 'NQZ6 (E-Mini NASDAQ 100)', tickValue: 5.0, multiplier: 20 },
  { id: 'MNQZ6', label: 'MNQZ6 (E-Micro NASDAQ 100)', tickValue: 0.5, multiplier: 2 },
];

export const ACCOUNT_TYPES = [
  {
    id: 'Lucid Flex',
    label: '$25k Lucid Flex ($600 Daily Loss Cap)',
    accountSize: 25000,
    dailyLossLimit: 600,
    maxDrawdown: 1500,
    defaultAccountId: 'LFE05072050930002',
  },
  {
    id: 'Apex',
    label: '$25k Apex Trader Funding ($600 Daily Loss Cap)',
    accountSize: 25000,
    dailyLossLimit: 600,
    maxDrawdown: 1500,
    defaultAccountId: 'APEX-25093001',
  },
];

export const SESSION_WINDOWS = [
  {
    id: '1:00 AM–4:00 AM',
    label: '01:00 AM–04:00 AM EST (London Session)',
    short: '01:00 AM–04:00 AM EST',
  },
  {
    id: '8:00 AM–11:00 AM',
    label: '08:00 AM–11:00 AM EST (NY Opening Session)',
    short: '08:00 AM–11:00 AM EST',
  },
  {
    id: 'Outside Window',
    label: 'Afternoon / Extended Hours (EST)',
    short: 'Extended Hours EST',
  },
];

export const DEFAULT_14_RULES = [
  { id: 'r1', number: 1, label: 'Liquidity Window Alignment (EST Session Timing)', category: 'Timing', isCore: true },
  { id: 'r2', number: 2, label: 'Key Structural Level Reaction Confirmed', category: 'Structure', isCore: true },
  { id: 'r3', number: 3, label: 'Range Break Confirmation', category: 'Structure', isCore: true },
  { id: 'r4', number: 4, label: 'Structural Candle Close Confirmation', category: 'Execution', isCore: true },
  { id: 'r5', number: 5, label: 'Higher Timeframe Trend Alignment (4H / 1H)', category: 'Trend', isCore: true },
  { id: 'r6', number: 6, label: 'Initial Risk Limit Adherence ($600 Daily Cap)', category: 'Risk', isCore: true },
  { id: 'r7', number: 7, label: 'Partial Profit Target Execution (TP1 / TP2)', category: 'Management', isCore: true },
  { id: 'r8', number: 8, label: 'Clean Left-Side Traffic (No Immediate Obstacles)', category: 'Structure', isCore: false },
  { id: 'r9', number: 9, label: 'Minimum 1.5R Risk-to-Reward Profile Met', category: 'Risk', isCore: false },
  { id: 'r10', number: 10, label: 'Hard Stop Loss Placed Immediately Upon Entry', category: 'Risk', isCore: false },
  { id: 'r11', number: 11, label: 'Stop Loss Never Widened or Moved Against Position', category: 'Discipline', isCore: false },
  { id: 'r12', number: 12, label: 'No High-Impact Red Folder News Within 5 Minutes', category: 'Timing', isCore: false },
  { id: 'r13', number: 13, label: 'Position Contract Lot Sizing Aligned With Plan', category: 'Risk', isCore: false },
  { id: 'r14', number: 14, label: '15-Minute Cooldown Respected (Zero Revenge Impulse)', category: 'Psychology', isCore: true },
];

export const BEHAVIORAL_LEAK_TAGS = [
  'Revenge Trading (< 15m gap)',
  'FOMO Entry',
  'Moved Stop Loss',
  'Early Exit',
  'Oversizing',
  'Session Outside Window',
];

export const INITIAL_SEED_TRADES = [];
