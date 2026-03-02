"use client";

import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  currentTicker: string;
  isDemo: boolean;
  onSearch: (ticker: string) => void;
}

const COOLDOWN_MS = 2000;

export default function SearchBar({
  currentTicker,
  isDemo,
  onSearch,
}: SearchBarProps) {
  const [input, setInput] = useState("");
  const [cooldown, setCooldown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !cooldown) {
      onSearch(input.trim());
      setInput("");
      setCooldown(true);
      timerRef.current = setTimeout(() => setCooldown(false), COOLDOWN_MS);
    }
  };

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter ticker (e.g. AAPL)"
          disabled={cooldown}
          className="w-44 sm:w-48 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 focus:bg-slate-900/80 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={cooldown}
          className="rounded-lg bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-400 transition-all duration-200 hover:bg-sky-500/30 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cooldown ? "Wait..." : "Search"}
        </button>
      </form>
      <span className="inline-flex items-center gap-2 rounded-lg bg-sky-500/10 px-3 py-1.5 text-sm text-sky-400 transition-colors duration-300">
        Viewing: {currentTicker}
        {isDemo && (
          <span className="text-xs text-slate-500">(Demo Data)</span>
        )}
      </span>
    </div>
  );
}
