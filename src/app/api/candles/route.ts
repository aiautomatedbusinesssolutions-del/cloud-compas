import { NextRequest, NextResponse } from "next/server";
import { fetchCandles } from "@/lib/services/twelvedata";

const SYMBOL_RE = /^[A-Z]{1,5}$/i;

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("symbol");

  if (!raw || raw.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing 'symbol' parameter" },
      { status: 400 }
    );
  }

  const symbol = raw.toUpperCase().trim();

  if (!SYMBOL_RE.test(symbol)) {
    return NextResponse.json(
      { error: "Invalid ticker symbol. Use 1–5 letters (e.g. AAPL)." },
      { status: 400 }
    );
  }

  try {
    const candles = await fetchCandles(symbol);
    return NextResponse.json({ candles });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
