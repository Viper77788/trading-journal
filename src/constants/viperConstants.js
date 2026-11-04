export const CONTRACTS = [
  {
    id: 'MGCZ6',
    label: 'MGC E-Micro Gold (MGCZ6)',
    shortLabel: 'MGCZ6',
    tickValue: 1.0,
    multiplier: 10,
  },
  {
    id: 'GC',
    label: 'GC Gold Futures',
    shortLabel: 'GC',
    tickValue: 10.0,
    multiplier: 100,
  },
  {
    id: 'NQ',
    label: 'NQ E-mini (Nasdaq)',
    shortLabel: 'NQ',
    tickValue: 5.0,
    multiplier: 20,
  },
  {
    id: 'MNQ',
    label: 'MNQ E-Micro (Nasdaq)',
    shortLabel: 'MNQ',
    tickValue: 0.5,
    multiplier: 2,
  },
  {
    id: 'ES',
    label: 'ES E-mini (S&P 500)',
    shortLabel: 'ES',
    tickValue: 12.5,
    multiplier: 50,
  },
  {
    id: 'MES',
    label: 'MES E-Micro (S&P 500)',
    shortLabel: 'MES',
    tickValue: 1.25,
    multiplier: 5,
  },
];

export const LIQUIDITY_WINDOWS = {
  ASIAN_LONDON: '1–4 AM CT / 2–5 AM ET',
  NY_OPEN: '8–11 AM CT / 9–12 PM ET',
  OUTSIDE: 'Outside Window',
};

export const SESSION_WINDOWS = [
  {
    id: LIQUIDITY_WINDOWS.ASIAN_LONDON,
    pillLabel: '2–5 AM EST (London)',
    badgeLabel: '2:00–5:00 AM EST',
    ctLabel: '1:00–4:00 AM CT',
    subtitle: 'London Liquidity Window',
  },
  {
    id: LIQUIDITY_WINDOWS.NY_OPEN,
    pillLabel: '9–12 PM EST (NY)',
    badgeLabel: '9:00 AM–12:00 PM EST',
    ctLabel: '8:00–11:00 AM CT',
    subtitle: 'New York Opening Window',
  },
  {
    id: LIQUIDITY_WINDOWS.OUTSIDE,
    pillLabel: 'Outside Window',
    badgeLabel: 'Outside Window',
    ctLabel: 'Off-Session Hours',
    subtitle: 'Extended / Outside Core Windows',
  },
];

export const FEELING_OPTIONS = [
  { id: 'Focused', emoji: '🎯', label: '🎯 Focused' },
  { id: 'Confident', emoji: '💪', label: '💪 Confident' },
  { id: 'Calm', emoji: '😌', label: '😌 Calm' },
  { id: 'Anxious', emoji: '😰', label: '😰 Anxious' },
  { id: 'FOMO', emoji: '🏃', label: '🏃 FOMO' },
  { id: 'Revenge', emoji: '😤', label: '😤 Revenge' },
  { id: 'Bored', emoji: '😐', label: '😐 Bored' },
  { id: 'Frustrated', emoji: '😡', label: '😡 Frustrated' },
];

export const PRE_TRADE_CHECKLIST_ITEMS = [
  { id: 'inPlan', label: 'Is this in my plan?' },
  { id: 'waitedConfirmation', label: 'Did I wait for confirmation?' },
  { id: 'withinRiskLimit', label: 'Am I within my risk limit?' },
  { id: 'rewardWorthRisk', label: 'Is the reward worth the risk?' },
];

export const MARKET_CONDITION_OPTIONS = [
  { id: 'Trending', emoji: '📈', label: '📈 Trending' },
  { id: 'Ranging', emoji: '↔️', label: '↔️ Ranging' },
  { id: 'Volatile', emoji: '⚡', label: '⚡ Volatile' },
  { id: 'Choppy', emoji: '🌊', label: '🌊 Choppy' },
  { id: 'News-driven', emoji: '📰', label: '📰 News-driven' },
];

export const SELF_GRADING_QUESTIONS = [
  { id: 'followPlan', question: 'Did I follow my trading plan?' },
  { id: 'entryTiming', question: 'Was my entry timing good?' },
  { id: 'exitManagement', question: 'Did I manage the exit well?' },
  { id: 'positionSize', question: 'Was my position size correct?' },
  { id: 'stayedCalm', question: 'Did I stay calm and disciplined?' },
];

export const DEFAULT_STRATEGIES = [
  {
    id: 'strat-london-sweep',
    name: 'London Liquidity Sweep & Reclaim',
    window: '2:00–5:00 AM EST (1:00–4:00 AM CT)',
    description:
      'Wait for Asian range high/low sweep during the 2:00–5:00 AM EST London opening window, enter on 5m displacement candle close.',
    targetR: '2.0R',
  },
  {
    id: 'strat-ny-open-orb',
    name: 'NY Session Opening Displacement',
    window: '9:00 AM–12:00 PM EST (8:00–11:00 AM CT)',
    description:
      'Trade clean continuation or key structural retest during the 9:00 AM–12:00 PM EST New York liquidity window with strict 15m cooldown between executions.',
    targetR: '1.5R – 2.5R',
  },
];

export const DEFAULT_14_RULES = [
  { id: 'r1', number: 1, label: 'Trade only during active Liquidity Windows (2–5 AM EST or 9–12 PM EST)', category: 'Timing', isCore: true },
  { id: 'r2', number: 2, label: 'Wait for clean structural candle close confirmation before entry', category: 'Execution', isCore: true },
  { id: 'r3', number: 3, label: 'Respect the 15-Minute Cooldown Rule after any closed trade (Zero Revenge)', category: 'Psychology', isCore: true },
  { id: 'r4', number: 4, label: 'Hard stop loss placed immediately upon execution — never widen stops', category: 'Risk', isCore: true },
  { id: 'r5', number: 5, label: 'Keep position lot sizing consistent with pre-trade risk limit', category: 'Risk', isCore: true },
  { id: 'r6', number: 6, label: 'Only take setups where reward-to-risk is at least 1.5R', category: 'Risk', isCore: true },
  { id: 'r7', number: 7, label: 'Complete the 4-point Pre-Trade Checklist before clicking Buy/Sell', category: 'Discipline', isCore: true },
  { id: 'r8', number: 8, label: 'Stop trading for the session if emotional state shifts to Revenge or Frustrated', category: 'Psychology', isCore: true },
];

export const INITIAL_SEED_TRADES = [];
