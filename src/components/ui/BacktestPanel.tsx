"use client";

import { BacktestResult } from "@/types/backtest";

interface BacktestPanelProps {
  ticker: string;
  isDemo: boolean;
  result: BacktestResult | null;
  isLoading: boolean;
  error: string | null;
  onRunBacktest: () => void;
}

export default function BacktestPanel({
  ticker,
  isDemo,
  result,
  isLoading,
  error,
  onRunBacktest,
}: BacktestPanelProps) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5">
      <h2 className="mb-1 text-lg font-semibold text-slate-100">
        History Check
      </h2>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      {/* Pre-backtest CTA */}
      {!result && !isLoading && (
        <>
          <p className="mb-4 text-sm text-slate-400">
            {isDemo
              ? "Switch to a real ticker to see how the Ichimoku Cloud has performed historically."
              : `Want to know how reliable these signals are for ${ticker}? We'll look back up to 5 years to see how the cloud has performed.`}
          </p>
          <button
            onClick={onRunBacktest}
            disabled={isDemo}
            className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Run 5-Year Backtest
          </button>
        </>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-3 py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
          <p className="text-sm text-slate-400">
            Crunching up to 5 years of data...
          </p>
        </div>
      )}

      {/* Results */}
      {result && !isLoading && (
        <div className="mt-3 space-y-6">
          <p className="text-xs text-slate-500">
            Analyzed {result.totalTradingDays.toLocaleString()} trading days
            ({result.dataStartDate} to {result.dataEndDate})
          </p>

          {/* Section A: Zone Time Distribution */}
          <ZoneSection result={result} ticker={ticker} />

          {/* Section B: Decision Zone Breakdown */}
          <DecisionZoneSection result={result} />

          {/* Section C: Signal Report Card */}
          <SignalReportSection result={result} />

          {/* Disclaimer */}
          <p className="text-xs italic text-slate-500">
            Past patterns don&apos;t guarantee future results. This analysis is
            for educational purposes only.
          </p>

          {/* Re-run button */}
          <button
            onClick={onRunBacktest}
            className="rounded-lg border border-slate-600 px-4 py-2 text-xs text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-300"
          >
            Re-run Backtest
          </button>
        </div>
      )}
    </div>
  );
}

// ── Section A: Zone Distribution ────────────────────────────────────

