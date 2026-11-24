"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Settings, Sliders, MapPin, RotateCcw, ShieldCheck, Check } from "lucide-react";

export default function SettingsPage() {
  const { currentCity, setCurrentCity, resetDemo, currentRole } = useApp();
  const [weights, setWeights] = useState({
    severity: 0.30,
    urgency: 0.25,
    vulnerability: 0.20,
    unmetNeed: 0.15,
    populationImpact: 0.10,
  });
  const [popCap, setPopCap] = useState(50000);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetch("/api/priority/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setWeights(data.config.weights);
          setPopCap(data.config.populationCap);
        }
      });
  }, []);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleSaveWeights = async () => {
    try {
      await fetch("/api/priority/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            weights,
            populationCap: popCap,
            formulaVersion: `v1.${Date.now().toString().slice(-3)}`,
          },
          actor: "Administrator",
          reason: "Policy tuning via administrative settings",
        }),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save config:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-navy tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-teal" />
          <span>Platform Settings & Policy Configuration</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-0.5">
          Administrative scoring weight adjustments, city basemap switching, and demo resets
        </p>
      </div>

      {/* Priority Scoring Policy Config (Admin Only) */}
      <div className="bg-white rounded-xl border border-borderDefault shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Deterministic Priority Scoring Weights
            </h3>
            <p className="text-[11px] text-slate-500">
              Must sum to 1.00 (100%). Section A6 initial defaults.
            </p>
          </div>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded ${
              Math.abs(totalWeight - 1.0) < 0.001
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            Total: {(totalWeight * 100).toFixed(0)}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 flex justify-between">
              <span>Severity Weight (30%):</span>
              <span className="font-bold">{(weights.severity * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="0.6"
              step="0.05"
              value={weights.severity}
              onChange={(e) => setWeights({ ...weights, severity: parseFloat(e.target.value) })}
              className="w-full accent-teal cursor-pointer mt-1"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 flex justify-between">
              <span>Urgency Weight (25%):</span>
              <span className="font-bold">{(weights.urgency * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="0.6"
              step="0.05"
              value={weights.urgency}
              onChange={(e) => setWeights({ ...weights, urgency: parseFloat(e.target.value) })}
              className="w-full accent-teal cursor-pointer mt-1"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 flex justify-between">
              <span>Vulnerability Weight (20%):</span>
              <span className="font-bold">{(weights.vulnerability * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={weights.vulnerability}
              onChange={(e) => setWeights({ ...weights, vulnerability: parseFloat(e.target.value) })}
              className="w-full accent-teal cursor-pointer mt-1"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 flex justify-between">
              <span>Unmet Need Weight (15%):</span>
              <span className="font-bold">{(weights.unmetNeed * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="0.4"
              step="0.05"
              value={weights.unmetNeed}
              onChange={(e) => setWeights({ ...weights, unmetNeed: parseFloat(e.target.value) })}
              className="w-full accent-teal cursor-pointer mt-1"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 flex justify-between">
              <span>Population Impact Weight (10%):</span>
              <span className="font-bold">{(weights.populationImpact * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.05"
              value={weights.populationImpact}
              onChange={(e) => setWeights({ ...weights, populationImpact: parseFloat(e.target.value) })}
              className="w-full accent-teal cursor-pointer mt-1"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 flex justify-between">
              <span>Population Normalization Cap:</span>
              <span className="font-bold">{popCap.toLocaleString()}</span>
            </label>
            <input
              type="number"
              value={popCap}
              onChange={(e) => setPopCap(parseInt(e.target.value) || 50000)}
              className="w-full p-2 bg-slate-50 border rounded mt-1 font-semibold text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <button
            onClick={handleSaveWeights}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal hover:bg-teal-700 text-white font-bold rounded-lg text-xs shadow transition"
          >
            {isSaved ? <Check className="w-4 h-4" /> : null}
            <span>{isSaved ? "Weights Saved!" : "Save Policy Weights"}</span>
          </button>
        </div>
      </div>

      {/* City Switcher */}
      <div className="bg-white rounded-xl border border-borderDefault shadow-sm p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-teal" />
          <span>Active Operating City (Section A8 Requirement)</span>
        </h3>

        <div className="flex items-center gap-4 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="radio"
              name="city"
              value="Chennai"
              checked={currentCity === "Chennai"}
              onChange={(e) => setCurrentCity(e.target.value)}
              className="accent-teal"
            />
            <span>Chennai, Tamil Nadu (Default Demo City)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="radio"
              name="city"
              value="Coimbatore"
              checked={currentCity === "Coimbatore"}
              onChange={(e) => setCurrentCity(e.target.value)}
              className="accent-teal"
            />
            <span>Coimbatore, Tamil Nadu</span>
          </label>
        </div>
      </div>

      {/* Danger Zone: Full Demo Reset */}
      <div className="bg-red-50/50 rounded-xl border border-red-200 p-4 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-red-900 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-red-700" />
          <span>Pristine Demo Data Reset</span>
        </h3>
        <p className="text-xs text-red-700">
          Restores original mock requests, initial inventory, allocations, and baseline audit events.
        </p>
        <button
          onClick={resetDemo}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow transition"
        >
          Reset Demo to Baseline State
        </button>
      </div>
    </div>
  );
}
