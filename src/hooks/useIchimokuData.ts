"use client";

import { useState, useMemo } from "react";
import { MOCK_CANDLES, MOCK_TICKER } from "@/lib/mockData";
import { calculateIchimoku } from "@/lib/ichimoku";
import { evaluateSignal } from "@/lib/signals";
import { CandleData, IchimokuData, IchimokuSignal } from "@/types/stock";

interface IchimokuResult {
  ticker: string;
  candles: CandleData[];
  ichimoku: IchimokuData;
  signal: IchimokuSignal;
  isLoading: boolean;
  isDemo: boolean;
  loadTicker: (ticker: string) => void;
}

export function useIchimokuData(): IchimokuResult {
  const [ticker, setTicker] = useState(MOCK_TICKER);
  const [isLoading, setIsLoading] = useState(false);

  // Phase 1: Always use mock data regardless of ticker
  const candles = MOCK_CANDLES;
  const isDemo = true;

  const ichimoku = useMemo(() => calculateIchimoku(candles), [candles]);
  const signal = useMemo(
    () => evaluateSignal(candles, ichimoku),
    [candles, ichimoku]
  );

  const loadTicker = (newTicker: string) => {
    setIsLoading(true);
    setTicker(newTicker.toUpperCase() || MOCK_TICKER);
    // Simulate a brief loading state for future API integration
    setTimeout(() => setIsLoading(false), 300);
  };

  return {
    ticker,
    candles,
    ichimoku,
    signal,
    isLoading,
    isDemo,
    loadTicker,
  };
}
