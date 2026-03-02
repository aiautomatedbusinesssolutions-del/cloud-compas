import { CandleData, IchimokuData, LinePoint } from "@/types/stock";

export interface ChartMarker {
  time: string;
  position: "aboveBar" | "belowBar";
  color: string;
  shape: "arrowUp" | "arrowDown" | "circle" | "square";
  text: string;
  title: string;
}

function toMap(points: LinePoint[]): Map<string, number> {
  return new Map(points.map((p) => [p.time, p.value]));
}

/** Detect TK crosses, cloud breakouts, and full alignment events */
export function detectChartAnnotations(
  candles: CandleData[],
  ichimoku: IchimokuData
): ChartMarker[] {
  const markers: ChartMarker[] = [];
  const tenkanMap = toMap(ichimoku.tenkan);
  const kijunMap = toMap(ichimoku.kijun);
  const spanAMap = toMap(ichimoku.senkouA);
  const spanBMap = toMap(ichimoku.senkouB);

  let prevTkDiff: number | null = null;
  let prevZone: "above" | "inside" | "below" | null = null;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const tk = tenkanMap.get(candle.time);
    const kj = kijunMap.get(candle.time);
    const a = spanAMap.get(candle.time);
    const b = spanBMap.get(candle.time);

    // ── TK Cross Detection ──
    if (tk !== undefined && kj !== undefined) {
      const diff = tk - kj;
      if (prevTkDiff !== null) {
        if (prevTkDiff < 0 && diff > 0) {
          markers.push({
            time: candle.time,
            position: "belowBar",
            color: "#34d399",
            shape: "arrowUp",
            text: "TK",
            title: "Bullish TK Cross — short-term momentum shifting up",
          });
        } else if (prevTkDiff > 0 && diff < 0) {
          markers.push({
            time: candle.time,
            position: "aboveBar",
            color: "#fb7185",
            shape: "arrowDown",
            text: "TK",
            title: "Bearish TK Cross — short-term momentum fading",
          });
        }
      }
      prevTkDiff = diff;
    }

    // ── Cloud Zone + Breakout Detection ──
    if (a !== undefined && b !== undefined) {
      const cloudTop = Math.max(a, b);
      const cloudBottom = Math.min(a, b);

      let zone: "above" | "inside" | "below";
      if (candle.close > cloudTop) zone = "above";
      else if (candle.close < cloudBottom) zone = "below";
      else zone = "inside";

      if (prevZone === "inside" && zone === "above") {
        markers.push({
          time: candle.time,
          position: "belowBar",
          color: "#34d399",
          shape: "circle",
          text: "B",
          title:
            "Cloud Breakout Up — price broke above the decision zone",
        });
      } else if (prevZone === "inside" && zone === "below") {
        markers.push({
          time: candle.time,
          position: "aboveBar",
          color: "#fb7185",
          shape: "circle",
          text: "B",
          title:
            "Cloud Breakdown — price fell below the decision zone",
        });
      }

      prevZone = zone;
    }

    // ── Full Alignment Detection ──
    if (i >= 52 && a !== undefined && b !== undefined && tk !== undefined && kj !== undefined && i >= 26) {
      const cloudTop = Math.max(a, b);
      const cloudBottom = Math.min(a, b);
      let score = 0;

      // Price vs Cloud
      if (candle.close > cloudTop) score += 1;
      else if (candle.close < cloudBottom) score -= 1;

      // TK relationship
      if (tk > kj) score += 1;
      else if (tk < kj) score -= 1;

      // Cloud color
      if (a > b) score += 1;
      else if (a < b) score -= 1;

      // Chikou check
      if (candle.close > candles[i - 26].close) score += 1;
      else if (candle.close < candles[i - 26].close) score -= 1;

      if (score === 4) {
        // Only mark the first day of a full-alignment streak
        const prevCandle = candles[i - 1];
        const prevA = spanAMap.get(prevCandle.time);
        const prevB = spanBMap.get(prevCandle.time);
        const prevTk = tenkanMap.get(prevCandle.time);
        const prevKj = kijunMap.get(prevCandle.time);
        let prevScore = 0;
        if (prevA !== undefined && prevB !== undefined) {
          const pTop = Math.max(prevA, prevB);
          const pBot = Math.min(prevA, prevB);
          if (prevCandle.close > pTop) prevScore += 1;
          else if (prevCandle.close < pBot) prevScore -= 1;
          if (prevA > prevB) prevScore += 1;
          else if (prevA < prevB) prevScore -= 1;
        }
        if (prevTk !== undefined && prevKj !== undefined) {
          if (prevTk > prevKj) prevScore += 1;
          else if (prevTk < prevKj) prevScore -= 1;
        }
        if (i - 1 >= 26) {
          if (prevCandle.close > candles[i - 27].close) prevScore += 1;
          else if (prevCandle.close < candles[i - 27].close) prevScore -= 1;
        }

        if (prevScore !== 4) {
          markers.push({
            time: candle.time,
            position: "belowBar",
            color: "#a78bfa",
            shape: "square",
            text: "4/4",
            title:
              "Full Bullish Alignment — all 4 Ichimoku signals agree",
          });
        }
      } else if (score === -4) {
        const prevCandle = candles[i - 1];
        const prevA = spanAMap.get(prevCandle.time);
        const prevB = spanBMap.get(prevCandle.time);
        const prevTk = tenkanMap.get(prevCandle.time);
        const prevKj = kijunMap.get(prevCandle.time);
        let prevScore = 0;
        if (prevA !== undefined && prevB !== undefined) {
          const pTop = Math.max(prevA, prevB);
          const pBot = Math.min(prevA, prevB);
          if (prevCandle.close > pTop) prevScore += 1;
          else if (prevCandle.close < pBot) prevScore -= 1;
          if (prevA > prevB) prevScore += 1;
          else if (prevA < prevB) prevScore -= 1;
        }
        if (prevTk !== undefined && prevKj !== undefined) {
          if (prevTk > prevKj) prevScore += 1;
          else if (prevTk < prevKj) prevScore -= 1;
        }
        if (i - 1 >= 26) {
          if (prevCandle.close > candles[i - 27].close) prevScore += 1;
          else if (prevCandle.close < candles[i - 27].close) prevScore -= 1;
        }

        if (prevScore !== -4) {
          markers.push({
            time: candle.time,
            position: "aboveBar",
            color: "#a78bfa",
            shape: "square",
            text: "4/4",
            title:
              "Full Bearish Alignment — all 4 Ichimoku signals agree",
          });
        }
      }
    }
  }

  // Markers must be sorted by time for lightweight-charts
  markers.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));

  return markers;
}
