import { CandleData, IchimokuData, IchimokuSignal } from "@/types/stock";

/** Evaluate Ichimoku signal conditions at the latest candle */
export function evaluateSignal(
  candles: CandleData[],
  ichimoku: IchimokuData
): IchimokuSignal {
  const lastCandle = candles[candles.length - 1];
  const lastTime = lastCandle.time;
  const lastClose = lastCandle.close;

  const conditions: IchimokuSignal["conditions"] = [];
  let score = 0;

  // Find the Senkou Span values at the last candle's time
  const spanA = ichimoku.senkouA.find((p) => p.time === lastTime);
  const spanB = ichimoku.senkouB.find((p) => p.time === lastTime);

  // 1. Price vs Cloud
  if (spanA && spanB) {
    const cloudTop = Math.max(spanA.value, spanB.value);
    const cloudBottom = Math.min(spanA.value, spanB.value);

    if (lastClose > cloudTop) {
      score += 1;
      conditions.push({
        label: "Price vs Cloud",
        met: true,
        description: "Price is above the cloud — potentially bullish territory.",
      });
    } else if (lastClose < cloudBottom) {
      score -= 1;
      conditions.push({
        label: "Price vs Cloud",
        met: false,
        description: "Price is below the cloud — potentially bearish territory.",
      });
    } else {
      conditions.push({
        label: "Price vs Cloud",
        met: false,
        description: "Price is inside the cloud — the market is likely undecided.",
      });
    }
  }

  // 2. TK Cross (Tenkan vs Kijun)
  const lastTenkan = ichimoku.tenkan.find((p) => p.time === lastTime);
  const lastKijun = ichimoku.kijun.find((p) => p.time === lastTime);

  if (lastTenkan && lastKijun) {
    if (lastTenkan.value > lastKijun.value) {
      score += 1;
      conditions.push({
        label: "TK Cross",
        met: true,
        description:
          "The Quick Pulse is above the Backbone — short-term momentum is likely positive.",
      });
    } else {
      score -= 1;
      conditions.push({
        label: "TK Cross",
        met: false,
        description:
          "The Quick Pulse is below the Backbone — short-term momentum is potentially fading.",
      });
    }
  }

  // 3. Cloud Color (future cloud: Span A vs Span B at the latest projected point)
  const lastSenkouA = ichimoku.senkouA[ichimoku.senkouA.length - 1];
  const lastSenkouB = ichimoku.senkouB[ichimoku.senkouB.length - 1];

  if (lastSenkouA && lastSenkouB) {
    if (lastSenkouA.value > lastSenkouB.value) {
      score += 1;
      conditions.push({
        label: "Future Cloud",
        met: true,
        description:
          "The future cloud is green — the trend ahead is potentially bullish.",
      });
    } else {
      score -= 1;
      conditions.push({
        label: "Future Cloud",
        met: false,
        description:
          "The future cloud is red — the trend ahead is potentially bearish.",
      });
    }
  }

  // 4. Chikou Span vs price 26 periods ago
  const chikouLast = ichimoku.chikou[ichimoku.chikou.length - 1];
  if (chikouLast) {
    // The Chikou Span is plotted at 26 periods ago. Compare its value (current close)
    // against the close price at that historical time.
    const historicalCandle = candles.find((c) => c.time === chikouLast.time);
    if (historicalCandle) {
      if (chikouLast.value > historicalCandle.close) {
        score += 1;
        conditions.push({
          label: "Rearview Check",
          met: true,
          description:
            "Current price is higher than 26 days ago — momentum is likely building.",
        });
      } else {
        score -= 1;
        conditions.push({
          label: "Rearview Check",
          met: false,
          description:
            "Current price is lower than 26 days ago — momentum is potentially weakening.",
        });
      }
    }
  }

  // Determine verdict
  let verdict: string;
  let tone: IchimokuSignal["tone"];

  if (score >= 3) {
    verdict = "Likely Bullish — Most signals point upward.";
    tone = "bullish";
  } else if (score >= 1) {
    verdict = "Potentially Turning Up — Some positive signals emerging.";
    tone = "bullish";
  } else if (score >= -1) {
    verdict = "Mixed Signals — Wait for clarity before deciding.";
    tone = "neutral";
  } else {
    verdict = "Likely Bearish — Most signals point downward.";
    tone = "bearish";
  }

  return { score, verdict, tone, conditions };
}
