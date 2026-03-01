import { CandleData, LinePoint, IchimokuData } from "@/types/stock";

function periodHigh(candles: CandleData[], end: number, period: number): number {
  let high = -Infinity;
  for (let i = Math.max(0, end - period + 1); i <= end; i++) {
    if (candles[i].high > high) high = candles[i].high;
  }
  return high;
}

function periodLow(candles: CandleData[], end: number, period: number): number {
  let low = Infinity;
  for (let i = Math.max(0, end - period + 1); i <= end; i++) {
    if (candles[i].low < low) low = candles[i].low;
  }
  return low;
}

/** Generate future trading dates (skip weekends) from the last candle date */
function getFutureDates(lastDate: string, count: number): string[] {
  const dates: string[] = [];
  const d = new Date(lastDate + "T00:00:00");
  while (dates.length < count) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(d.toISOString().split("T")[0]);
    }
  }
  return dates;
}

/** Tenkan-sen (Conversion Line): (9-period high + 9-period low) / 2 */
function calcTenkan(candles: CandleData[]): LinePoint[] {
  const period = 9;
  const result: LinePoint[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const high = periodHigh(candles, i, period);
    const low = periodLow(candles, i, period);
    result.push({
      time: candles[i].time,
      value: Math.round(((high + low) / 2) * 100) / 100,
    });
  }
  return result;
}

/** Kijun-sen (Base Line): (26-period high + 26-period low) / 2 */
function calcKijun(candles: CandleData[]): LinePoint[] {
  const period = 26;
  const result: LinePoint[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const high = periodHigh(candles, i, period);
    const low = periodLow(candles, i, period);
    result.push({
      time: candles[i].time,
      value: Math.round(((high + low) / 2) * 100) / 100,
    });
  }
  return result;
}

/** Senkou Span A (Leading Span A): (Tenkan + Kijun) / 2, plotted 26 periods ahead */
function calcSenkouA(candles: CandleData[]): LinePoint[] {
  const tenkan = calcTenkan(candles);
  const kijun = calcKijun(candles);
  const displacement = 26;

  // Align tenkan and kijun by time
  const kijunMap = new Map(kijun.map((p) => [p.time, p.value]));
  const aligned: LinePoint[] = [];
  for (const t of tenkan) {
    const k = kijunMap.get(t.time);
    if (k !== undefined) {
      aligned.push({
        time: t.time,
        value: Math.round(((t.value + k) / 2) * 100) / 100,
      });
    }
  }

  // Shift forward by 26 periods
  const futureDates = getFutureDates(
    candles[candles.length - 1].time,
    displacement
  );
  const allDates = candles.map((c) => c.time).concat(futureDates);

  const result: LinePoint[] = [];
  for (let i = 0; i < aligned.length; i++) {
    const sourceIndex = candles.findIndex((c) => c.time === aligned[i].time);
    const targetIndex = sourceIndex + displacement;
    if (targetIndex < allDates.length) {
      result.push({
        time: allDates[targetIndex],
        value: aligned[i].value,
      });
    }
  }
  return result;
}

/** Senkou Span B (Leading Span B): (52-period high + 52-period low) / 2, plotted 26 periods ahead */
function calcSenkouB(candles: CandleData[]): LinePoint[] {
  const period = 52;
  const displacement = 26;
  const futureDates = getFutureDates(
    candles[candles.length - 1].time,
    displacement
  );
  const allDates = candles.map((c) => c.time).concat(futureDates);

  const result: LinePoint[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const high = periodHigh(candles, i, period);
    const low = periodLow(candles, i, period);
    const value = Math.round(((high + low) / 2) * 100) / 100;
    const targetIndex = i + displacement;
    if (targetIndex < allDates.length) {
      result.push({ time: allDates[targetIndex], value });
    }
  }
  return result;
}

/** Chikou Span (Lagging Span): close price plotted 26 periods behind */
function calcChikou(candles: CandleData[]): LinePoint[] {
  const displacement = 26;
  const result: LinePoint[] = [];
  for (let i = displacement; i < candles.length; i++) {
    result.push({
      time: candles[i - displacement].time,
      value: candles[i].close,
    });
  }
  return result;
}

/** Calculate all Ichimoku components from candle data */
export function calculateIchimoku(candles: CandleData[]): IchimokuData {
  return {
    tenkan: calcTenkan(candles),
    kijun: calcKijun(candles),
    senkouA: calcSenkouA(candles),
    senkouB: calcSenkouB(candles),
    chikou: calcChikou(candles),
  };
}
