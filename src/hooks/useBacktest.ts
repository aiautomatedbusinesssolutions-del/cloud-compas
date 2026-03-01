"use client";

import { useState, useCallback } from "react";
import { calculateIchimoku } from "@/lib/ichimoku";
import { runBacktest } from "@/lib/backtest";
import { BacktestResult } from "@/types/backtest";

interface BacktestState {
  result: BacktestResult | null;
  isLoading: boolean;
  error: string | null;
  run: (ticker: string) => void;
  reset: () => void;
}

export function useBacktest(): BacktestState {
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const run = useCallback(async (ticker: string) => {
    const symbol = ticker.toUpperCase().trim();
    if (!symbol || symbol === "DEMO") {
      setError(
        "Backtesting requires real market data. Enter a ticker like AAPL or MSFT."
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/candles/extended?symbol=${encodeURIComponent(symbol)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to fetch data for ${symbol}`);
      }

      if (!data.candles || data.candles.length < 260) {
        throw new Error(
          `Not enough historical data for ${symbol}. Backtesting needs at least 1 year of trading data.`
        );
      }

      const candles = data.candles;
      const ichimoku = calculateIchimoku(candles);
      const backtestResult = runBacktest(candles, ichimoku);
      backtestResult.symbol = symbol;

      setResult(backtestResult);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { result, isLoading, error, run, reset };
}
