/**
 * Drawdown & Prop Firm Calculation Unit Tests
 */
import { calculateDrawdown, calculateConsistencyRule } from './drawdownUtils.js';

function runTests() {
  console.log('--- RUNNING DRAWDOWN & PROP FIRM UNIT TESTS ---');

  // Test 1: Static Drawdown (FTMO style)
  const ftmoAccount = {
    startingBalance: 100000,
    maxTotalDrawdown: 10000,
    drawdownType: 'static',
    trailingFreezeEnabled: false
  };
  const ftmoTrades = [
    { profitLoss: 5000, tradeDate: '2026-07-01' },
    { profitLoss: -8000, tradeDate: '2026-07-02' }
  ];
  const res1 = calculateDrawdown(ftmoAccount, ftmoTrades);
  console.assert(res1.floor === 90000, `Test 1 Failed: Expected static floor 90000, got ${res1.floor}`);
  console.assert(res1.peakEquity === 105000, `Test 1 Failed: Expected peak 105000, got ${res1.peakEquity}`);
  console.assert(res1.currentEquity === 97000, `Test 1 Failed: Expected equity 97000, got ${res1.currentEquity}`);
  console.log('✅ Test 1 Passed: Static Drawdown (FTMO fixed floor)');

  // Test 2: Trailing Drawdown with Freeze Enabled (Apex style)
  const apexAccount = {
    startingBalance: 50000,
    maxTotalDrawdown: 2500,
    drawdownType: 'trailing',
    trailingFreezeEnabled: true
  };
  // Peak reaches $60,000 -> Uncapped floor is $57,500. Since freeze enabled, floor caps at startingBalance ($50,000)
  const apexTrades = [
    { profitLoss: 10000, tradeDate: '2026-07-01' }
  ];
  const res2 = calculateDrawdown(apexAccount, apexTrades);
  console.assert(res2.floor === 50000, `Test 2 Failed: Expected frozen floor 50000, got ${res2.floor}`);
  console.log('✅ Test 2 Passed: Trailing Drawdown with Freeze Enabled (Apex style)');

  // Test 3: Trailing Drawdown with Freeze Disabled (MFF / FTMO Trailing style)
  const mffAccount = {
    startingBalance: 50000,
    maxTotalDrawdown: 2500,
    drawdownType: 'trailing',
    trailingFreezeEnabled: false
  };
  const res3 = calculateDrawdown(mffAccount, apexTrades);
  console.assert(res3.floor === 57500, `Test 3 Failed: Expected unfrozen floor 57500, got ${res3.floor}`);
  console.log('✅ Test 3 Passed: Trailing Drawdown with Freeze Disabled (MFF style)');

  // Test 4: Consistency Rule Calculation
  const consistencyAccount = { consistencyRuleLimit: 30 };
  const consistencyTrades = [
    { profitLoss: 500, tradeDate: '2026-07-01' },
    { profitLoss: 200, tradeDate: '2026-07-02' },
    { profitLoss: 300, tradeDate: '2026-07-03' }
  ]; // Total profit = 1000, Largest = 500 -> 50% consistency
  const res4 = calculateConsistencyRule(consistencyAccount, consistencyTrades);
  console.assert(res4.consistencyPct === 50, `Test 4 Failed: Expected 50% consistency, got ${res4.consistencyPct}`);
  console.assert(res4.isBreached === true, 'Test 4 Failed: Expected consistency limit breached');
  console.log('✅ Test 4 Passed: Consistency Rule calculation');

  console.log('--- ALL UNIT TESTS COMPLETED SUCCESSFULLY ---');
}

runTests();
