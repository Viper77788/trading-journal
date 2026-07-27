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
