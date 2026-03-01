import { NextRequest, NextResponse } from "next/server";
import { fetchCandles } from "@/lib/services/finnhub";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");

  if (!symbol || symbol.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing 'symbol' parameter" },
      { status: 400 }
    );
  }

  try {
    const candles = await fetchCandles(symbol.toUpperCase().trim());
    return NextResponse.json({ candles });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
