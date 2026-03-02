"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  LineStyle,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
} from "lightweight-charts";
import { CandleData, IchimokuData } from "@/types/stock";
import { type ChartMarker } from "@/lib/annotations";
import ExplainerTooltip, {
  type TooltipData,
} from "@/components/ui/ExplainerTooltip";

interface IchimokuChartProps {
  candles: CandleData[];
  ichimoku: IchimokuData;
  markers?: ChartMarker[];
}

function getSeriesValue(
  param: { seriesData: Map<ISeriesApi<SeriesType>, unknown> },
  series: ISeriesApi<SeriesType>
): number | undefined {
  const data = param.seriesData.get(series);
  if (!data) return undefined;
  const d = data as Record<string, unknown>;
  // Candlestick data has "close", line/area data has "value"
  if ("close" in d && typeof d.close === "number") return d.close;
  if ("value" in d && typeof d.value === "number") return d.value;
  return undefined;
}

function getCandleOHLC(
  param: { seriesData: Map<ISeriesApi<SeriesType>, unknown> },
  series: ISeriesApi<SeriesType>
): { open: number; high: number; low: number; close: number } | undefined {
  const data = param.seriesData.get(series);
  if (!data) return undefined;
  const d = data as Record<string, unknown>;
  if (
    typeof d.open === "number" &&
    typeof d.high === "number" &&
    typeof d.low === "number" &&
    typeof d.close === "number"
  ) {
    return { open: d.open, high: d.high, low: d.low, close: d.close };
  }
  return undefined;
}

export default function IchimokuChart({
  candles,
  ichimoku,
  markers = [],
}: IchimokuChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<{
    candle: ISeriesApi<SeriesType>;
    tenkan: ISeriesApi<SeriesType>;
    kijun: ISeriesApi<SeriesType>;
    spanA: ISeriesApi<SeriesType>;
    spanB: ISeriesApi<SeriesType>;
    chikou: ISeriesApi<SeriesType>;
  } | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Build a lookup map: date → marker info for the tooltip
  const markersByDate = useMemo(() => {
    const map = new Map<string, { text: string; color: string; title: string }[]>();
    for (const m of markers) {
      const key = String(m.time);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ text: m.text, color: m.color, title: m.title });
    }
    return map;
  }, [markers]);

  const handleCrosshairMove = useCallback(
    (param: { time?: unknown; point?: { x: number; y: number }; seriesData: Map<ISeriesApi<SeriesType>, unknown> }) => {
      if (
        !param.time ||
        !param.point ||
        param.point.x < 0 ||
        param.point.y < 0 ||
        !seriesRef.current
      ) {
        setTooltip(null);
        return;
      }

      const dateStr = String(param.time);
      const s = seriesRef.current;
      setTooltip({
        x: param.point.x,
        y: param.point.y,
        date: dateStr,
        ohlc: getCandleOHLC(param, s.candle),
        tenkan: getSeriesValue(param, s.tenkan),
        kijun: getSeriesValue(param, s.kijun),
        senkouA: getSeriesValue(param, s.spanA),
        senkouB: getSeriesValue(param, s.spanB),
        chikou: getSeriesValue(param, s.chikou),
        markers: markersByDate.get(dateStr),
      });
    },
    [markersByDate]
  );

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
        fontFamily: "Inter, sans-serif",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      width: containerRef.current.clientWidth,
      height: window.innerWidth < 640 ? 350 : 500,
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#334155" },
      timeScale: {
        borderColor: "#334155",
        timeVisible: false,
        barSpacing: window.innerWidth < 640 ? 3 : 5,
        rightOffset: 30,
      },
      handleScroll: { vertTouchDrag: false },
    });

    chartRef.current = chart;

    // Cloud (Kumo)
    const spanASeries = chart.addSeries(AreaSeries, {
      topColor: "rgba(52, 211, 153, 0.15)",
      bottomColor: "rgba(52, 211, 153, 0.02)",
      lineColor: "rgba(52, 211, 153, 0.4)",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    spanASeries.setData(
      ichimoku.senkouA.map((p) => ({ time: p.time, value: p.value }))
    );

    const spanBSeries = chart.addSeries(AreaSeries, {
      topColor: "rgba(251, 113, 133, 0.15)",
      bottomColor: "rgba(251, 113, 133, 0.02)",
      lineColor: "rgba(251, 113, 133, 0.4)",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    spanBSeries.setData(
      ichimoku.senkouB.map((p) => ({ time: p.time, value: p.value }))
    );

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#34d399",
      downColor: "#fb7185",
      borderUpColor: "#34d399",
      borderDownColor: "#fb7185",
      wickUpColor: "#34d399",
      wickDownColor: "#fb7185",
    });
    candleSeries.setData(
      candles.map((c) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    // Chart annotations (TK crosses, breakouts, alignments)
    if (markers.length > 0) {
      createSeriesMarkers(candleSeries, markers);
    }

    // Tenkan-sen (sky-400)
    const tenkanSeries = chart.addSeries(LineSeries, {
      color: "#38bdf8",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    tenkanSeries.setData(
      ichimoku.tenkan.map((p) => ({ time: p.time, value: p.value }))
    );

    // Kijun-sen (orange-400)
    const kijunSeries = chart.addSeries(LineSeries, {
      color: "#fb923c",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    kijunSeries.setData(
      ichimoku.kijun.map((p) => ({ time: p.time, value: p.value }))
    );

    // Chikou Span (violet-400, dashed)
    const chikouSeries = chart.addSeries(LineSeries, {
      color: "#a78bfa",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    chikouSeries.setData(
      ichimoku.chikou.map((p) => ({ time: p.time, value: p.value }))
    );

    // Store series refs for crosshair tooltip
    seriesRef.current = {
      candle: candleSeries as unknown as ISeriesApi<SeriesType>,
      tenkan: tenkanSeries as unknown as ISeriesApi<SeriesType>,
      kijun: kijunSeries as unknown as ISeriesApi<SeriesType>,
      spanA: spanASeries as unknown as ISeriesApi<SeriesType>,
      spanB: spanBSeries as unknown as ISeriesApi<SeriesType>,
      chikou: chikouSeries as unknown as ISeriesApi<SeriesType>,
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);

    // Fit all data including Senkou Span future projection
    chart.timeScale().fitContent();
    // Then scroll to show the last ~120 bars + cloud projection for readability
    const totalBars = Math.max(
      candles.length,
      ichimoku.senkouA.length,
      ichimoku.senkouB.length
    );
    const visibleBars = window.innerWidth < 640 ? 80 : 150;
    if (totalBars > visibleBars) {
      chart.timeScale().setVisibleLogicalRange({
        from: totalBars - visibleBars,
        to: totalBars + 5,
      });
    }

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [candles, ichimoku, markers, handleCrosshairMove]);

  return (
    <div
      ref={wrapperRef}
      className="relative bg-slate-900 border border-slate-800 rounded-xl p-4"
    >
      <ExplainerTooltip
        data={tooltip}
        containerWidth={wrapperRef.current?.clientWidth ?? 800}
      />
      <div ref={containerRef} />
    </div>
  );
}
