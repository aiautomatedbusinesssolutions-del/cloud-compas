"use client";

import { useState } from "react";
import { ICHIMOKU_EXPLAINERS } from "@/lib/explainers";

export default function CloudLegend() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mt-4">
      <h3 className="text-sm font-semibold text-slate-100 mb-3">
        Chart Legend
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {ICHIMOKU_EXPLAINERS.map((item) => (
          <button
            key={item.id}
            onClick={() =>
              setExpandedId(expandedId === item.id ? null : item.id)
            }
            className="text-left rounded-lg border border-slate-800 p-3 transition-colors hover:border-slate-700 hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: item.colorHex }}
              />
              <span className={`text-sm font-medium ${item.color}`}>
                {item.nickname}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{item.oneLiner}</p>
            {expandedId === item.id && (
              <p className="mt-2 text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-2">
                {item.fullExplainer}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