function ZoneSection({
  result,
  ticker,
}: {
  result: BacktestResult;
  ticker: string;
}) {
  const zoneConfig = {
    above: {
      label: "Above Cloud",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    inside: {
      label: "Inside Cloud",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    below: {
      label: "Below Cloud",
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
  } as const;

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-slate-300">
        Where Does {ticker} Spend Its Time?
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {result.zoneStats.map((stat) => {
          const cfg = zoneConfig[stat.zone];
          return (
            <div
              key={stat.zone}
              className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4`}
            >
              <p className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-100">
                {stat.pctOfTotalTime}%
              </p>
              <p className="text-xs text-slate-400">of the time</p>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-slate-400">
                  Avg stay:{" "}
                  <span className="text-slate-300">
                    {stat.avgDurationDays} days
                  </span>
                </p>
                <p className="text-xs text-slate-400">
                  Median stay:{" "}
                  <span className="text-slate-300">
                    {stat.medianDurationDays} days
                  </span>
                </p>
                {stat.zone !== "inside" && (
                  <p className="text-xs text-slate-400">
                    Avg return:{" "}
                    <span
                      className={
                        stat.avgReturnPct >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }
                    >
                      {stat.avgReturnPct >= 0 ? "+" : ""}
                      {stat.avgReturnPct}%
                    </span>
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  {stat.totalOccurrences} occurrences
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Section B: Decision Zone ────────────────────────────────────────

function DecisionZoneSection({ result }: { result: BacktestResult }) {
  const { fromInside } = result.transitionStats;

  if (fromInside.totalTransitions === 0) {
    return (
      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-300">
          What Happens in the Decision Zone?
        </h3>
        <p className="text-sm text-slate-400">
          Not enough cloud entries in the data to determine a pattern.
        </p>
      </div>
    );
  }

  const upCount = Math.round(
    (fromInside.breakUpPct / 100) * fromInside.totalTransitions
  );
  const downCount = fromInside.totalTransitions - upCount;

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-slate-300">
        What Happens in the Decision Zone?
      </h3>
      <p className="mb-3 text-xs text-slate-400">
        When price enters the cloud (the &quot;undecided&quot; zone), which way
        does it tend to break out?
      </p>

      {/* Split bar */}
      <div className="w-full">
        <div className="flex h-9 overflow-hidden rounded-lg">
          <div
            className="flex items-center justify-center bg-emerald-500/50 text-xs font-medium text-emerald-100"
            style={{ width: `${Math.max(fromInside.breakUpPct, 5)}%` }}
          >
            {fromInside.breakUpPct >= 15 && `${fromInside.breakUpPct}%`}
          </div>
          <div
            className="flex items-center justify-center bg-rose-500/50 text-xs font-medium text-rose-100"
            style={{ width: `${Math.max(fromInside.breakDownPct, 5)}%` }}
          >
            {fromInside.breakDownPct >= 15 && `${fromInside.breakDownPct}%`}
          </div>
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-slate-400">
          <span className="text-emerald-400">
            Break Up {fromInside.breakUpPct}%
          </span>
          <span className="text-rose-400">
            Break Down {fromInside.breakDownPct}%
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Out of {fromInside.totalTransitions} times price entered the cloud,{" "}
        <span className="text-emerald-400">{upCount} broke upward</span> and{" "}
        <span className="text-rose-400">{downCount} broke downward</span>.
      </p>
    </div>
  );
}

// ── Section C: Signal Report Card ───────────────────────────────────

function SignalReportSection({ result }: { result: BacktestResult }) {
  const { tkCrossStats, fullAlignmentCount, fullAlignmentAvgReturn, cloudThickness } =
    result;

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-slate-300">
        Signal Report Card
      </h3>
      <div className="space-y-4">
        {/* TK Cross */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4">
          <p className="mb-2 text-xs font-medium text-sky-400">
            TK Cross Win Rate
          </p>
          <p className="text-xs text-slate-400">
            How often does a TK cross correctly predict the next 20 days?
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <p className="text-lg font-bold text-emerald-400">
                {tkCrossStats.bullishWinRate}%
              </p>
              <p className="text-xs text-slate-400">
                Bullish crosses ({tkCrossStats.totalBullishCrosses} total)
              </p>
              <p className="text-xs text-slate-500">
                Avg 20-day return:{" "}
                <span
                  className={
                    tkCrossStats.avgReturnAfterBullish >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }
                >
                  {tkCrossStats.avgReturnAfterBullish >= 0 ? "+" : ""}
                  {tkCrossStats.avgReturnAfterBullish}%
                </span>
              </p>
            </div>
            <div>
              <p className="text-lg font-bold text-rose-400">
                {tkCrossStats.bearishWinRate}%
              </p>
              <p className="text-xs text-slate-400">
                Bearish crosses ({tkCrossStats.totalBearishCrosses} total)
              </p>
              <p className="text-xs text-slate-500">
                Avg 20-day return:{" "}
                <span
                  className={
                    tkCrossStats.avgReturnAfterBearish >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }
                >
                  {tkCrossStats.avgReturnAfterBearish >= 0 ? "+" : ""}
                  {tkCrossStats.avgReturnAfterBearish}%
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Full Alignment */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4">
          <p className="mb-2 text-xs font-medium text-violet-400">
            Full Alignment (All 4 Signals Agree)
          </p>
          <p className="text-xs text-slate-400">
            When every Ichimoku condition lines up in the same direction:
          </p>
          <div className="mt-2">
            <p className="text-lg font-bold text-slate-100">
              {fullAlignmentCount}{" "}
              <span className="text-sm font-normal text-slate-400">
                times in{" "}
                {Math.round(result.totalTradingDays / 252)} years
              </span>
            </p>
            {fullAlignmentAvgReturn !== null && (
              <p className="text-xs text-slate-400">
                Average 20-day return after alignment:{" "}
                <span
                  className={
                    fullAlignmentAvgReturn >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }
                >
                  {fullAlignmentAvgReturn >= 0 ? "+" : ""}
                  {fullAlignmentAvgReturn}%
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Cloud Thickness */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4">
          <p className="mb-2 text-xs font-medium text-amber-400">
            Cloud Thickness
          </p>
          <p className="text-xs text-slate-400">
            Does a thicker cloud provide stronger support or resistance?
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-slate-400">
              Average cloud thickness:{" "}
              <span className="text-slate-300">
                {cloudThickness.avgThicknessPct}% of price
              </span>
            </p>
            <p className="text-xs text-slate-400">
              Thick clouds held as support/resistance:{" "}
              <span className="text-emerald-400">
                {cloudThickness.thickCloudHeldPct}%
              </span>{" "}
              of the time
            </p>
            <p className="text-xs text-slate-400">
              Thin clouds held:{" "}
              <span className="text-amber-400">
                {cloudThickness.thinCloudHeldPct}%
              </span>{" "}
              of the time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
