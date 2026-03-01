import { IchimokuSignal } from "@/types/stock";

interface SignalCardProps {
  signal: IchimokuSignal;
}

const toneStyles = {
  bullish: {
    dot: "bg-emerald-400",
    glow: "shadow-emerald-400/40",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
  },
  bearish: {
    dot: "bg-rose-400",
    glow: "shadow-rose-400/40",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    text: "text-rose-400",
  },
  neutral: {
    dot: "bg-amber-400",
    glow: "shadow-amber-400/40",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
  },
};

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-emerald-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-label="Met">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-4 w-4 text-rose-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-label="Not met">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

export default function SignalCard({ signal }: SignalCardProps) {
  const style = toneStyles[signal.tone];

  return (
    <div
      className={`animate-fade-in rounded-xl border ${style.border} ${style.bg} p-4 mb-4 transition-colors duration-300`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className={`inline-block h-4 w-4 rounded-full ${style.dot} shadow-lg ${style.glow} animate-pulse`} />
        <h2 className={`text-lg font-semibold ${style.text}`}>
          {signal.verdict}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-stagger">
        {signal.conditions.map((cond) => (
          <div
            key={cond.label}
            className="flex items-start gap-2.5 rounded-lg bg-slate-900/50 p-2.5 transition-colors duration-200 hover:bg-slate-900/70"
          >
            <span className="mt-0.5">
              {cond.met ? <CheckIcon /> : <XIcon />}
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
