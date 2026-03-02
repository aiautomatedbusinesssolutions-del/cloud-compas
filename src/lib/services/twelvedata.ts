import { CandleData } from "@/types/stock";

interface TwelveDataResponse {
  status: string;
  values?: {
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
  }[];
  message?: string;
}

/** Fetch ~1 year of daily candles via Twelve Data API (server-side only) */
export async function fetchCandles(symbol: string): Promise<CandleData[]> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    throw new Error("TWELVE_DATA_API_KEY is not configured");
  }

  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=252&apikey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Twelve Data API error: ${res.status}`);
  }

  const data: TwelveDataResponse = await res.json();

  if (data.status === "error" || !data.values || data.values.length === 0) {
    throw new Error(
      data.message || `No data found for symbol "${symbol}"`
    );
  }

  // Twelve Data returns newest first — reverse to chronological order
  const candles: CandleData[] = data.values
    .map((v) => ({
      time: v.datetime,
      open: Math.round(parseFloat(v.open) * 100) / 100,
      high: Math.round(parseFloat(v.high) * 100) / 100,
      low: Math.round(parseFloat(v.low) * 100) / 100,
      close: Math.round(parseFloat(v.close) * 100) / 100,
    }))
    .reverse();

  return candles;
}

/** Fetch ~5 years of daily candles via Twelve Data API (server-side only) */
export async function fetchExtendedCandles(
  symbol: string
): Promise<CandleData[]> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    throw new Error("TWELVE_DATA_API_KEY is not configured");
  }

  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=1300&apikey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Twelve Data API error: ${res.status}`);
  }

  const data: TwelveDataResponse = await res.json();

  if (data.status === "error" || !data.values || data.values.length === 0) {
    throw new Error(
      data.message || `No data found for symbol "${symbol}"`
    );
  }

  const candles: CandleData[] = data.values
    .map((v) => ({
      time: v.datetime,
      open: Math.round(parseFloat(v.open) * 100) / 100,
      high: Math.round(parseFloat(v.high) * 100) / 100,
      low: Math.round(parseFloat(v.low) * 100) / 100,
      close: Math.round(parseFloat(v.close) * 100) / 100,
    }))
    .reverse();

  return candles;
}
