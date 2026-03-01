export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface LinePoint {
  time: string;
  value: number;
}

export interface IchimokuData {
  tenkan: LinePoint[];
  kijun: LinePoint[];
  senkouA: LinePoint[];
  senkouB: LinePoint[];
  chikou: LinePoint[];
}

export interface IchimokuSignal {
  score: number;
  verdict: string;
  tone: "bullish" | "bearish" | "neutral";
  conditions: {
    label: string;
    met: boolean;
    description: string;
  }[];
}
