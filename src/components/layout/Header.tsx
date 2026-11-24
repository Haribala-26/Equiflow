"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { UserRole } from "@/domain/types";
import {
  RotateCcw,
  Sparkles,
  MapPin,
  ShieldAlert,
  UserCheck,
  Building2,
} from "lucide-react";

export function Header() {
  const { currentRole, setCurrentRole, currentCity, resetDemo, isLoading } = useApp();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const roles: { id: UserRole; label: string }[] = [
    { id: "coordinator", label: "Emergency Coordinator" },
  ];

  return (
    <header className="bg-navy text-white border-b border-navy/20 sticky top-0 z-40">
      {/* Top Banner - Demo Mode Alert */}
      <div className="bg-amber-500 text-slate-950 px-4 py-1 text-xs font-semibold flex items-center justify-between tracking-wide">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-950" />
          <span>DEMO MODE — SIMULATED EMERGENCY DATA</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[11px] font-medium opacity-90">
          <span>Responsible AI Framework Active</span>
          <span>•</span>
          <span>Deterministic Priority Core</span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center font-black text-white text-lg shadow-sm">
              E
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight">EQUIFLOW</span>
                <span className="text-[10px] bg-teal/30 text-teal-200 border border-teal/40 px-1.5 py-0.5 rounded font-mono">
                  v1.0
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                <MapPin className="w-3 h-3 text-teal-400" />
                <span>{currentCity}, Tamil Nadu, India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & Indicators */}
        <div className="flex items-center gap-2.5">
          {/* AI Status Pill */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 border border-emerald-500/40 px-2.5 py-1 rounded-full text-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-medium text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              AI Decision Engine Active
            </span>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-2 py-1 rounded-lg text-xs">
            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as UserRole)}
              className="bg-transparent text-white text-xs outline-none cursor-pointer pr-1"
              aria-label="Select User Role"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium transition"
            title="Reset to initial pristine Chennai flood dataset"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Demo Reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              Reset Demo Dataset?
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              This will restore the 7 Chennai areas, initial resource inventories (Food: 8,000, Water: 30,000L, Medical: 1,200),
              and reset all pending allocation runs.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowResetConfirm(false);
                  await resetDemo();
                }}
                className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow transition"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
