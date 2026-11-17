export interface AccountSettings {
  accountSize: number; // default $25,000
  maxRiskPercent: number; // default 1.0%
  maxTradesPerDay: number; // default 3
  theme: 'dark' | 'light';
}

export const DEFAULT_ACCOUNT_SETTINGS: AccountSettings = {
  accountSize: 25000,
  maxRiskPercent: 1.0,
  maxTradesPerDay: 3,
  theme: 'dark',
};

export type ProjectionPeriod = '1m' | '3m' | '6m' | '1y' | 'custom';

export interface CalculatorSettings {
  startingBalance: number;
  riskPercent: number;
  winRate: number;
  rewardToRisk: number;
  tradesPerDay: number;
  tradingDaysPerWeek: number;
  period: ProjectionPeriod;
  customMonths: number;
  monthlyDepositOrWithdrawal: number; // positive = deposit, negative = withdrawal
  compounding: boolean;
  commissionPerTrade: number;
  targetMilestone: number;
}

export const DEFAULT_CALCULATOR_SETTINGS: CalculatorSettings = {
  startingBalance: 25000,
  riskPercent: 1.0,
  winRate: 50,
  rewardToRisk: 2.0,
  tradesPerDay: 3,
  tradingDaysPerWeek: 5,
  period: '6m',
  customMonths: 6,
  monthlyDepositOrWithdrawal: 0,
  compounding: true,
  commissionPerTrade: 2.5,
  targetMilestone: 50000,
};
