import { IchimokuSignal } from "@/types/stock";

interface SignalCardProps {
  signal: IchimokuSignal;
}

const toneStyles = {
  bullish: {
    dot: "bg-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
  },
  bearish: {
    dot: "bg-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    text: "text-rose-400",
  },
  neutral: {
    dot: "bg-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
  },
};

export default function SignalCard({ signal }: SignalCardProps) {
  const style = toneStyles[signal.tone];

  return (
    <div
      className={`rounded-xl border ${style.border} ${style.bg} p-4 mb-4`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className={`inline-block h-4 w-4 rounded-full ${style.dot} animate-pulse`} />
        <h2 className={`text-lg font-semibold ${style.text}`}>
          {signal.verdict}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {signal.conditions.map((cond) => (
          <div
            key={cond.label}
            className="flex items-start gap-2 rounded-lg bg-slate-900/50 p-2.5"
          >
            <span className="mt-0.5 text-sm shrink-0">
              {cond.met ? (
                <span className="text-emerald-400">&#10003;</span>
              ) : (
                <span className="text-rose-400">&#10007;</span>
              )}
            </span>
            <div>
              <p className="text-sm font-medium text-slate-200">
                {cond.label}
              </p>
              <p className="text-xs text-slate-400">{cond.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
