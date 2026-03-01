export interface ExplainerContent {
  id: string;
  name: string;
  nickname: string;
  color: string;
  colorHex: string;
  oneLiner: string;
  fullExplainer: string;
}

export const ICHIMOKU_EXPLAINERS: ExplainerContent[] = [
  {
    id: "tenkan",
    name: "Conversion Line",
    nickname: "The Quick Pulse",
    color: "text-sky-400",
    colorHex: "#38bdf8",
    oneLiner: "Shows short-term momentum over 9 days.",
    fullExplainer:
      "Think of this as the stock's 'pulse' — it tracks the midpoint of the last 9 days. When it's rising, short-term buyers are likely in control. When it crosses above the Base Line, that's historically a bullish signal.",
  },
  {
    id: "kijun",
    name: "Base Line",
    nickname: "The Trend's Backbone",
    color: "text-orange-400",
    colorHex: "#fb923c",
    oneLiner: "Shows the medium-term trend over 26 days.",
    fullExplainer:
      "This is the 'backbone' of the trend — the midpoint of the last 26 days. It moves slower than the Conversion Line, so when price is above it, the medium-term trend is potentially bullish. It also acts as a natural support or resistance level.",
  },
  {
    id: "senkouA",
    name: "Leading Span A",
    nickname: "The Cloud's Optimist",
    color: "text-emerald-400",
    colorHex: "#34d399",
    oneLiner: "The faster edge of the cloud, plotted 26 days ahead.",
    fullExplainer:
      "This line is the average of the Conversion and Base Lines, projected 26 days into the future. It forms one edge of the 'cloud.' When it's above Leading Span B, the cloud appears green — a potentially bullish signal.",
  },
  {
    id: "senkouB",
    name: "Leading Span B",
    nickname: "The Cloud's Realist",
    color: "text-rose-400",
    colorHex: "#fb7185",
    oneLiner: "The slower edge of the cloud, based on 52 days.",
    fullExplainer:
      "This is the midpoint of the last 52 days, also projected 26 days ahead. It forms the other edge of the cloud. Because it uses a longer lookback, it moves more slowly and represents stronger, more established support or resistance.",
  },
  {
    id: "chikou",
    name: "Lagging Span",
    nickname: "The Rearview Mirror",
    color: "text-violet-400",
    colorHex: "#a78bfa",
    oneLiner: "Today's close, plotted 26 days in the past.",
    fullExplainer:
      "This line plots today's closing price 26 days back on the chart — like looking in a rearview mirror. When it's above the price from 26 days ago, it suggests the current trend is likely stronger than what came before.",
  },
  {
    id: "kumo",
    name: "The Cloud (Kumo)",
    nickname: "The Decision Zone",
    color: "text-slate-300",
    colorHex: "#cbd5e1",
    oneLiner: "The shaded area between the two Leading Spans.",
    fullExplainer:
      "The cloud is the shaded zone between Leading Span A and B. When price is above the cloud, the trend is potentially bullish. When below, potentially bearish. When inside the cloud, the market is likely undecided — it's a 'decision zone.' A thicker cloud means stronger potential support or resistance.",
  },
];
