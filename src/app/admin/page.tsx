"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { AccessRestricted } from "@/components/auth/AccessRestricted";
import {
  ShieldCheck,
  Sliders,
  Boxes,
  Users2,
  FileText,
  Activity,
  RotateCcw,
  MapPin,
  Check,
  AlertTriangle,
  History,
  CheckCircle2,
  Database,
  Layers,
  Sparkles,
} from "lucide-react";
import { PriorityConfig, ResourceStock, UserRecord } from "@/domain/types";

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "scoring";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const {
    currentRole,
    inventory,
    refreshData,
    currentCity,
    setCurrentCity,
    resetDemo,
  } = useApp();

  // Guard: if not admin, show HTTP 403 Access Restricted component
  if (currentRole !== "admin") {
    return (
      <AccessRestricted
        requiredPermission="admin"
        message="This administration section is restricted to users with the Administrator role. Switch your role using the header demo switcher to access system governance controls."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-5 rounded-xl border border-slate-800 text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
              Governance Hub
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              Role: Administrator
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span>Administrator Control Hub</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-0.5">
            System governance, scoring formula calibration, warehouse inventory thresholds, and personnel RBAC administration
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm("Reset demo data to initial factory baseline? All modifications will be reverted.")) {
                resetDemo();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-borderDefault pb-1 text-xs font-medium">
        {[
          { id: "scoring", label: "Scoring Formula", icon: Sliders },
          { id: "inventory", label: "Inventory Control", icon: Boxes },
          { id: "users", label: "Users & Roles", icon: Users2 },
          { id: "audit", label: "Full Audit Stream", icon: FileText },
          { id: "city", label: "City & Demo Controls", icon: MapPin },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition whitespace-nowrap ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-bold border-b-2 border-indigo-600"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === "scoring" && <ScoringConfigPanel onUpdate={refreshData} />}
      {activeTab === "inventory" && <InventoryControlPanel inventory={inventory} onUpdate={refreshData} />}
      {activeTab === "users" && <UsersManagementPanel />}
      {activeTab === "audit" && <FullAuditPanel />}
      {activeTab === "city" && (
        <CityAndDemoPanel
          currentCity={currentCity}
          onCityChange={setCurrentCity}
          onResetDemo={resetDemo}
        />
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Governance Hub...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}

// -------------------------------------------------------------
// TAB 1: Scoring Formula Configuration Panel
// -------------------------------------------------------------
function ScoringConfigPanel({ onUpdate }: { onUpdate: () => Promise<void> }) {
  const [config, setConfig] = useState<PriorityConfig | null>(null);
  const [history, setHistory] = useState<PriorityConfig[]>([]);
  const [weights, setWeights] = useState({
    severity: 30,
    urgency: 25,
    vulnerability: 20,
    unmetNeed: 15,
    populationImpact: 10,
  });
  const [popCap, setPopCap] = useState(50000);
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/priority/config");
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
        setWeights({
          severity: Math.round(data.config.weights.severity * 100),
          urgency: Math.round(data.config.weights.urgency * 100),
          vulnerability: Math.round(data.config.weights.vulnerability * 100),
          unmetNeed: Math.round(data.config.weights.unmetNeed * 100),
          populationImpact: Math.round(data.config.weights.populationImpact * 100),
        });
        setPopCap(data.config.populationCap);
      }
      if (data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error("Failed to load config:", err);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const totalSum =
    weights.severity +
    weights.urgency +
    weights.vulnerability +
    weights.unmetNeed +
    weights.populationImpact;

  const isSumValid = totalSum === 100;

  const handleSave = async () => {
    if (!isSumValid) {
      setErrorMsg("Weights must sum exactly to 100%. Current sum: " + totalSum + "%.");
      return;
    }
    if (!reason.trim()) {
      setErrorMsg("A justification reason is required for administrative formula changes.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg("");

      const res = await fetch("/api/priority/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            weights: {
              severity: weights.severity / 100,
              urgency: weights.urgency / 100,
              vulnerability: weights.vulnerability / 100,
              unmetNeed: weights.unmetNeed / 100,
              populationImpact: weights.populationImpact / 100,
            },
            populationCap: popCap,
          },
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update configuration");
      }

      setSaveSuccess(true);
      setReason("");
      setTimeout(() => setSaveSuccess(false), 3000);
      await fetchConfig();
      await onUpdate();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-borderDefault shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-2">
          <div>
            <h2 className="text-base font-bold text-navy flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Multi-Criteria Decision Analysis (MCDA) Scoring Weights</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Adjust policy weights. Every modification generates a new formula version and triggers automated ward score recalculation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
              Current: <strong>{config?.formulaVersion || "v1.0"}</strong>
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                isSumValid
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}
            >
              Sum: {totalSum}% / 100%
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Formula policy successfully updated and scores recalculated across all wards!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
          {/* Severity */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between font-bold text-slate-800">
              <span>Severity Weight</span>
              <span className="text-indigo-600 text-sm font-black">{weights.severity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={weights.severity}
              onChange={(e) => setWeights({ ...weights, severity: parseInt(e.target.value) || 0 })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Physical damage, flood depth, infrastructure loss.</p>
          </div>

          {/* Urgency */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between font-bold text-slate-800">
              <span>Urgency Weight</span>
              <span className="text-indigo-600 text-sm font-black">{weights.urgency}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={weights.urgency}
              onChange={(e) => setWeights({ ...weights, urgency: parseInt(e.target.value) || 0 })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Time-critical isolation, medical distress, food depletion.</p>
          </div>

          {/* Vulnerability */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between font-bold text-slate-800">
              <span>Vulnerability Weight</span>
              <span className="text-indigo-600 text-sm font-black">{weights.vulnerability}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={weights.vulnerability}
              onChange={(e) => setWeights({ ...weights, vulnerability: parseInt(e.target.value) || 0 })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Elderly, infants, socio-economic baseline fragility.</p>
          </div>

          {/* Unmet Need */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between font-bold text-slate-800">
              <span>Unmet Need Weight</span>
              <span className="text-indigo-600 text-sm font-black">{weights.unmetNeed}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={weights.unmetNeed}
              onChange={(e) => setWeights({ ...weights, unmetNeed: parseInt(e.target.value) || 0 })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Resource deficit vs verified field request demand.</p>
          </div>

          {/* Population Impact */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between font-bold text-slate-800">
              <span>Population Impact Weight</span>
              <span className="text-indigo-600 text-sm font-black">{weights.populationImpact}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={weights.populationImpact}
              onChange={(e) => setWeights({ ...weights, populationImpact: parseInt(e.target.value) || 0 })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Log-normalized resident population impacted.</p>
          </div>

          {/* Population Cap */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between font-bold text-slate-800">
              <span>Population Cap</span>
              <span className="text-indigo-600 text-sm font-black">{popCap.toLocaleString()}</span>
            </div>
            <input
              type="number"
              value={popCap}
              onChange={(e) => setPopCap(parseInt(e.target.value) || 50000)}
              className="w-full p-2 bg-white border rounded font-semibold text-xs mt-1"
            />
            <p className="text-[11px] text-slate-500">Upper bound threshold for population normalization.</p>
          </div>
        </div>

        {/* Reason and Save Action */}
        <div className="pt-4 border-t space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Audit Justification Reason <span className="text-red-500">* (Mandatory)</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g., Calibrating vulnerability index following coastal surge assessment"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSave}
              disabled={isSaving || !isSumValid || !reason.trim()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-sm transition flex items-center justify-center gap-1.5"
            >
              {isSaving ? "Saving..." : "Commit Formula Version"}
            </button>
          </div>
        </div>
      </div>

      {/* Formula Version History */}
      <div className="bg-white rounded-xl border border-borderDefault shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-navy flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" />
          <span>Formula Policy Version Ledger</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="p-3 font-semibold">Version</th>
                <th className="p-3 font-semibold">Weights (Sev / Urg / Vuln / Need / Pop)</th>
                <th className="p-3 font-semibold">Population Cap</th>
                <th className="p-3 font-semibold">Author / Actor</th>
                <th className="p-3 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-indigo-700">{item.formulaVersion}</td>
                  <td className="p-3 font-mono text-slate-600">
                    {(item.weights.severity * 100).toFixed(0)}% /{" "}
                    {(item.weights.urgency * 100).toFixed(0)}% /{" "}
                    {(item.weights.vulnerability * 100).toFixed(0)}% /{" "}
                    {(item.weights.unmetNeed * 100).toFixed(0)}% /{" "}
                    {(item.weights.populationImpact * 100).toFixed(0)}%
                  </td>
                  <td className="p-3 text-slate-700">{item.populationCap.toLocaleString()}</td>
                  <td className="p-3 text-slate-700">Administrator</td>
                  <td className="p-3 text-slate-400 font-mono text-[11px]">
                    {new Date(item.updatedAt || Date.now()).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// TAB 2: Inventory Management Panel
// -------------------------------------------------------------
function InventoryControlPanel({
  inventory,
  onUpdate,
}: {
  inventory: ResourceStock[];
  onUpdate: () => Promise<void>;
}) {
  const [editingStock, setEditingStock] = useState<ResourceStock | null>(null);
  const [totalVal, setTotalVal] = useState<number>(0);
  const [reservedVal, setReservedVal] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const handleOpenEdit = (stock: ResourceStock) => {
    setEditingStock(stock);
    setTotalVal(stock.total);
    setReservedVal(stock.reserved);
    setReason("");
    setStatusMsg("");
  };

  const handleSave = async () => {
    if (!editingStock) return;
    if (totalVal < 0 || reservedVal < 0) {
      setStatusMsg("Stock and reserved quantities cannot be negative.");
      return;
    }
    if (reservedVal > totalVal) {
      setStatusMsg("Reserved stock cannot exceed total warehouse inventory.");
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType: editingStock.type,
          updates: { total: totalVal, reserved: reservedVal },
          reason: reason || "Administrative warehouse replenishment",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update stock");
      }

      await onUpdate();
      setEditingStock(null);
    } catch (err: any) {
      setStatusMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-borderDefault shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-base font-bold text-navy flex items-center gap-2">
              <Boxes className="w-4 h-4 text-indigo-600" />
              <span>Central Warehouse Inventory Control</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritative stock limits, reserve buffers, and batch adjustments. Units are strictly fixed per humanitarian resource type.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="p-3 font-semibold">Resource</th>
                <th className="p-3 font-semibold">Unit Type</th>
                <th className="p-3 font-semibold text-right">Total Stock</th>
                <th className="p-3 font-semibold text-right">Reserved Buffer</th>
                <th className="p-3 font-semibold text-right">Available for Dispatch</th>
                <th className="p-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.map((stock) => (
                <tr key={stock.type} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{stock.name}</td>
                  <td className="p-3">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                      {stock.unit}
                    </span>
                  </td>
                  <td className="p-3 text-right font-black text-navy">{stock.total.toLocaleString()}</td>
                  <td className="p-3 text-right font-black text-amber-700">{stock.reserved.toLocaleString()}</td>
                  <td className="p-3 text-right font-black text-emerald-700">{stock.available.toLocaleString()}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleOpenEdit(stock)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-xs transition"
                    >
                      Modify Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingStock && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-navy">
                Adjust {editingStock.name} ({editingStock.unit})
              </h3>
              <button onClick={() => setEditingStock(null)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            {statusMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {statusMsg}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Total Warehouse Stock ({editingStock.unit})
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalVal}
                  onChange={(e) => setTotalVal(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2 border rounded font-bold text-navy"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Reserved Buffer ({editingStock.unit})
                </label>
                <input
                  type="number"
                  min="0"
                  value={reservedVal}
                  onChange={(e) => setReservedVal(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2 border rounded font-bold text-amber-700"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Available for Dynamic Allocation
                </label>
                <div className="p-2.5 bg-slate-50 border rounded font-mono font-black text-emerald-700">
                  {Math.max(0, totalVal - reservedVal).toLocaleString()} {editingStock.unit}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Audit Reason for Modification
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inbound shipment arrival from State Relief Depot"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 border rounded text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setEditingStock(null)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                {isSaving ? "Saving..." : "Commit Inventory Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// TAB 3: Users & Roles Management Panel
// -------------------------------------------------------------
function UsersManagementPanel() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string>("");

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      setSaveStatus("Updating user...");
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to update user");

      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole as any } : u)));
      setSaveStatus("Role updated successfully!");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err: any) {
      setSaveStatus(`Error: ${err.message}`);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      setSaveStatus("Updating status...");
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, active: !currentActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to update user");

      setUsers(users.map((u) => (u.id === userId ? { ...u, active: !currentActive } : u)));
      setSaveStatus("Status updated!");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err: any) {
      setSaveStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-borderDefault shadow-sm p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-2">
        <div>
          <h2 className="text-base font-bold text-navy flex items-center gap-2">
            <Users2 className="w-4 h-4 text-indigo-600" />
            <span>Personnel Directory & Role-Based Access Control (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage system operators, assign operational roles, and toggle platform access permissions.
          </p>
        </div>
        {saveStatus && (
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
            {saveStatus}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="p-3 font-semibold">User</th>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Assigned Role</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-center">Toggle Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="p-3">
                  <div className="font-bold text-slate-900">{user.name}</div>
                  <div className="text-[11px] font-mono text-slate-400">{user.id}</div>
                </td>
                <td className="p-3 text-slate-600 font-mono text-[11px]">{user.email}</td>
                <td className="p-3">
                  <select
                    value={user.role}
                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                    className="p-1.5 bg-slate-50 border rounded font-semibold text-slate-800 text-xs"
                  >
                    <option value="admin">Administrator</option>
                    <option value="coordinator">Emergency Coordinator</option>
                    <option value="field_officer">Field Officer</option>
                    <option value="resource_manager">Resource Manager</option>
                    <option value="auditor">Auditor</option>
                    <option value="viewer">Public Viewer</option>
                  </select>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      user.active
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-slate-100 text-slate-500 border border-slate-300"
                    }`}
                  >
                    {user.active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => handleToggleActive(user.id, user.active)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition ${
                      user.active
                        ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    }`}
                  >
                    {user.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// TAB 4: Full Audit Stream Panel
// -------------------------------------------------------------
function FullAuditPanel() {
  const [events, setEvents] = useState<any[]>([]);
  const [filterAction, setFilterAction] = useState("");
  const [filterActor, setFilterActor] = useState("");

  useEffect(() => {
    fetch("/api/audit")
      .then((res) => res.json())
      .then((data) => {
        if (data.events) setEvents(data.events);
      })
      .catch((err) => console.error(err));
  }, []);

  const filteredEvents = events.filter((e) => {
    const matchesAction = !filterAction || e.action.toLowerCase().includes(filterAction.toLowerCase());
    const matchesActor = !filterActor || e.actor.toLowerCase().includes(filterActor.toLowerCase());
    return matchesAction && matchesActor;
  });

  return (
    <div className="bg-white rounded-xl border border-borderDefault shadow-sm p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
        <div>
          <h2 className="text-base font-bold text-navy flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Cryptographically Verified Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable, append-only transaction ledger recording every configuration change, allocation run, override, and decision.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <input
            type="text"
            placeholder="Filter by action..."
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="p-1.5 px-3 bg-slate-50 border rounded-lg text-xs"
          />
          <input
            type="text"
            placeholder="Filter by actor..."
            value={filterActor}
            onChange={(e) => setFilterActor(e.target.value)}
            className="p-1.5 px-3 bg-slate-50 border rounded-lg text-xs"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="p-3 font-semibold">Timestamp</th>
              <th className="p-3 font-semibold">Actor & Role</th>
              <th className="p-3 font-semibold">Action</th>
              <th className="p-3 font-semibold">Entity</th>
              <th className="p-3 font-semibold">Details / Justification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEvents.map((event) => (
              <tr key={event.id} className="hover:bg-slate-50">
                <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                  {new Date(event.timestamp).toLocaleString()}
                </td>
                <td className="p-3 whitespace-nowrap">
                  <div className="font-bold text-slate-900">{event.actor}</div>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    {event.role}
                  </span>
                </td>
                <td className="p-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                  {event.action}
                </td>
                <td className="p-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                  {event.entityType}:{event.entityId}
                </td>
                <td className="p-3 text-slate-700 max-w-md">{event.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// TAB 5: City & Demo Controls Panel
// -------------------------------------------------------------
function CityAndDemoPanel({
  currentCity,
  onCityChange,
  onResetDemo,
}: {
  currentCity: string;
  onCityChange: (city: any) => void;
  onResetDemo: () => Promise<void>;
}) {
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const handleReset = async () => {
    if (confirm("Reset demo data to initial factory baseline? All modifications will be reverted.")) {
      try {
        setResetting(true);
        await onResetDemo();
        setResetMessage("Demo data successfully restored to deterministic baseline!");
        setTimeout(() => setResetMessage(""), 3000);
      } catch (err: any) {
        setResetMessage(`Error: ${err.message}`);
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* City Switcher */}
      <div className="bg-white rounded-xl border border-borderDefault shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-navy flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-600" />
          <span>Active Operating City (Section A8 Architecture)</span>
        </h2>
        <p className="text-xs text-slate-500">
          Switch the operating basemap and ward coordinates. Chennai is the active default municipal operations area.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div
            onClick={() => onCityChange("chennai")}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              currentCity === "chennai"
                ? "bg-indigo-50/50 border-indigo-600 shadow-sm"
                : "hover:bg-slate-50 border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm text-slate-900">Chennai Metropolitan Area</span>
              {currentCity === "chennai" && (
                <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded">
                  Active City
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              7 Monitored Flood Wards (CHN-001 to CHN-007) across Velachery, T. Nagar, Perambur, Mylapore, Tambaram, Kolathur, Madipakkam.
            </p>
          </div>

          <div
            onClick={() => onCityChange("coimbatore")}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              currentCity === "coimbatore"
                ? "bg-indigo-50/50 border-indigo-600 shadow-sm"
                : "hover:bg-slate-50 border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm text-slate-900">Coimbatore District</span>
              {currentCity === "coimbatore" && (
                <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded">
                  Active City
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Western Ghats relief sector (CBE-001 to CBE-005). Pre-configured municipal backup profile.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Reset Panel */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-red-900 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-red-600" />
          <span>Demo Data Reset (Administrator Privileged Action)</span>
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Reverts all inventory stock reserves, area priority scores, allocation runs, and simulation states back to the original seed data (Food: 8,000 packs, Water: 30,000 L, Medical: 1,200 kits, Shelter: 2,000 kits, Hygiene: 2,500 kits). Logs an immutable audit reset event.
        </p>

        {resetMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg">
            {resetMessage}
          </div>
        )}

        <button
          onClick={handleReset}
          disabled={resetting}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-sm transition flex items-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{resetting ? "Resetting Environment..." : "Execute Demo Reset"}</span>
        </button>
      </div>
    </div>
  );
}
