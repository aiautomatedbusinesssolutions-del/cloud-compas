import { CandleData } from "@/types/stock";

// 252 trading days (~1 year) of OHLC data for "DEMO" ticker
// Narrative: Full cycle ending in a clean Bullish Breakout
//
//   Phase A (Days 1-45):    Established uptrend ~$130 → ~$157
//   Phase B (Days 46-80):   Topping / distribution ~$157 → ~$148 choppy
//   Phase C (Days 81-135):  Downtrend ~$148 → ~$127
//   Phase D (Days 136-180): Consolidation / base-building ~$127-$132
//   Phase E (Days 181-210): Price enters the cloud ~$132 → ~$142
//   Phase F (Days 211-235): Breakout above cloud ~$142 → ~$162, TK cross
//   Phase G (Days 236-252): Confirmation uptrend ~$162 → ~$174

export const MOCK_TICKER = "DEMO";

// Seeded PRNG for deterministic "randomness"
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Phase {
  days: number;
  driftPerDay: number; // daily price drift
  volatility: number; // daily range factor
}

const PHASES: Phase[] = [
  // A: Uptrend
  { days: 45, driftPerDay: 0.55, volatility: 1.8 },
  // B: Topping / distribution
  { days: 35, driftPerDay: -0.12, volatility: 2.2 },
  // C: Downtrend
  { days: 55, driftPerDay: -0.45, volatility: 1.9 },
  // D: Consolidation
  { days: 45, driftPerDay: 0.05, volatility: 1.5 },
  // E: Cloud entry
  { days: 30, driftPerDay: 0.40, volatility: 1.4 },
  // F: Breakout — decisive, lower volatility for directional move
  { days: 25, driftPerDay: 1.00, volatility: 1.5 },
  // G: Confirmation — strong follow-through
  { days: 17, driftPerDay: 0.75, volatility: 1.6 },
];

function generateTradingDates(startDate: string, count: number): string[] {
  const dates: string[] = [];
  const d = new Date(startDate + "T00:00:00");
  while (dates.length < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(d.toISOString().split("T")[0]);
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function generateCandles(): CandleData[] {
  const rng = seededRng(42);
  const totalDays = PHASES.reduce((sum, p) => sum + p.days, 0);
  const dates = generateTradingDates("2025-01-02", totalDays);

  const candles: CandleData[] = [];
  let close = 130.0; // starting price
  let dayIndex = 0;

  for (const phase of PHASES) {
    for (let i = 0; i < phase.days; i++) {
      const prevClose = close;
      // Daily return with drift + noise
      const noise = (rng() - 0.5) * phase.volatility;
      close = prevClose + phase.driftPerDay + noise;
      close = Math.round(close * 100) / 100;

      // Generate OHLC from close
      const wickUp = rng() * phase.volatility * 0.6;
      const wickDown = rng() * phase.volatility * 0.6;

      const open = prevClose + (rng() - 0.5) * 0.6;
      const high = Math.max(open, close) + wickUp;
      const low = Math.min(open, close) - wickDown;

      candles.push({
        time: dates[dayIndex],
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close,
      });
      dayIndex++;
    }
  }

  return candles;
}

export const MOCK_CANDLES: CandleData[] = generateCandles();
