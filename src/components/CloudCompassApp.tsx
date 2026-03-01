"use client";

import { useEffect } from "react";
import { useIchimokuData } from "@/hooks/useIchimokuData";
import { useBacktest } from "@/hooks/useBacktest";
import IchimokuChart from "@/components/charts/IchimokuChart";
import SignalCard from "@/components/ui/SignalCard";
import CloudLegend from "@/components/ui/CloudLegend";
import SearchBar from "@/components/ui/SearchBar";
import BacktestPanel from "@/components/ui/BacktestPanel";

export default function CloudCompassApp() {
  const { ticker, candles, ichimoku, signal, isLoading, isDemo, error, loadTicker } =
    useIchimokuData();
  const backtest = useBacktest();

  // Clear backtest results when ticker changes
  useEffect(() => {
    backtest.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  return (
    <>
      <SearchBar
        currentTicker={ticker}
        isDemo={isDemo}
        onSearch={loadTicker}
      />

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
        </div>
      ) : (
        <>
          <SignalCard signal={signal} />
          <IchimokuChart candles={candles} ichimoku={ichimoku} />
          <BacktestPanel
            ticker={ticker}
            isDemo={isDemo}
            result={backtest.result}
            isLoading={backtest.isLoading}
            error={backtest.error}
            onRunBacktest={() => backtest.run(ticker)}
          />
          <CloudLegend />
        </>
      )}
    </>
  );
}
