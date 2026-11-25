"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { ResourceStock } from "@/domain/types";
import { ShortageProjectionChart } from "@/components/charts/ShortageProjectionChart";
import {
  Boxes,
  PackagePlus,
  AlertTriangle,
  TrendingDown,
  Clock,
  ShieldCheck,
  X,
  LineChart as LineChartIcon,
  Sliders,
  Lock,
  Eye,
} from "lucide-react";

export default function ResourceInventoryPage() {
  const { inventory, areas, refreshData, currentRole } = useApp();
  const isAdmin = currentRole === "admin";

  const [editingStock, setEditingStock] = useState<ResourceStock | null>(null);
  const [newTotal, setNewTotal] = useState<number>(0);
  const [newReserved, setNewReserved] = useState<number>(0);
  const [updateReason, setUpdateReason] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Consumption rate assumptions multiplier for Shortage Monitoring
  const [consumptionMultiplier, setConsumptionMultiplier] = useState<number>(1.0);

  const handleOpenEdit = (stock: ResourceStock) => {
    if (!isAdmin) return;
    setEditingStock(stock);
    setNewTotal(stock.total);
    setNewReserved(stock.reserved);
    setUpdateReason("");
  };

  const handleSaveStock = async () => {
    if (!editingStock || !isAdmin) return;

    try {
      setIsSaving(true);
      await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType: editingStock.type,
          updates: { total: newTotal, reserved: newReserved },
          actor: "Administrator",
          reason: updateReason || "Warehouse replenishment/audit",
        }),
      });

      await refreshData();
      setEditingStock(null);
    } catch (err) {
      console.error("Failed to update inventory:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-navy tracking-tight">
            Central Resource Inventory & Shortage Monitoring
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Logistical stock tracking, warehouse reservations, and shortage burn-rate projections
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isAdmin ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-300 rounded-lg text-xs font-semibold">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Read-Only Logistics Mode</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-teal/10 text-teal border border-teal/20 rounded-lg text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-teal" />
              <span>Admin Stock Control Active</span>
            </span>
          )}
        </div>
      </div>

      {/* Read-Only Notice for Coordinator */}
      {!isAdmin && (
        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Coordinator View:</strong> Central warehouse quantities and reserve buffers are in read-only mode. Use the header demo switcher to switch to Administrator if you need to adjust stock reserves.
            </span>
          </div>
        </div>
      )}

      {/* Resource Inventory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventory.map((stock) => {
          const totalDemand = areas.reduce((sum, a) => {
            const need = a.needs.find((n) => n.resourceType === stock.type);
            return sum + (need ? Math.max(0, need.requestedQty - need.locallyAvailableQty) : 0);
          }, 0);

          const burnRate = (stock.dailyConsumptionRate || 1000) * consumptionMultiplier;
          const daysRemaining = (stock.available / burnRate).toFixed(1);
          const isDeficit = stock.available < totalDemand;

          return (
            <div
              key={stock.type}
              className="bg-white rounded-xl border border-borderDefault shadow-sm p-4 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-teal" />
                    <h3 className="font-bold text-base text-slate-900">{stock.name}</h3>
                  </div>
                  <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold uppercase">
                    {stock.unit}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2.5 rounded-lg border my-3">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Stock</div>
                    <div className="text-base font-black text-navy">{stock.total.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Reserved</div>
                    <div className="text-base font-black text-amber-700">{stock.reserved.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Available</div>
                    <div className="text-base font-black text-emerald-700">{stock.available.toLocaleString()}</div>
                  </div>
                </div>

                {/* Demand Comparison */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Active Request Demand:</span>
                    <span className="font-bold text-slate-900">{totalDemand.toLocaleString()} {stock.unit}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Estimated Days Supply:</span>
                    <span className={`font-bold ${parseFloat(daysRemaining) < 3 ? "text-critical" : "text-slate-900"}`}>
                      {daysRemaining} days ({burnRate.toFixed(0)} {stock.unit}/day)
                    </span>
                  </div>
                  {isDeficit && (
                    <div className="flex items-center gap-1.5 text-critical text-[11px] font-semibold mt-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Immediate Deficit: {(totalDemand - stock.available).toLocaleString()} {stock.unit}</span>
                    </div>
                  )}
                </div>
              </div>

              {isAdmin ? (
                <button
                  onClick={() => handleOpenEdit(stock)}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <PackagePlus className="w-3.5 h-3.5 text-teal" />
                  <span>Adjust Stock or Reserves</span>
                </button>
              ) : (
                <div className="w-full py-2 bg-slate-50 text-slate-400 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Stock Modifications Locked (Admin Only)</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Module 8: Shortage Monitoring Section (Section A14) */}
      <div className="bg-white rounded-xl border border-borderDefault shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <LineChartIcon className="w-4 h-4 text-teal" />
              <span>Projected Supply Depletion & Shortage Forecast</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Transparent burn-rate calculation based on stated consumption rate assumptions (Section A14)
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-1.5 px-3 rounded-lg border text-xs">
            <span className="font-semibold text-slate-700">Consumption Rate Scale:</span>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={consumptionMultiplier}
              onChange={(e) => setConsumptionMultiplier(parseFloat(e.target.value))}
              className="w-24 accent-teal"
            />
            <span className="font-bold text-teal">{(consumptionMultiplier * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* 7-Day Stock Depletion Curve Chart */}
        <ShortageProjectionChart inventory={inventory} />

        <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Humanitarian Notice:</strong> Depletion timelines are estimates based on declared consumption assumptions.
            Urgent replenishment orders are advised for resources dipping below the 3-day buffer mark.
          </div>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {editingStock && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base text-slate-900">
                Adjust {editingStock.name} ({editingStock.unit})
              </h3>
              <button onClick={() => setEditingStock(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Total Stock ({editingStock.unit})</label>
                <input
                  type="number"
                  min="0"
                  value={newTotal}
                  onChange={(e) => setNewTotal(parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border rounded mt-1 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Reserved Units ({editingStock.unit})</label>
                <input
                  type="number"
                  min="0"
                  value={newReserved}
                  onChange={(e) => setNewReserved(parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border rounded mt-1 text-sm font-semibold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  New available stock will be: {Math.max(0, newTotal - newReserved).toLocaleString()} {editingStock.unit}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Audit Reason (Required)</label>
                <input
                  type="text"
                  placeholder="e.g. Shipment received at Koyambedu warehouse"
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setEditingStock(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStock}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold bg-teal hover:bg-teal-700 text-white rounded shadow"
              >
                {isSaving ? "Saving..." : "Commit Inventory"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
