"use client";

import { useState } from "react";

interface SearchBarProps {
  currentTicker: string;
  isDemo: boolean;
  onSearch: (ticker: string) => void;
}

export default function SearchBar({
  currentTicker,
  isDemo,
  onSearch,
}: SearchBarProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input.trim());
      setInput("");
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
          className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/25 w-48"
        />
        <button
          type="submit"
          className="rounded-lg bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-400 transition-colors hover:bg-sky-500/30"
        >
          Search
        </button>
      </form>
      <span className="inline-flex items-center gap-2 rounded-lg bg-sky-500/10 px-3 py-1.5 text-sm text-sky-400">
        Viewing: {currentTicker}
        {isDemo && (
          <span className="text-xs text-slate-500">(Demo Data)</span>
        )}
      </span>
    </div>
  );
}
