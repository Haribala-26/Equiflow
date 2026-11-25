"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  FlaskConical,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Sliders,
  Check,
  ShieldAlert,
} from "lucide-react";
import { SimulationResult } from "@/domain/simulation/engine";

export default function SimulationsPage() {
  const { areas, inventory, currentRole, refreshData } = useApp();

  // Scenario Override State
  const [supplyReductionPct, setSupplyReductionPct] = useState<number>(20); // 20% drop
  const [targetResource, setTargetResource] = useState<string>("water");
  const [popSurgePct, setPopSurgePct] = useState<number>(15); // 15% surge
  const [criticalWardId, setCriticalWardId] = useState<string>("CHN-001");
  const [severitySpike, setSeveritySpike] = useState<number>(2); // +2 severity

  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Apply to baseline modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyReason, setApplyReason] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  const handleRunSimulation = async () => {
    try {
      setIsRunning(true);
      setErrorMsg("");

      // Calculate new available stock for target resource
      const targetStock = inventory.find((r) => r.type === targetResource);
      const newAvail = targetStock
        ? Math.max(0, Math.round(targetStock.available * (1 - supplyReductionPct / 100)))
        : undefined;

      // Target area surge
      const targetArea = areas.find((a) => a.id === criticalWardId);
      const newPop = targetArea
        ? Math.round(targetArea.population * (1 + popSurgePct / 100))
        : undefined;
      const newSev = targetArea
        ? Math.min(5, targetArea.severity + severitySpike)
        : undefined;

      const res = await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryUpdates: targetStock ? { [targetResource]: newAvail } : undefined,
          areaUpdates: targetArea
            ? [
                {
                  id: criticalWardId,
                  population: newPop,
                  severity: newSev,
                },
              ]
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Simulation execution failed");
      }

      setSimulationResult(data.simulation);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleApplyToBaseline = async () => {
    if (!simulationResult || !applyReason.trim()) return;

    try {
      setIsApplying(true);
      // Apply area updates
      const targetStock = inventory.find((r) => r.type === targetResource);
      const newAvail = targetStock
        ? Math.max(0, Math.round(targetStock.available * (1 - supplyReductionPct / 100)))
        : undefined;

      if (targetStock && newAvail !== undefined) {
        await fetch("/api/inventory", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resourceType: targetResource,
            updates: { total: newAvail + targetStock.reserved },
            reason: `Simulation Applied: ${applyReason}`,
          }),
        });
      }

      const targetArea = areas.find((a) => a.id === criticalWardId);
      if (targetArea) {
        const newPop = Math.round(targetArea.population * (1 + popSurgePct / 100));
        const newSev = Math.min(5, targetArea.severity + severitySpike);
        await fetch(`/api/areas/${criticalWardId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            population: newPop,
            severity: newSev,
            reason: `Simulation Scenario Applied: ${applyReason}`,
          }),
        });
      }

      setApplySuccess(true);
      await refreshData();
      setTimeout(() => {
        setApplySuccess(false);
        setShowApplyModal(false);
        setSimulationResult(null);
      }, 2000);
    } catch (err: any) {
      alert(`Failed to apply scenario: ${err.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-navy tracking-tight flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-teal" />
            <span>What-If Scenario Simulation Engine</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Test policy shocks, severe supply chain disruptions, and population displacements without modifying baseline data.
          </p>
        </div>
      </div>

      {/* Scenario Parameters Controls */}
      <div className="bg-white rounded-xl border border-borderDefault shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-bold text-navy flex items-center gap-2 border-b pb-3">
          <Sliders className="w-4 h-4 text-teal" />
          <span>Stress-Test Parameters & Scenario Overrides</span>
        </h2>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Shock 1: Supply Chain Shock */}
          <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>1. Supply Chain Disruption</span>
              <span className="text-critical font-black">-{supplyReductionPct}%</span>
            </div>
            <div>
              <label className="text-slate-600 block mb-1">Target Disrupted Resource:</label>
              <select
                value={targetResource}
                onChange={(e) => setTargetResource(e.target.value)}
                className="w-full p-2 bg-white border rounded font-semibold text-slate-800"
              >
                <option value="water">Clean Drinking Water</option>
                <option value="food">Ration Food Packs</option>
                <option value="medical">First-Aid Medical Kits</option>
                <option value="shelter">Emergency Tarpaulins</option>
                <option value="hygiene">Sanitation Kits</option>
              </select>
            </div>
            <div>
              <label className="text-slate-600 block mb-1">Reduction Percentage:</label>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={supplyReductionPct}
                onChange={(e) => setSupplyReductionPct(parseInt(e.target.value) || 0)}
                className="w-full accent-teal cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-400">Simulates flooded highway cutoffs or depot isolation.</p>
          </div>

          {/* Shock 2: Population Surge */}
          <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>2. Influx & Displacement</span>
              <span className="text-amber-700 font-black">+{popSurgePct}%</span>
            </div>
            <div>
              <label className="text-slate-600 block mb-1">Impacted Ward Sector:</label>
              <select
                value={criticalWardId}
                onChange={(e) => setCriticalWardId(e.target.value)}
                className="w-full p-2 bg-white border rounded font-semibold text-slate-800"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-600 block mb-1">Displaced Population Surge:</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={popSurgePct}
                onChange={(e) => setPopSurgePct(parseInt(e.target.value) || 0)}
                className="w-full accent-teal cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-400">Models evacuees arriving from submerged peri-urban zones.</p>
          </div>

          {/* Shock 3: Severity Escalation */}
          <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>3. Damage Escalation</span>
              <span className="text-critical font-black">+{severitySpike} Level</span>
            </div>
            <div>
              <label className="text-slate-600 block mb-1">Severity Rating Spike (1–5 scale):</label>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={severitySpike}
                onChange={(e) => setSeveritySpike(parseInt(e.target.value) || 0)}
                className="w-full accent-teal cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-400">Simulates embankment breaches or rapid lake inundation.</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-3 border-t">
          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="px-6 py-2.5 bg-teal hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-sm transition flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isRunning ? "Simulating Constraints..." : "Run Scenario Simulation"}</span>
          </button>
        </div>
      </div>

      {/* Simulation Results Display */}
      {simulationResult && (
        <div className="space-y-6">
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Baseline Satisfaction</span>
              <div className="text-2xl font-black text-navy mt-1">
                {simulationResult.baselineRun.fairness.overallSatisfactionRate.toFixed(1)}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Under standard inventory conditions</p>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Scenario Satisfaction</span>
              <div className="text-2xl font-black text-indigo-700 mt-1">
                {simulationResult.scenarioRun.fairness.overallSatisfactionRate.toFixed(1)}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Under simulated disruption</p>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Satisfaction Delta</span>
              <div
                className={`text-2xl font-black mt-1 flex items-center gap-1.5 ${
                  simulationResult.deltas.overallSatisfactionDelta < 0 ? "text-critical" : "text-emerald-700"
                }`}
              >
                {simulationResult.deltas.overallSatisfactionDelta < 0 ? (
                  <TrendingDown className="w-5 h-5" />
                ) : (
                  <TrendingUp className="w-5 h-5" />
                )}
                <span>{simulationResult.deltas.overallSatisfactionDelta.toFixed(1)}%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Net system fulfillment variance</p>
            </div>
          </div>

          {/* Allocation Changes Table */}
          <div className="bg-white rounded-xl border border-borderDefault shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-2">
              <div>
                <h3 className="text-sm font-bold text-navy">
                  Simulated Resource Dispatch Adjustments by Municipal Ward
                </h3>
                <p className="text-xs text-slate-500">
                  Detailed reallocation breakdown comparing baseline recommended quantities against simulated shock
                </p>
              </div>

              <button
                onClick={() => setShowApplyModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-sm transition flex items-center gap-1.5"
              >
                <span>Apply Scenario to Baseline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b">
                  <tr>
                    <th className="p-3 font-semibold">Ward Sector</th>
                    <th className="p-3 font-semibold">Resource</th>
                    <th className="p-3 font-semibold text-right">Baseline Allocation</th>
                    <th className="p-3 font-semibold text-right">Scenario Allocation</th>
                    <th className="p-3 font-semibold text-right">Variance / Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {simulationResult.deltas.areaChanges.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        No allocation deltas observed across municipal zones.
                      </td>
                    </tr>
                  ) : (
                    simulationResult.deltas.areaChanges.map((change, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{change.areaName}</td>
                        <td className="p-3 font-mono capitalize">{change.resourceType}</td>
                        <td className="p-3 text-right font-mono">{change.baselineQty.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-bold text-navy">
                          {change.scenarioQty.toLocaleString()}
                        </td>
                        <td
                          className={`p-3 text-right font-mono font-bold ${
                            change.difference < 0 ? "text-critical" : "text-emerald-700"
                          }`}
                        >
                          {change.difference > 0 ? `+${change.difference}` : change.difference}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Apply to Baseline Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-700 border-b pb-3">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-base text-navy">Apply Scenario to Live Baseline</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Applying this scenario will overwrite the live operational inventory and ward disaster severity parameters. An immutable audit record will be generated.
            </p>

            {applySuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Scenario successfully committed to live operational state!</span>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <label className="font-bold text-slate-700 block">
                  Mandatory Operational Justification <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Formalizing flood surge telemetry for Madipakkam sector"
                  value={applyReason}
                  onChange={(e) => setApplyReason(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-xs"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyToBaseline}
                disabled={isApplying || !applyReason.trim() || applySuccess}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                {isApplying ? "Committing..." : "Confirm & Apply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
