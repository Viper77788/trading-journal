export const SETUP_OPTIONS = [
  'No Setup', 'Bull & Bear Candle', 'SP candle', 'Wick Candle', 'Fakout',
  'Candle Close Back In The Range', 'Reclaim The Zone', 'Fib Setup',
  'Demand & Supply Set up', 'Second 30 Min of 1 HR candle', 'Breakout And Retest',
];

export const SCENARIO_CONDITIONS = [
  { key: 'previous1HourDirection', label: '1H Aligned' },
  { key: 'previous4HourDirection', label: '4H Aligned' },
  { key: 'previousDailyDirection', label: 'Daily Aligned' },
  { key: 'previousWeeklyDirection', label: 'Weekly Aligned' },
  { key: 'planFollowed', label: 'Plan Followed' },
  { key: 'leftSideRangeClean', label: 'Range Clean' },
];

export const EMOTIONS_BEFORE = ['Calm', 'Fear', 'Greed', 'FOMO', 'Excited', 'Confident'];
export const EMOTIONS_AFTER = ['Happy', 'Neutral', 'Frustrated', 'Angry', 'Confident'];

export const GOLD_FUTURES_CONTRACTS = [
  'GC', 'MGC', 'GCZ6', 'MGCZ6', 'GCG7', 'MGCG7', 'XAUUSD'
];

export const PROP_FIRM_PRESETS = [
  { id: 'Apex', label: 'Apex Trader Funding', defaultDailyLossLimit: 600 },
  { id: 'Lucid Flex', label: 'Lucid Flex Prop', defaultDailyLossLimit: 600 },
  { id: 'Funding Pips', label: 'Funding Pips', defaultDailyLossLimit: 500 },
  { id: 'FTMO', label: 'FTMO', defaultDailyLossLimit: 500 },
  { id: 'Personal', label: 'Personal Live Account', defaultDailyLossLimit: 600 },
];

export const LIQUIDITY_WINDOWS = [
  { id: 'LONDON_WINDOW', label: 'London Liquidity (1:00 AM – 4:00 AM NY)', hours: [1, 2, 3] },
  { id: 'NY_WINDOW', label: 'NY Liquidity (8:00 AM – 11:00 AM NY)', hours: [8, 9, 10] },
  { id: 'OUTSIDE_WINDOW', label: 'Outside Liquidity Window', hours: [] }
];

export const ZONE_INTERACTION_TYPES = [
  { id: 'NONE', label: 'None / Unspecified', color: '#64748b' },
  { id: 'SUPPORT_386641', label: 'Support Demand Zone (#386641)', color: '#386641' },
  { id: 'RESISTANCE_BC4749', label: 'Resistance Supply Zone (#BC4749)', color: '#BC4749' },
  { id: 'BOTH_ZONES', label: 'Support (#386641) → Resistance (#BC4749) Range', color: '#386641' },
];

export const BEHAVIORAL_LEAK_TAGS = [
  'FOMO Entry',
  'Moving Stop Loss',
  'Early Exit',
  'Revenge Trading',
  'Outside Liquidity Window',
  'Counter-Trend Impulsive',
  'Over-Leveraged Sizing',
  'No Candle Close Confirmation'
];

export const VIPER_14_RULES = [
  { id: 'rule_1', key: 'previousWeeklyDirection', label: '1. Weekly HTF Bias Aligned', category: 'Trend Alignment' },
  { id: 'rule_2', key: 'previousDailyDirection', label: '2. Daily HTF Bias Aligned', category: 'Trend Alignment' },
  { id: 'rule_3', key: 'previous4HourDirection', label: '3. 4H Structure Direction Aligned', category: 'Trend Alignment' },
  { id: 'rule_4', key: 'previous1HourDirection', label: '4. 1H Momentum Aligned', category: 'Trend Alignment' },
  { id: 'rule_5', key: 'leftSideRangeClean', label: '5. Left-Side Range Clean (Traffic Free)', category: 'Zone & Range' },
  { id: 'rule_6', key: 'zoneInteraction', label: '6. Valid Zone Interaction (#386641 Support / #BC4749 Resistance)', category: 'Zone & Range' },
  { id: 'rule_7', key: 'candleCloseConfirmation', label: '7. Candle Body Close Confirmation Checked', category: 'Execution' },
  { id: 'rule_8', key: 'liquidityWindowValid', label: '8. Executed in Liquidity Window (1–4 AM or 8–11 AM NY)', category: 'Timing' },
  { id: 'rule_9', key: 'validSetupSelected', label: '9. Valid Playbook Setup Identified', category: 'Execution' },
  { id: 'rule_10', key: 'stopLossRespected', label: '10. Hard Stop Loss Placed & Not Widened', category: 'Risk' },
  { id: 'rule_11', key: 'dailyLossRespected', label: '11. Respects $600 Max Daily Loss Limit', category: 'Risk' },
  { id: 'rule_12', key: 'rrMinimumMet', label: '12. Minimum >= 1.5R Risk-to-Reward Target', category: 'Risk' },
  { id: 'rule_13', key: 'noEmotionalImpulse', label: '13. Free of FOMO / Revenge / Tilt Entry', category: 'Psychology' },
  { id: 'rule_14', key: 'planFollowed', label: '14. Complete Trading Plan Followed Start-to-Finish', category: 'Discipline' },
];
