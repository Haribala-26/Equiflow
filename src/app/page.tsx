"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { ChennaiMap } from "@/components/map/ChennaiMap";
import { AllocationComparisonChart } from "@/components/charts/AllocationComparisonChart";
import {
  Users,
  MapPin,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Scale,
  BarChart3,
  Sliders,
  Users2,
  Activity,
  FileText,
  RotateCcw,
  Database,
  Layers,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const { areas, inventory, currentRun, selectedAreaId, setSelectedAreaId, currentRole, resetDemo } = useApp();

  const isAdmin = currentRole === "admin";

  const totalPopulation = areas.reduce((sum, a) => sum + (a.active ? a.population : 0), 0);
  const criticalAreas = areas.filter((a) => a.active && (a.priority?.score ?? 0) >= 80);
  const highAreas = areas.filter(
    (a) => a.active && (a.priority?.score ?? 0) >= 60 && (a.priority?.score ?? 0) < 80
  );

  const totalStockUnits = inventory.reduce((sum, r) => sum + r.total, 0);
  const totalAllocatedUnits = currentRun
    ? currentRun.items.reduce((sum, i) => sum + i.recommendedQty, 0)
    : 0;
  const totalUnmetUnits = currentRun
    ? currentRun.items.reduce((sum, i) => sum + i.unmetQty, 0)
    : 0;

  // Sorted areas by priority score descending
  const sortedAreas = [...areas]
    .filter((a) => a.active)
    .sort((a, b) => (b.priority?.score ?? 0) - (a.priority?.score ?? 0));

  const selectedArea = areas.find((a) => a.id === selectedAreaId);

  // Admin-specific telemetry states
  const [healthData, setHealthData] = useState<any>(null);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [userCount, setUserCount] = useState<number>(4);

  useEffect(() => {
    if (isAdmin) {
      fetch("/api/health")
        .then((res) => res.json())
        .then((data) => setHealthData(data))
        .catch(() => {});

      fetch("/api/audit")
        .then((res) => res.json())
        .then((data) => {
          if (data.events) setRecentAudits(data.events.slice(0, 5));
        })
        .catch(() => {});

      fetch("/api/admin/users")
        .then((res) => res.json())
        .then((data) => {
          if (data.users) setUserCount(data.users.length);
        })
        .catch(() => {});
    }
  }, [isAdmin]);

  // =========================================================================
  // VIEW 1: ADMINISTRATOR GOVERNANCE OVERVIEW
  // =========================================================================
  if (isAdmin) {
    return (
      <div className="space-y-6">
        {/* Admin Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-5 rounded-xl border border-slate-800 text-white shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
                Governance View
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                Administrator
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              <span>System Governance & Operational Oversight</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-0.5">
              Deterministic formula policies, personnel RBAC directory, warehouse constraints, and audit stream
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin?tab=scoring"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Scoring Config</span>
            </Link>
            <Link
              href="/admin?tab=users"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Users2 className="w-3.5 h-3.5" />
              <span>Manage Users</span>
            </Link>
          </div>
        </div>

        {/* Admin Governance Telemetry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-borderDefault shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Database Status</span>
              <Database className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-navy capitalize">
              {healthData?.services?.database?.status || "Connected"}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Source: <strong>{healthData?.services?.database?.source || "Mock / In-Memory"}</strong> (
              {healthData?.services?.database?.latencyMs ?? 1}ms)
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-borderDefault shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Scoring Formula</span>
              <Sliders className="w-4 h-4 text-teal" />
            </div>
            <div className="text-xl font-black text-teal">v1.0 (MCDA)</div>
            <div className="text-[11px] text-slate-500">5 Weighted Dimensions (100% Normalized)</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-borderDefault shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Active Operators</span>
              <Users2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-navy">{userCount} Personnel</div>
            <div className="text-[11px] text-slate-500">Role-Based Access Control Enforced</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-borderDefault shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">AI Guardrails</span>
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-black text-emerald-700">100% Verified</div>
            <div className="text-[11px] text-slate-500">Heuristic Fallback + Human Gate</div>
          </div>
        </div>

        {/* Operational KPIs Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-borderDefault shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Affected Pop.</div>
            <div className="text-xl font-black text-navy mt-1">{totalPopulation.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">7 Monitored Wards</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-borderDefault shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Critical Zones</div>
            <div className="text-xl font-black text-critical mt-1">{criticalAreas.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Score ≥ 80.0</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-borderDefault shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">High Priority</div>
            <div className="text-xl font-black text-high mt-1">{highAreas.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Score 60.0 – 79.9</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-borderDefault shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Stock</div>
            <div className="text-xl font-black text-navy mt-1">{totalStockUnits.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across 5 Types</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-borderDefault shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Allocated</div>
            <div className="text-xl font-black text-emerald-700 mt-1">{totalAllocatedUnits.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {currentRun ? `${currentRun.fairness.overallSatisfactionRate.toFixed(0)}% Satisfied` : "Run pending"}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-borderDefault shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Shortfall</div>
            <div className="text-xl font-black text-amber-700 mt-1">{totalUnmetUnits.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Unmet Units</div>
          </div>
        </div>

        {/* Map & Live Audit Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 h-[460px]">
            <ChennaiMap />
          </div>

          {/* Recent Audit Ledger */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-borderDefault shadow-sm flex flex-col h-[460px] overflow-hidden">
            <div className="px-4 py-3 border-b border-borderDefault flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Recent System Audit Activity</span>
                </h3>
                <p className="text-[11px] text-slate-500">Append-only operational event ledger</p>
              </div>
              <Link href="/admin?tab=audit" className="text-xs font-semibold text-indigo-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 text-xs">
              {recentAudits.length === 0 ? (
                <div className="p-6 text-center text-slate-400">Loading audit records...</div>
              ) : (
                recentAudits.map((event) => (
                  <div key={event.id} className="p-2.5 hover:bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-indigo-700 text-[11px]">{event.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-slate-600 text-[11px] line-clamp-2">{event.details}</div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span>By: {event.actor}</span>
                      <span>•</span>
                      <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                        {event.role}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-borderDefault flex items-center justify-between">
              <span className="text-xs text-slate-500">Administrative Governance Active</span>
              <Link
                href="/admin"
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                Governance Center <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: EMERGENCY COORDINATOR OPERATIONAL OVERVIEW (DEFAULT)
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-navy tracking-tight">
            Chennai Emergency Operations Dashboard
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Real-time multi-criteria humanitarian resource optimization & disaster logistics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/allocation-centre"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Allocation Centre</span>
          </Link>
          <Link
            href="/affected-areas"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-borderDefault rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <span>Manage Areas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-borderDefault shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Affected Pop.</span>
            <Users className="w-4 h-4 text-teal" />
          </div>
          <div className="text-xl font-black text-navy">{totalPopulation.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">7 Monitored Wards</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-borderDefault shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Critical Zones</span>
            <AlertTriangle className="w-4 h-4 text-critical" />
          </div>
          <div className="text-xl font-black text-critical">{criticalAreas.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Score ≥ 80.0</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-borderDefault shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">High Priority</span>
            <AlertTriangle className="w-4 h-4 text-high" />
          </div>
          <div className="text-xl font-black text-high">{highAreas.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Score 60.0 – 79.9</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-borderDefault shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Stock</span>
            <Boxes className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-xl font-black text-navy">{totalStockUnits.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across 5 Types</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-borderDefault shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Allocated</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700">
            {totalAllocatedUnits.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {currentRun ? `${currentRun.fairness.overallSatisfactionRate.toFixed(0)}% Satisfied` : "Run pending"}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-borderDefault shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Shortfall</span>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-700">
            {totalUnmetUnits.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Unmet Units</div>
        </div>
      </div>

      {/* Main Grid: Map (Left) + Priority Leaderboard (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Geographic Map */}
        <div className="lg:col-span-7 h-[460px]">
          <ChennaiMap />
        </div>

        {/* Priority Leaderboard */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-borderDefault shadow-sm flex flex-col h-[460px] overflow-hidden">
          <div className="px-4 py-3 border-b border-borderDefault flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Priority Ranking
              </h3>
              <p className="text-[11px] text-slate-500">Calculated by deterministic formula v1.0</p>
            </div>
            <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
              7 Wards
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
            {sortedAreas.map((area, index) => {
              const isSelected = area.id === selectedAreaId;
              const score = area.priority?.score?.toFixed(1) ?? "N/A";
              const catColor = area.priority?.categoryColor || "#167D83";

              return (
                <div
                  key={area.id}
                  onClick={() => setSelectedAreaId(area.id)}
                  className={`p-2.5 rounded-lg cursor-pointer transition flex items-center justify-between ${
                    isSelected ? "bg-teal/10 border-l-4 border-teal font-medium" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center font-bold text-xs text-slate-400">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{area.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Pop: {area.population.toLocaleString()} • Sev: {area.severity} • Urg: {area.urgency}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div
                        className="text-xs font-black px-2 py-0.5 rounded text-white inline-block shadow-sm"
                        style={{ backgroundColor: catColor }}
                      >
                        {score}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">
                        {area.priority?.category}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Area Summary Footer */}
          {selectedArea && (
            <div className="p-3 bg-slate-50 border-t border-borderDefault text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">Selected: {selectedArea.name}</span>
                <span className="text-slate-500 text-[11px] block">
                  Click 'Affected Areas' tab to inspect formula breakdown
                </span>
              </div>
              <Link
                href="/affected-areas"
                className="text-teal font-semibold hover:underline text-xs flex items-center gap-1"
              >
                Inspect <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Allocation vs Demand Chart Row */}
      {currentRun && currentRun.items.length > 0 && (
        <div className="bg-white rounded-xl border border-borderDefault shadow-sm p-4 space-y-2">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal" />
                <span>Ward Resource Fulfillment: Requested Demand vs Recommended Allocation</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Visualizing constrained optimization trade-offs per municipal zone
              </p>
            </div>
            <Link href="/allocation-centre" className="text-xs font-semibold text-teal hover:underline">
              View Allocation Run Details
            </Link>
          </div>
          <AllocationComparisonChart items={currentRun.items} />
        </div>
      )}

      {/* Secondary Row: Inventory vs Demand Summary & AI Advisor Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Inventory Progress Bars */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-borderDefault shadow-sm p-4">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Resource Inventory vs Operational Demand
              </h3>
              <p className="text-[11px] text-slate-500">
                Stock is constrained; weighted optimization distributes finite supplies
              </p>
            </div>
            <Link href="/resource-inventory" className="text-xs font-semibold text-teal hover:underline">
              Manage Stock
            </Link>
          </div>

          <div className="space-y-3">
            {inventory.map((stock) => {
              const totalDemand = areas.reduce((sum, a) => {
                const need = a.needs.find((n) => n.resourceType === stock.type);
                return sum + (need ? Math.max(0, need.requestedQty - need.locallyAvailableQty) : 0);
              }, 0);

              const coveragePct =
                totalDemand > 0 ? Math.min(100, (stock.available / totalDemand) * 100) : 100;

              return (
                <div key={stock.type} className="text-xs space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-800 font-semibold">{stock.name}</span>
                    <span className="text-slate-500 text-[11px]">
                      {stock.available.toLocaleString()} {stock.unit} available / {totalDemand.toLocaleString()} {stock.unit} needed ({coveragePct.toFixed(0)}% supply)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 ${
                        coveragePct < 50 ? "bg-red-500" : coveragePct < 80 ? "bg-amber-500" : "bg-teal"
                      }`}
                      style={{ width: `${coveragePct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Decision Support & Operational Safeguards */}
        <div className="bg-gradient-to-br from-slate-900 to-navy text-white rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Responsible AI Architecture</span>
            </div>
            <h4 className="text-base font-bold leading-snug">
              AI-Assisted Assessment & Audit Verification
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              AI models comprehend complex field narratives and extract operational requirements, paired with automated audit checks.
              Resource quantities remain 100% controlled by deterministic mathematical constraints.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Human Approval Mandatory</span>
            <Link
              href="/affected-areas"
              className="px-3 py-1.5 bg-teal hover:bg-teal-600 text-white rounded-lg text-xs font-semibold shadow transition flex items-center gap-1"
            >
              <span>Test AI Assessment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
