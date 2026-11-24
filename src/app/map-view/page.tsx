"use client";

import React from "react";
import { ChennaiMap } from "@/components/map/ChennaiMap";
import { useApp } from "@/context/AppContext";
import { MapPin, Navigation, Info } from "lucide-react";

export default function MapViewPage() {
  const { areas, selectedAreaId, setSelectedAreaId, currentCity } = useApp();
  const selectedArea = areas.find((a) => a.id === selectedAreaId);

  return (
    <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-navy tracking-tight flex items-center gap-2">
            <Navigation className="w-5 h-5 text-teal" />
            <span>Interactive {currentCity} Geographic Map</span>
          </h1>
          <p className="text-xs text-slate-500">
            Real OpenStreetMap basemap with synchronized priority color markers and instant focus fly-to
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Map Full Frame */}
        <div className="lg:col-span-9 h-full min-h-[420px]">
          <ChennaiMap />
        </div>

        {/* Selected Zone Quick Inspector */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-borderDefault shadow-sm p-4 overflow-y-auto space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Ward Inspector
            </h3>
            <span className="text-[11px] text-slate-400">Click any map marker to focus</span>
          </div>

          {selectedArea ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-base text-slate-900">{selectedArea.name}</span>
                <span
                  className="px-2 py-0.5 rounded text-white text-xs font-black shadow-sm"
                  style={{ backgroundColor: selectedArea.priority?.categoryColor }}
                >
                  {selectedArea.priority?.score?.toFixed(1)}
                </span>
              </div>

              <div className="space-y-1 text-slate-600 bg-slate-50 p-2.5 rounded border">
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="font-bold uppercase text-slate-800">
                    {selectedArea.priority?.category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Coordinates:</span>
                  <span className="font-mono text-slate-800">
                    {selectedArea.latitude.toFixed(4)}, {selectedArea.longitude.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Population:</span>
                  <span className="font-bold text-slate-800">
                    {selectedArea.population.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Severity / Urgency:</span>
                  <span className="font-bold text-slate-800">
                    {selectedArea.severity} / {selectedArea.urgency}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-1">Resource Demands:</h4>
                <div className="space-y-1">
                  {selectedArea.needs.map((n) => (
                    <div key={n.resourceType} className="flex justify-between bg-slate-50 p-1.5 rounded border">
                      <span className="capitalize">{n.resourceType}:</span>
                      <span className="font-bold">{n.requestedQty} {n.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Info className="w-8 h-8 text-slate-300" />
              <span>Select any marker on the map to inspect its real-time telemetry.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
