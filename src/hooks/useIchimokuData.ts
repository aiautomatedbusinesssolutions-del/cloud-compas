"use client";

import { useState, useMemo, useCallback } from "react";
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
  error: string | null;
  loadTicker: (ticker: string) => void;
}

export function useIchimokuData(): IchimokuResult {
  const [ticker, setTicker] = useState(MOCK_TICKER);
  const [candles, setCandles] = useState<CandleData[]>(MOCK_CANDLES);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ichimoku = useMemo(() => calculateIchimoku(candles), [candles]);
  const signal = useMemo(
    () => evaluateSignal(candles, ichimoku),
    [candles, ichimoku]
  );

  const loadTicker = useCallback(async (newTicker: string) => {
    const symbol = newTicker.toUpperCase().trim();
    if (!symbol) return;

    // "DEMO" always uses mock data
    if (symbol === MOCK_TICKER) {
      setTicker(MOCK_TICKER);
      setCandles(MOCK_CANDLES);
      setIsDemo(true);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setTicker(symbol);

    try {
      const res = await fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to fetch data for ${symbol}`);
      }

      if (!data.candles || data.candles.length < 52) {
        throw new Error(
          `Not enough data for ${symbol}. Ichimoku needs at least 52 trading days.`
        );
      }

      setCandles(data.candles);
      setIsDemo(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      // Keep previous data on screen so the chart doesn't disappear
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    ticker,
    candles,
    ichimoku,
    signal,
    isLoading,
    isDemo,
    error,
    loadTicker,
  };
}
