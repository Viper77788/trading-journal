import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  CalculatorSettings,
  DEFAULT_CALCULATOR_SETTINGS,
} from '../types/settings';
import {
  computeFutureProjection,
  runMonteCarloSimulation,
} from '../utils/monteCarlo';

const CALC_STORAGE_KEY = 'apexflow_calculator_settings_v1';

export function useCalculator() {
  const [calcSettings, setCalcSettings] = useLocalStorage<CalculatorSettings>(
    CALC_STORAGE_KEY,
    DEFAULT_CALCULATOR_SETTINGS
  );

  const updateCalcSettings = useCallback(
    (patch: Partial<CalculatorSettings>) => {
      setCalcSettings((prev) => ({ ...prev, ...patch }));
    },
    [setCalcSettings]
  );

  const resetCalcSettings = useCallback(() => {
    setCalcSettings(DEFAULT_CALCULATOR_SETTINGS);
  }, [setCalcSettings]);

  const projection = useMemo(
    () => computeFutureProjection(calcSettings),
    [calcSettings]
  );

  const monteCarlo = useMemo(
    () => runMonteCarloSimulation(calcSettings, 1000),
    [calcSettings]
  );

  return {
    calcSettings,
    updateCalcSettings,
    resetCalcSettings,
    projection,
    monteCarlo,
  };
}
