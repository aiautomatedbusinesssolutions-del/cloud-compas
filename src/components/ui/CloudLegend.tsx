"use client";

import { useState } from "react";
import { ICHIMOKU_EXPLAINERS } from "@/lib/explainers";

export default function CloudLegend() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="animate-fade-in bg-slate-900 border border-slate-800 rounded-xl p-4 mt-4">
      <h3 className="text-sm font-semibold text-slate-100 mb-3">
        Chart Legend
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 animate-stagger">
        {ICHIMOKU_EXPLAINERS.map((item) => {
          const isOpen = expandedId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setExpandedId(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              className="text-left rounded-lg border border-slate-800 p-3 transition-all duration-200 hover:border-slate-700 hover:bg-slate-800/50"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.colorHex }}
                />
                <span className={`text-sm font-medium ${item.color} flex-1`}>
                  {item.nickname}
                </span>
                <svg
                  className={`h-3.5 w-3.5 text-slate-500 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <p className="mt-1 text-xs text-slate-400">{item.oneLiner}</p>
              <div
                className="expand-content"
                data-open={isOpen}
              >
                <div>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-2">
                    {item.fullExplainer}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
