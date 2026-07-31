/**
 * Trade Quality Scoring
 * All fields already exist in the trade schema from AddTradeModal.jsx.
 * Formula sums exactly to 100 — no Math.min cap needed.
 *
 * Plan Followed:    +20  (planFollowed === 'Yes')
 * 4H Aligned:       +5   (previous4HourDirection === 'Yes')
 * Daily Aligned:    +5   (previousDailyDirection === 'Yes')
 * Weekly Aligned:   +5   (previousWeeklyDirection === 'Yes')
 * 1H Aligned:       +5   (previous1HourDirection === 'Yes')
 * Range Clean:      +10  (leftSideRangeClean === 'Yes')
 * Profitable:       +20  (profitLoss > 0; breakeven = 0, same as loss)
 * RR >= 2:          +15  (rr parsed safely, NaN → 0)
 * Confidence:       +0–5 (confidenceScore/10 * 5, NaN → 0)
 *                  ────
 *                   100
 */

/**
 * Compute a 0–100 quality score for a given trade.
 * @param {Object} trade
 * @returns {{ score: number, grade: string, breakdown: Object }}
 */
export const computeTradeScore = (trade) => {
  if (!trade) return { score: 0, grade: 'F', breakdown: {} };

  // Plan Followed: +20
  const planScore = trade.planFollowed === 'Yes' ? 20 : 0;

  // HTF Alignments: +5 each
  const h4Score    = trade.previous4HourDirection  === 'Yes' ? 5 : 0;
  const dailyScore = trade.previousDailyDirection  === 'Yes' ? 5 : 0;
  const weeklyScore= trade.previousWeeklyDirection === 'Yes' ? 5 : 0;
  const h1Score    = trade.previous1HourDirection  === 'Yes' ? 5 : 0;

  // Range Clean: +10
  const rangeScore = trade.leftSideRangeClean === 'Yes' ? 10 : 0;

  // Profitable: +20 (breakeven = 0)
  const pl = Number(trade.profitLoss) || 0;
  const profitScore = pl > 0 ? 20 : 0;

  // RR >= 2: +15 (safe parse — undefined/null/empty/"" all → 0)
  const rrValue = parseFloat(trade.rr) || 0;
  const rrScore = rrValue >= 2 ? 15 : 0;

  // Confidence Score: proportional +0–5 (NaN → 0)
  const confidence = Number(trade.confidenceScore) || 0;
  const confidenceScore = Math.round((confidence / 10) * 5);

  const score = planScore + h4Score + dailyScore + weeklyScore + h1Score
    + rangeScore + profitScore + rrScore + confidenceScore;

  // Letter grades
  let grade = 'F';
  if (score >= 80) grade = 'A';
  else if (score >= 65) grade = 'B';
  else if (score >= 50) grade = 'C';
  else if (score >= 35) grade = 'D';

  return {
    score,
    grade,
    breakdown: {
      planScore,
      h4Score,
      dailyScore,
      weeklyScore,
      h1Score,
      rangeScore,
      profitScore,
      rrScore,
      confidenceScore
    }
  };
};

/** Grade colour classes for Tailwind */
export const gradeColor = (grade) => {
  switch (grade) {
    case 'A': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'B': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'C': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'D': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default:  return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
};
