export interface MarkerInfo {
  text: string;
  color: string;
  title: string;
}

export interface TooltipData {
  x: number;
  y: number;
  date: string;
  ohlc?: { open: number; high: number; low: number; close: number };
  tenkan?: number;
  kijun?: number;
  senkouA?: number;
  senkouB?: number;
  chikou?: number;
  markers?: MarkerInfo[];
}

interface ExplainerTooltipProps {
  data: TooltipData | null;
  containerWidth: number;
}

function formatPrice(val: number | undefined): string {
  return val !== undefined ? `$${val.toFixed(2)}` : "—";
}

export default function ExplainerTooltip({
  data,
  containerWidth,
}: ExplainerTooltipProps) {
  if (!data) return null;

  // Responsive tooltip width — narrower on small screens
  const tooltipWidth = containerWidth < 500 ? 220 : 260;
  // Position tooltip: flip to left side if near right edge
  const flipped = data.x + tooltipWidth + 20 > containerWidth;
  const left = flipped
    ? Math.max(8, data.x - tooltipWidth - 16)
    : data.x + 16;

  // Determine a quick coach hint based on crosshair position
  let hint = "";
  if (data.ohlc && data.senkouA !== undefined && data.senkouB !== undefined) {
    const cloudTop = Math.max(data.senkouA, data.senkouB);
    const cloudBottom = Math.min(data.senkouA, data.senkouB);
    if (data.ohlc.close > cloudTop) {
      hint = "Price is above the cloud — potentially bullish territory.";
    } else if (data.ohlc.close < cloudBottom) {
      hint = "Price is below the cloud — potentially bearish territory.";
    } else {
      hint = "Price is inside the cloud — the market is likely undecided.";
    }
  }

  return (
    <div
      className="pointer-events-none absolute z-10 rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-sm"
      style={{
        left: `${left}px`,
        top: "12px",
        width: `${tooltipWidth}px`,
      }}
    >
      <p className="text-xs font-medium text-slate-300 mb-2">{data.date}</p>

      {data.ohlc && (
        <div className="grid grid-cols-4 gap-1 mb-2 text-xs">
          <div>
            <span className="text-slate-500">O </span>
            <span className="text-slate-200">{formatPrice(data.ohlc.open)}</span>
          </div>
          <div>
            <span className="text-slate-500">H </span>
            <span className="text-slate-200">{formatPrice(data.ohlc.high)}</span>
          </div>
          <div>
            <span className="text-slate-500">L </span>
            <span className="text-slate-200">{formatPrice(data.ohlc.low)}</span>
          </div>
          <div>
            <span className="text-slate-500">C </span>
            <span
              className={
                data.ohlc.close >= data.ohlc.open
                  ? "text-emerald-400"
                  : "text-rose-400"
              }
            >
              {formatPrice(data.ohlc.close)}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-1 text-xs border-t border-slate-800 pt-2">
        {data.tenkan !== undefined && (
          <div className="flex justify-between">
            <span className="text-sky-400">Quick Pulse</span>
            <span className="text-slate-200">{formatPrice(data.tenkan)}</span>
          </div>
        )}
        {data.kijun !== undefined && (
          <div className="flex justify-between">
            <span className="text-orange-400">Backbone</span>
            <span className="text-slate-200">{formatPrice(data.kijun)}</span>
          </div>
        )}
        {data.senkouA !== undefined && (
          <div className="flex justify-between">
            <span className="text-emerald-400">Cloud Top Edge</span>
            <span className="text-slate-200">{formatPrice(data.senkouA)}</span>
          </div>
        )}
        {data.senkouB !== undefined && (
          <div className="flex justify-between">
            <span className="text-rose-400">Cloud Bottom Edge</span>
            <span className="text-slate-200">{formatPrice(data.senkouB)}</span>
          </div>
        )}
        {data.chikou !== undefined && (
          <div className="flex justify-between">
            <span className="text-violet-400">Rearview</span>
            <span className="text-slate-200">{formatPrice(data.chikou)}</span>
          </div>
        )}
      </div>

      {data.markers && data.markers.length > 0 && (
        <div className="mt-2 space-y-1.5 border-t border-slate-800 pt-2">
          {data.markers.map((m, i) => (
            <div key={i} className="flex items-start gap-2">
              <span
                className="mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: m.color }}
              />
              <span className="text-xs text-slate-200 leading-snug">
                {m.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {hint && (
        <p className="mt-2 text-xs text-slate-400 border-t border-slate-800 pt-2 italic">
          {hint}
        </p>
      )}
    </div>
  );
}
