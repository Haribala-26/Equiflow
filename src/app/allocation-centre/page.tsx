"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Scale,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  ShieldCheck,
  Loader2,
  FileCheck2,
  Clock,
} from "lucide-react";

export default function AllocationCentrePage() {
  const { currentRun, refreshData, currentRole } = useApp();
  const [isComputing, setIsComputing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [egmAudit, setEgmAudit] = useState<any>(null);

  const handleComputeRun = async () => {
    try {
      setIsComputing(true);
      const res = await fetch("/api/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: "Coordinator Raman" }),
      });

      if (res.ok) {
        const data = await res.json();
        setEgmAudit(data.egmAudit);
        await refreshData();
      }
    } catch (err) {
      console.error("Failed to compute allocation:", err);
    } finally {
      setIsComputing(false);
    }
  };

  const handleApprove = async () => {
    if (!currentRun) return;

    try {
      setIsApproving(true);
      await fetch(`/api/allocations/${currentRun.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: "Coordinator Raman" }),
      });
      await refreshData();
    } catch (err) {
      console.error("Failed to approve allocation:", err);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!currentRun || !rejectReason.trim()) return;

    try {
      setIsApproving(true);
      await fetch(`/api/allocations/${currentRun.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: "Coordinator Raman", reason: rejectReason }),
      });
      setShowRejectModal(false);
      await refreshData();
    } catch (err) {
      console.error("Failed to reject allocation:", err);
    } finally {
      setIsApproving(false);
    }
  };

  const filteredItems = currentRun
    ? currentRun.items.filter(
        (item) => resourceFilter === "all" || item.resourceType === resourceFilter
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-navy tracking-tight">
            Allocation Centre & Dispatch Authorization
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Constrained multi-resource optimization with mandatory human-in-the-loop sign-off
          </p>
        </div>

        <button
          onClick={handleComputeRun}
          disabled={isComputing}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow transition"
        >
          {isComputing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Optimizing Allocations...</span>
            </>
          ) : (
            <>
              <Scale className="w-4 h-4" />
              <span>Compute New Allocation Run</span>
            </>
          )}
        </button>
      </div>

      {currentRun ? (
        <div className="space-y-6">
          {/* Status & Approvals Action Bar */}
          <div className="bg-white p-4 rounded-xl border border-borderDefault shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  currentRun.status === "approved"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : currentRun.status === "rejected"
                    ? "bg-red-100 text-red-800 border border-red-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}
              >
                {currentRun.status === "approved" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : currentRun.status === "rejected" ? (
                  <XCircle className="w-4 h-4 text-red-600" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                )}
                <span>Status: {currentRun.status.replace("_", " ")}</span>
              </span>

              <div className="text-xs text-slate-500">
                Run ID: <span className="font-mono font-bold text-slate-700">{currentRun.id}</span>
                {currentRun.approvedBy && (
                  <span className="ml-2 font-medium">Approved by {currentRun.approvedBy}</span>
                )}
              </div>
            </div>

            {/* Authorization Action Buttons */}
            {currentRun.status === "pending_approval" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isApproving}
                  className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
                >
                  Reject Run
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Authorize & Deduct Inventory</span>
                </button>
              </div>
            )}
          </div>

          {/* Fairness Evaluation Metrics Panel */}
          <div className="bg-white p-4 rounded-xl border border-borderDefault shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Fairness & Humanitarian Equity Evaluation</span>
              <span className="text-[11px] font-mono text-slate-400">Section A7 Benchmark</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-50 p-3 rounded-lg border">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Need Satisfied</div>
                <div className="text-2xl font-black text-navy mt-0.5">
                  {currentRun.fairness.overallSatisfactionRate.toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500">Across All 5 Resources</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border">
                <div className="text-[10px] uppercase font-bold text-slate-400">Critical Areas Covered</div>
                <div className="text-2xl font-black text-critical mt-0.5">
                  {currentRun.fairness.criticalCoverageRate.toFixed(0)}%
                </div>
                <div className="text-[10px] text-slate-500">
                  {currentRun.fairness.criticalAreasServedCount} of {currentRun.fairness.criticalAreasTotal} Wards
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border">
                <div className="text-[10px] uppercase font-bold text-slate-400">Floor Coverage Attained</div>
                <div className="text-2xl font-black text-teal mt-0.5">
                  {currentRun.fairness.minCoverageAchievedCount} / {currentRun.fairness.totalEligibleAreas}
                </div>
                <div className="text-[10px] text-slate-500">≥20% Minimum Baseline</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border">
                <div className="text-[10px] uppercase font-bold text-slate-400">Coverage Std Deviation</div>
                <div className="text-2xl font-black text-slate-700 mt-0.5">
                  ±{currentRun.fairness.coverageVariance.toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500">Equity Variance Index</div>
              </div>
            </div>

            {/* Resource Specific Breakdown */}
            <div className="grid grid-cols-5 gap-2 pt-2 border-t text-[11px]">
              {Object.entries(currentRun.fairness.resourceSatisfactionRate).map(([res, rate]) => (
                <div key={res} className="bg-slate-50 p-1.5 rounded text-center">
                  <span className="capitalize font-semibold text-slate-600 block">{res}</span>
                  <span className="font-black text-slate-900">{rate.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Automated Quality & Fairness Audit Card */}
          {egmAudit && egmAudit.findings?.length > 0 && (
            <div className="bg-gradient-to-r from-slate-900 to-navy text-white p-4 rounded-xl shadow space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <h4 className="font-bold text-sm">Automated Quality & Fairness Audit</h4>
                </div>
                <span className="text-[10px] bg-teal/20 text-teal-300 border border-teal/40 px-2 py-0.5 rounded font-mono">
                  Automated Review
                </span>
              </div>

              <div className="space-y-2">
                {egmAudit.findings.map((f: any, idx: number) => (
                  <div key={idx} className="bg-slate-800/80 p-2.5 rounded text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          f.severity === "critical"
                            ? "bg-red-950 text-red-300 border border-red-700"
                            : "bg-amber-950 text-amber-300 border border-amber-700"
                        }`}
                      >
                        {f.category}
                      </span>
                      <span className="font-semibold text-slate-200">{f.description}</span>
                    </div>
                    <div className="text-[11px] text-teal-300 italic">
                      Recommendation: {f.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Allocation Items Table */}
          <div className="bg-white rounded-xl border border-borderDefault shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-borderDefault flex flex-col sm:flex-row items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Recommended Allocation Items ({filteredItems.length})
              </h3>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Filter Resource:</span>
                <select
                  value={resourceFilter}
                  onChange={(e) => setResourceFilter(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded px-2 py-1 outline-none"
                >
                  <option value="all">All Resources</option>
                  <option value="food">Food Packs</option>
                  <option value="water">Drinking Water</option>
                  <option value="medical">Medical Kits</option>
                  <option value="shelter">Shelter Kits</option>
                  <option value="hygiene">Hygiene Kits</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-borderDefault text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Ward</th>
                    <th className="py-2.5 px-3">Resource</th>
                    <th className="py-2.5 px-3">Unmet Demand</th>
                    <th className="py-2.5 px-3">Floor Share</th>
                    <th className="py-2.5 px-3">Priority Share</th>
                    <th className="py-2.5 px-3 font-black text-teal">Recommended</th>
                    <th className="py-2.5 px-3 text-amber-700">Shortfall</th>
                    <th className="py-2.5 px-3">Audit Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item, idx) => (
                    <tr key={`${item.areaId}-${item.resourceType}-${idx}`} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{item.areaName}</td>
                      <td className="py-2.5 px-3 capitalize">{item.resourceType}</td>
                      <td className="py-2.5 px-3">
                        {item.eligibleDemand.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {item.floorQty.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {item.weightedQty.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 font-extrabold text-teal text-sm">
                        {item.recommendedQty.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-amber-700">
                        {item.unmetQty.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-xs truncate" title={item.rationale}>
                        {item.rationale}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <Scale className="w-10 h-10 text-teal mx-auto animate-bounce" />
          <div className="max-w-md mx-auto">
            <h3 className="font-bold text-slate-800 text-base">No Active Allocation Run</h3>
            <p className="text-xs text-slate-500 mt-1">
              Click the button below to execute the 2-phase constrained optimization algorithm across current inventory and community needs.
            </p>
          </div>
          <button
            onClick={handleComputeRun}
            disabled={isComputing}
            className="px-5 py-2.5 bg-teal hover:bg-teal-700 text-white font-bold rounded-lg text-xs shadow transition"
          >
            Compute Initial Allocation Run
          </button>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Reject Allocation Run
            </h3>
            <p className="text-xs text-slate-500">
              Per Section A15 Responsible AI requirements, all manual overrides or rejections require an explicit rationale logged in the immutable audit log.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Rejection Rationale (Mandatory)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="State operational reason for rejection..."
                className="w-full text-xs p-2.5 bg-slate-50 border rounded-lg outline-none focus:border-red-500"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded shadow"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
