/** Which zone the price is in relative to the Ichimoku cloud */
export type CloudZone = "above" | "inside" | "below";

/** A contiguous period where price stayed in one cloud zone */
export interface ZoneStreak {
  zone: CloudZone;
  startDate: string;
  endDate: string;
  durationDays: number;
  entryPrice: number;
  exitPrice: number;
  returnPct: number;
}

/** A transition event: price moving from one zone to another */
export interface ZoneTransition {
  date: string;
  from: CloudZone;
  to: CloudZone;
  price: number;
}

/** A TK Cross event (Tenkan crossing Kijun) */
export interface TKCrossEvent {
  date: string;
  type: "bullish" | "bearish";
  price: number;
  priceAfter5d: number | null;
  priceAfter10d: number | null;
  priceAfter20d: number | null;
  returnAfter20d: number | null;
  succeeded: boolean | null;
}

/** A "full alignment" event — all 4 Ichimoku conditions agree */
export interface AlignmentEvent {
  date: string;
  tone: "bullish" | "bearish";
  score: number;
  price: number;
  returnAfter20d: number | null;
}

/** Per-zone statistics */
export interface ZoneStats {
  zone: CloudZone;
  totalOccurrences: number;
  avgDurationDays: number;
  medianDurationDays: number;
  avgReturnPct: number;
  totalDaysInZone: number;
  pctOfTotalTime: number;
}

/** Transition probability stats */
export interface TransitionStats {
  fromInside: {
    breakUpPct: number;
    breakDownPct: number;
    totalTransitions: number;
  };
}

/** TK Cross summary statistics */
export interface TKCrossStats {
  totalBullishCrosses: number;
  totalBearishCrosses: number;
  bullishWinRate: number;
  bearishWinRate: number;
  avgReturnAfterBullish: number;
  avgReturnAfterBearish: number;
}

/** Cloud thickness analysis */
export interface CloudThicknessStats {
  avgThicknessPct: number;
  thickCloudHeldPct: number;
  thinCloudHeldPct: number;
}

/** The complete backtest result */
export interface BacktestResult {
  symbol: string;
  dataStartDate: string;
  dataEndDate: string;
  totalTradingDays: number;

  zoneStats: ZoneStats[];
  transitionStats: TransitionStats;

  tkCrossStats: TKCrossStats;
  tkCrossEvents: TKCrossEvent[];
  alignmentEvents: AlignmentEvent[];
  fullAlignmentCount: number;
  fullAlignmentAvgReturn: number | null;
  cloudThickness: CloudThicknessStats;

  zoneStreaks: ZoneStreak[];
  transitions: ZoneTransition[];
}
