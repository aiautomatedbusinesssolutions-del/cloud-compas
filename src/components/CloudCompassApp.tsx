"use client";

import { useEffect, useState, useMemo } from "react";
import { useIchimokuData } from "@/hooks/useIchimokuData";
import { useBacktest } from "@/hooks/useBacktest";
import { detectChartAnnotations } from "@/lib/annotations";
import IchimokuChart from "@/components/charts/IchimokuChart";
import SignalCard from "@/components/ui/SignalCard";
import CloudLegend from "@/components/ui/CloudLegend";
import SearchBar from "@/components/ui/SearchBar";
import BacktestPanel from "@/components/ui/BacktestPanel";

export default function CloudCompassApp() {
  const { ticker, candles, ichimoku, signal, isLoading, isDemo, error, loadTicker } =
    useIchimokuData();
  const backtest = useBacktest();
  const [showAnnotations, setShowAnnotations] = useState(true);

  const annotations = useMemo(
    () => detectChartAnnotations(candles, ichimoku),
    [candles, ichimoku]
  );

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
          <div className="flex flex-wrap items-center justify-end mb-2 gap-3">
            {showAnnotations && annotations.length > 0 && (
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-400" />
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-400" />
                  TK Cross
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="inline-block h-2 w-2 rounded-full bg-rose-400" />
                  Breakout
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-violet-400" />
                  4/4 Alignment
                </span>
              </div>
            )}
            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-[0.97] ${
                showAnnotations
                  ? "bg-violet-500/20 text-violet-400 hover:bg-violet-500/30"
                  : "bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-400"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              Annotations {showAnnotations ? "On" : "Off"}
              {showAnnotations && annotations.length > 0 && (
                <span className="rounded-full bg-violet-500/30 px-1.5 text-[10px]">
                  {annotations.length}
                </span>
              )}
            </button>
          </div>
          <IchimokuChart
            candles={candles}
            ichimoku={ichimoku}
            markers={showAnnotations ? annotations : []}
          />
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
