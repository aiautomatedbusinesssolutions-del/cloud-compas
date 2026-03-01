import { CandleData, IchimokuData, LinePoint } from "@/types/stock";
import {
  CloudZone,
  ZoneStreak,
  ZoneTransition,
  TKCrossEvent,
  AlignmentEvent,
  ZoneStats,
  TransitionStats,
  TKCrossStats,
  CloudThicknessStats,
  BacktestResult,
} from "@/types/backtest";

// ── Helpers ──────────────────────────────────────────────────────────

function toMap(points: LinePoint[]): Map<string, number> {
  return new Map(points.map((p) => [p.time, p.value]));
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Pass 1: Zone Classification ─────────────────────────────────────

interface ZoneDay {
  date: string;
  zone: CloudZone;
  close: number;
  cloudTop: number;
  cloudBottom: number;
}

function classifyZones(
  candles: CandleData[],
  senkouA: LinePoint[],
  senkouB: LinePoint[]
): ZoneDay[] {
  const aMap = toMap(senkouA);
  const bMap = toMap(senkouB);
  const results: ZoneDay[] = [];

  for (const candle of candles) {
    const a = aMap.get(candle.time);
    const b = bMap.get(candle.time);
    if (a === undefined || b === undefined) continue;

    const cloudTop = Math.max(a, b);
    const cloudBottom = Math.min(a, b);

    let zone: CloudZone;
    if (candle.close > cloudTop) {
      zone = "above";
    } else if (candle.close < cloudBottom) {
      zone = "below";
    } else {
      zone = "inside";
    }

    results.push({ date: candle.time, zone, close: candle.close, cloudTop, cloudBottom });
  }

  return results;
}

// ── Pass 2: Streaks & Transitions ───────────────────────────────────

function detectStreaksAndTransitions(zoneData: ZoneDay[]): {
  streaks: ZoneStreak[];
  transitions: ZoneTransition[];
} {
  const streaks: ZoneStreak[] = [];
  const transitions: ZoneTransition[] = [];

  if (zoneData.length === 0) return { streaks, transitions };

  let currentZone = zoneData[0].zone;
  let streakStart = 0;

  for (let i = 1; i <= zoneData.length; i++) {
    const atEnd = i === zoneData.length;
    const zoneChanged = !atEnd && zoneData[i].zone !== currentZone;

    if (atEnd || zoneChanged) {
      const endIdx = i - 1;
      streaks.push({
        zone: currentZone,
        startDate: zoneData[streakStart].date,
        endDate: zoneData[endIdx].date,
        durationDays: endIdx - streakStart + 1,
        entryPrice: zoneData[streakStart].close,
        exitPrice: zoneData[endIdx].close,
        returnPct: round2(
          ((zoneData[endIdx].close - zoneData[streakStart].close) /
            zoneData[streakStart].close) *
            100
        ),
      });

      if (zoneChanged) {
        transitions.push({
          date: zoneData[i].date,
          from: currentZone,
          to: zoneData[i].zone,
          price: zoneData[i].close,
        });
        currentZone = zoneData[i].zone;
        streakStart = i;
      }
    }
  }

  return { streaks, transitions };
}

// ── Zone Stats ──────────────────────────────────────────────────────

function computeZoneStats(
  streaks: ZoneStreak[],
  totalDays: number
): ZoneStats[] {
  const zones: CloudZone[] = ["above", "inside", "below"];

  return zones.map((zone) => {
    const zoneStreaks = streaks.filter((s) => s.zone === zone);
    const durations = zoneStreaks.map((s) => s.durationDays);
    const returns = zoneStreaks.map((s) => s.returnPct);
    const totalDaysInZone = durations.reduce((sum, d) => sum + d, 0);

    return {
      zone,
      totalOccurrences: zoneStreaks.length,
      avgDurationDays: round2(
        durations.length > 0
          ? durations.reduce((s, d) => s + d, 0) / durations.length
          : 0
      ),
      medianDurationDays: median(durations),
      avgReturnPct: round2(
        returns.length > 0
          ? returns.reduce((s, r) => s + r, 0) / returns.length
          : 0
      ),
      totalDaysInZone,
      pctOfTotalTime: round2(
        totalDays > 0 ? (totalDaysInZone / totalDays) * 100 : 0
      ),
    };
  });
}

// ── Transition Stats ────────────────────────────────────────────────

function computeTransitionStats(transitions: ZoneTransition[]): TransitionStats {
  const fromInside = transitions.filter((t) => t.from === "inside");
  const breakUp = fromInside.filter((t) => t.to === "above").length;
  const breakDown = fromInside.filter((t) => t.to === "below").length;
  const total = fromInside.length;

  return {
    fromInside: {
      breakUpPct: round2(total > 0 ? (breakUp / total) * 100 : 0),
      breakDownPct: round2(total > 0 ? (breakDown / total) * 100 : 0),
      totalTransitions: total,
    },
  };
}

// ── Pass 3: TK Cross Detection ──────────────────────────────────────

function detectTKCrosses(
  candles: CandleData[],
  tenkan: LinePoint[],
  kijun: LinePoint[]
): TKCrossEvent[] {
  const tenkanMap = toMap(tenkan);
  const kijunMap = toMap(kijun);
  const indexMap = new Map(candles.map((c, i) => [c.time, i]));

  const events: TKCrossEvent[] = [];
  let prevDiff: number | null = null;

  for (const candle of candles) {
    const t = tenkanMap.get(candle.time);
    const k = kijunMap.get(candle.time);
    if (t === undefined || k === undefined) {
      prevDiff = null;
      continue;
    }

    const diff = t - k;

    if (prevDiff !== null) {
      const crossed =
        (prevDiff < 0 && diff > 0) || (prevDiff > 0 && diff < 0);

      if (crossed) {
        const type = diff > 0 ? "bullish" : "bearish";
        const idx = indexMap.get(candle.time)!;

        const after5 =
          idx + 5 < candles.length ? candles[idx + 5].close : null;
        const after10 =
          idx + 10 < candles.length ? candles[idx + 10].close : null;
        const after20 =
          idx + 20 < candles.length ? candles[idx + 20].close : null;

        const ret20 =
          after20 !== null
            ? round2(((after20 - candle.close) / candle.close) * 100)
            : null;

        let succeeded: boolean | null = null;
        if (after20 !== null) {
          succeeded =
            type === "bullish"
              ? after20 > candle.close
              : after20 < candle.close;
        }

        events.push({
          date: candle.time,
          type,
          price: candle.close,
          priceAfter5d: after5,
          priceAfter10d: after10,
          priceAfter20d: after20,
          returnAfter20d: ret20,
          succeeded,
        });
      }
    }

    prevDiff = diff;
  }

  return events;
}

function computeTKCrossStats(events: TKCrossEvent[]): TKCrossStats {
  const bullish = events.filter((e) => e.type === "bullish");
  const bearish = events.filter((e) => e.type === "bearish");

  const bullishWithResult = bullish.filter((e) => e.succeeded !== null);
  const bearishWithResult = bearish.filter((e) => e.succeeded !== null);

  const bullishWins = bullishWithResult.filter((e) => e.succeeded).length;
  const bearishWins = bearishWithResult.filter((e) => e.succeeded).length;

  const bullishReturns = bullish
    .filter((e) => e.returnAfter20d !== null)
    .map((e) => e.returnAfter20d!);
  const bearishReturns = bearish
    .filter((e) => e.returnAfter20d !== null)
    .map((e) => e.returnAfter20d!);

  return {
    totalBullishCrosses: bullish.length,
    totalBearishCrosses: bearish.length,
    bullishWinRate: round2(
      bullishWithResult.length > 0
        ? (bullishWins / bullishWithResult.length) * 100
        : 0
    ),
    bearishWinRate: round2(
      bearishWithResult.length > 0
        ? (bearishWins / bearishWithResult.length) * 100
        : 0
    ),
    avgReturnAfterBullish: round2(
      bullishReturns.length > 0
        ? bullishReturns.reduce((s, r) => s + r, 0) / bullishReturns.length
        : 0
    ),
    avgReturnAfterBearish: round2(
      bearishReturns.length > 0
        ? bearishReturns.reduce((s, r) => s + r, 0) / bearishReturns.length
        : 0
    ),
  };
}

// ── Full Alignment Detection ────────────────────────────────────────

function detectAlignments(
  candles: CandleData[],
  ichimoku: IchimokuData
): AlignmentEvent[] {
  const spanAMap = toMap(ichimoku.senkouA);
  const spanBMap = toMap(ichimoku.senkouB);
  const tenkanMap = toMap(ichimoku.tenkan);
  const kijunMap = toMap(ichimoku.kijun);

  const events: AlignmentEvent[] = [];

  for (let i = 52; i < candles.length; i++) {
    const candle = candles[i];
    let score = 0;

    // 1. Price vs Cloud
    const a = spanAMap.get(candle.time);
    const b = spanBMap.get(candle.time);
    if (a !== undefined && b !== undefined) {
      const cloudTop = Math.max(a, b);
      const cloudBottom = Math.min(a, b);
      if (candle.close > cloudTop) score += 1;
      else if (candle.close < cloudBottom) score -= 1;
    }

    // 2. TK relationship
    const tk = tenkanMap.get(candle.time);
    const kj = kijunMap.get(candle.time);
    if (tk !== undefined && kj !== undefined) {
      if (tk > kj) score += 1;
      else if (tk < kj) score -= 1;
    }

    // 3. Cloud color at this time
    if (a !== undefined && b !== undefined) {
      if (a > b) score += 1;
      else if (a < b) score -= 1;
    }

    // 4. Chikou check (current close vs 26 periods ago)
    if (i >= 26) {
      if (candle.close > candles[i - 26].close) score += 1;
      else if (candle.close < candles[i - 26].close) score -= 1;
    }

    if (Math.abs(score) === 4) {
      const after20 =
        i + 20 < candles.length ? candles[i + 20].close : null;
      const ret =
        after20 !== null
          ? round2(((after20 - candle.close) / candle.close) * 100)
          : null;

      events.push({
        date: candle.time,
        tone: score > 0 ? "bullish" : "bearish",
        score,
        price: candle.close,
        returnAfter20d: ret,
      });
    }
  }

  return events;
}

// ── Cloud Thickness ─────────────────────────────────────────────────

function analyzeCloudThickness(zoneData: ZoneDay[]): CloudThicknessStats {
  if (zoneData.length < 2) {
    return { avgThicknessPct: 0, thickCloudHeldPct: 0, thinCloudHeldPct: 0 };
  }

  let totalThicknessPct = 0;
  let thickTests = 0;
  let thickHeld = 0;
  let thinTests = 0;
  let thinHeld = 0;

  for (let i = 0; i < zoneData.length; i++) {
    const d = zoneData[i];
    const midPrice = (d.cloudTop + d.cloudBottom) / 2;
    const thicknessPct =
      midPrice > 0 ? ((d.cloudTop - d.cloudBottom) / midPrice) * 100 : 0;
    totalThicknessPct += thicknessPct;

    // Check if cloud acted as support/resistance at zone boundaries
    if (i > 0) {
      const prev = zoneData[i - 1];
      const isThick = thicknessPct > 2;

      // Price was above cloud and approached it
      if (prev.zone === "above" && d.zone === "above") {
        // Still above — cloud held as support
      } else if (prev.zone === "above" && d.zone !== "above") {
        // Broke through — cloud didn't hold
        if (isThick) {
          thickTests++;
        } else {
          thinTests++;
        }
      }

      // Price was below cloud and approached it
      if (prev.zone === "below" && d.zone !== "below") {
        if (isThick) {
          thickTests++;
        } else {
          thinTests++;
        }
      }

      // Track when zone stays same near cloud boundary as "held"
      if (
        prev.zone === "above" &&
        d.zone === "above" &&
        d.close <= d.cloudTop * 1.01
      ) {
        if (isThick) {
          thickTests++;
          thickHeld++;
        } else {
          thinTests++;
          thinHeld++;
        }
      }

      if (
        prev.zone === "below" &&
        d.zone === "below" &&
        d.close >= d.cloudBottom * 0.99
      ) {
        if (isThick) {
          thickTests++;
          thickHeld++;
        } else {
          thinTests++;
          thinHeld++;
        }
      }
    }
  }

  return {
    avgThicknessPct: round2(totalThicknessPct / zoneData.length),
    thickCloudHeldPct: round2(
      thickTests > 0 ? (thickHeld / thickTests) * 100 : 0
    ),
    thinCloudHeldPct: round2(
      thinTests > 0 ? (thinHeld / thinTests) * 100 : 0
    ),
  };
}

// ── Main Export ─────────────────────────────────────────────────────

export function runBacktest(
  candles: CandleData[],
  ichimoku: IchimokuData
): BacktestResult {
  const zoneData = classifyZones(candles, ichimoku.senkouA, ichimoku.senkouB);
  const { streaks, transitions } = detectStreaksAndTransitions(zoneData);
  const tkCrossEvents = detectTKCrosses(
    candles,
    ichimoku.tenkan,
    ichimoku.kijun
  );
  const alignmentEvents = detectAlignments(candles, ichimoku);
  const cloudThickness = analyzeCloudThickness(zoneData);

  const zoneStats = computeZoneStats(streaks, zoneData.length);
  const transitionStats = computeTransitionStats(transitions);
  const tkCrossStats = computeTKCrossStats(tkCrossEvents);

  const validAlignments = alignmentEvents.filter(
    (e) => e.returnAfter20d !== null
  );
  const fullAlignmentAvgReturn =
    validAlignments.length > 0
      ? round2(
          validAlignments.reduce((sum, e) => sum + e.returnAfter20d!, 0) /
            validAlignments.length
        )
      : null;

  return {
    symbol: "",
    dataStartDate: candles[0]?.time ?? "",
    dataEndDate: candles[candles.length - 1]?.time ?? "",
    totalTradingDays: candles.length,
    zoneStats,
    transitionStats,
    tkCrossStats,
    tkCrossEvents,
    alignmentEvents,
    fullAlignmentCount: alignmentEvents.length,
    fullAlignmentAvgReturn,
    cloudThickness,
    zoneStreaks: streaks,
    transitions,
  };
}
