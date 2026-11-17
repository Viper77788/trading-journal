# ApexFlow — Trading Risk & Psychology Tracker + Future Calculator

A modern, dark-mode-first fintech trading risk, psychology, and compounding projection dashboard built with **React + Vite + TypeScript + Tailwind CSS + Recharts + Framer Motion**.

## Features

1. **📅 Daily Trading & Psychology Tracker**
   - **Pre-Session Checklist:** 3 animated SVG toggle checkboxes (Economic Calendar, London 1–4 AM EST / NY 8–11 AM EST Windows, Calm Mental State) with a live Readiness bar (`0/3` to `3/3`) and warning/ready banners.
   - **Global Account & Risk Guardrails:** Editable Account Size (`$25,000`), Max Risk % (`1.0%`), Auto-calculated Max Risk $ (`$250`), and Max Trades/Day (`3`).
   - **Trade Execution Log Table:** Auto-synced `Risk %` and `Risk $`, horizontal shake + pulsing `"Risk cap violated"` badge when exceeded, interactive 1–5 star ratings for Setup Quality and Discipline, Mistake Check chips (`FOMO`, `Revenge Trade`, `Overleveraged`, `Moved Stop Loss`, `Broke Rules`, `Early Exit`, `Late Entry`, `None`), 3-trade daily limit blocker, and rolling daily P&L / R-multiple counters.
   - **Daily Review & Discipline Audit:** Auto-suggested Q1–Q3 Yes/No toggles with manual override, Primary Emotion/Mindset chips, Key Lesson textarea with gradient focus border, and morphing Save button.
   - **Circular Daily Discipline Score Gauge (0–100):** Color-coded ring (`Red 0–49`, `Amber 50–79`, `Emerald 80–100`) with 90+ sparkle indicator.

2. **📊 History & Analytics Dashboard**
   - **28-Day Calendar Heatmap:** Color-coded by Disciplined Profit Day (green), Disciplined Loss (amber), Rule Violation Day (red), or No Trades (gray). Click any cell to open and edit that day.
   - **Charts:** Cumulative Equity Curve, Most Frequent Mistakes bar chart, Primary Emotions donut chart, and Discipline Streak counter.

3. **🧮 Future Account Growth Calculator & Monte Carlo Simulator**
   - Interactive sliders for Starting Balance, Risk %, Win Rate %, R:R Ratio, Trades/Day, Days/Week, Compounding ON/OFF, Monthly Cashflow, and Commissions.
   - **`Load from my real stats`** button pulling your actual Win Rate and R:R from the Tracker.
   - Outputs: Projected Ending Balance, Expectancy (`R` and `$`), Max Drawdown, Risk of Ruin, Longest Losing Streak, Milestone Calculator (`How long to reach $X?`), Best/Expected/Worst-Case Growth Curve, **1,000-Run Monte Carlo Simulation** (`P10`, `P50`, `P90`), and Monthly Breakdown Table.

## Setup Instructions

```bash
npm install
npm run dev
```
