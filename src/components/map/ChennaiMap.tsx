"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useApp } from "@/context/AppContext";
import { PRIORITY_CATEGORIES } from "@/domain/config";
import { ListFilter, Map as MapIcon, Table } from "lucide-react";

// Dynamic client import with SSR disabled
const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[380px] bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2 border border-borderDefault">
      <MapIcon className="w-8 h-8 animate-pulse text-teal" />
      <span className="text-xs font-medium">Loading Chennai Basemap & Geographic Markers...</span>
    </div>
  ),
});

export function ChennaiMap() {
  const { areas, selectedAreaId, setSelectedAreaId } = useApp();
  const [showTextAlt, setShowTextAlt] = useState(false);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-borderDefault shadow-sm overflow-hidden">
      {/* Map Control Header */}
      <div className="px-4 py-2.5 border-b border-borderDefault flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-teal" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Geographic Situation Map
          </h3>
          <span className="text-[11px] text-slate-500 font-normal">
            ({areas.filter((a) => a.active).length} Active Zones)
          </span>
        </div>

        <button
          onClick={() => setShowTextAlt(!showTextAlt)}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-navy px-2 py-1 rounded border border-slate-300 hover:bg-white transition"
          aria-label="Toggle Accessible Text Alternative"
        >
          <Table className="w-3.5 h-3.5" />
          <span>{showTextAlt ? "Show Map" : "Text Alternative"}</span>
        </button>
      </div>

      {/* Main View Area */}
      <div className="relative flex-1 min-h-[380px]">
        {showTextAlt ? (
          <div className="p-4 overflow-y-auto max-h-[440px] text-xs">
            <h4 className="font-bold text-slate-800 mb-2">Screen Reader Accessible Area List</h4>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-slate-100">
                  <th className="p-2">Area</th>
                  <th className="p-2">Priority Score</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Population</th>
                  <th className="p-2">Coordinates</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((area) => (
                  <tr
                    key={area.id}
                    className={`border-b hover:bg-slate-50 ${
                      area.id === selectedAreaId ? "bg-teal/5 font-semibold" : ""
                    }`}
                  >
                    <td className="p-2">{area.name}</td>
                    <td className="p-2">{area.priority?.score?.toFixed(1) ?? "N/A"}</td>
                    <td className="p-2 uppercase">{area.priority?.category ?? "N/A"}</td>
                    <td className="p-2">{area.population.toLocaleString()}</td>
                    <td className="p-2">
                      {area.latitude.toFixed(4)}, {area.longitude.toFixed(4)}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => setSelectedAreaId(area.id)}
                        className="text-teal hover:underline font-medium"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <MapInner />
        )}
      </div>

      {/* Map Legend (Color + Text Labels per WCAG 2.2 AA) */}
      <div className="px-4 py-2 border-t border-borderDefault bg-slate-50 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="font-semibold text-slate-700 text-[11px]">Priority Legend:</div>
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          {Object.values(PRIORITY_CATEGORIES).map((cat) => (
            <div key={cat.category} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: cat.color }}
              ></span>
              <span className="font-medium text-slate-700">{cat.label}</span>
              <span className="text-slate-400">({cat.minScore.toFixed(0)}-{cat.maxScore.toFixed(0)})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
