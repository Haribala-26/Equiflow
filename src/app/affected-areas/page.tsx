"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Area, PriorityCategory } from "@/domain/types";
import {
  Search,
  Filter,
  Sparkles,
  Edit3,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  X,
  Send,
  Loader2,
} from "lucide-react";

export default function AffectedAreasPage() {
  const { areas, selectedAreaId, setSelectedAreaId, refreshData, currentRole } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");

  // AI Assessment State
  const [reportText, setReportText] = useState("");
  const [isAssessing, setIsAssessing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Edit Modal State
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedArea = areas.find((a) => a.id === selectedAreaId);

  // Filtering
  const filteredAreas = areas.filter((area) => {
    const matchesSearch =
      area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || area.priority?.category === categoryFilter;
    const matchesVerification =
      verificationFilter === "all" || area.verificationStatus === verificationFilter;

    return matchesSearch && matchesCategory && matchesVerification;
  });

  const handleRunAiAssessment = async (sampleText?: string) => {
    const textToAnalyze = sampleText || reportText;
    if (!textToAnalyze.trim()) return;

    try {
      setIsAssessing(true);
      setAiResult(null);
      const res = await fetch("/api/ai/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportText: textToAnalyze }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiResult(data.assessment);
      }
    } catch (err) {
      console.error("AI Assessment failed:", err);
    } finally {
      setIsAssessing(false);
    }
  };

  const handleApplyAiSuggestions = async () => {
    if (!aiResult || !selectedArea) return;

    try {
      setIsSaving(true);
      const updatedArea = {
        ...selectedArea,
        severity: aiResult.suggestedSeverity ?? selectedArea.severity,
        urgency: aiResult.suggestedUrgency ?? selectedArea.urgency,
        verificationStatus: "verified" as const,
        notes: `AI-Verified Report: ${aiResult.summary}`,
      };

      // Merge suggested needs
      if (aiResult.suggestedNeeds?.length > 0) {
        const newNeeds = [...selectedArea.needs];
        for (const sug of aiResult.suggestedNeeds) {
          const existing = newNeeds.find((n) => n.resourceType === sug.resourceType);
          if (existing) {
            existing.requestedQty = sug.quantity;
          }
        }
        updatedArea.needs = newNeeds;
      }

      await fetch(`/api/areas/${selectedArea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedArea,
          reason: "Applied structured AI assessment recommendations",
        }),
      });

      await refreshData();
      setAiResult(null);
    } catch (err) {
      console.error("Failed to apply suggestions:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveArea = async () => {
    if (!editingArea) return;

    try {
      setIsSaving(true);
      await fetch(`/api/areas/${editingArea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingArea,
          reason: "Field coordinator manual update",
        }),
      });

      await refreshData();
      setEditingArea(null);
    } catch (err) {
      console.error("Failed to save area:", err);
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
            Affected Communities & Wards
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Searchable ward registry, multi-factor priority metrics, and AI field-report extraction
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-borderDefault shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by area name or ID (e.g. Velachery, CHN-002)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-teal"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Priority Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none text-slate-700"
            aria-label="Filter by Priority Category"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical (80–100)</option>
            <option value="high">High (60–79.9)</option>
            <option value="moderate">Moderate (40–59.9)</option>
            <option value="low">Low (0–39.9)</option>
          </select>

          {/* Verification Status Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none text-slate-700"
            aria-label="Filter by Verification Status"
          >
            <option value="all">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="pending_review">Pending Review</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      {/* Main Content Layout: Table (Left/Center) + Detail Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Table View */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-borderDefault shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-borderDefault text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-3">Area</th>
                  <th className="py-3 px-3">Priority Score</th>
                  <th className="py-3 px-3">Population</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Urgency</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAreas.map((area) => {
                  const isSelected = area.id === selectedAreaId;
                  const score = area.priority?.score?.toFixed(1) ?? "N/A";
                  const catColor = area.priority?.categoryColor || "#167D83";

                  return (
                    <tr
                      key={area.id}
                      onClick={() => setSelectedAreaId(area.id)}
                      className={`hover:bg-slate-50 cursor-pointer transition ${
                        isSelected ? "bg-teal/5 font-semibold" : ""
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{area.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{area.id}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-sm"
                            style={{ backgroundColor: catColor }}
                          ></span>
                          <span className="font-extrabold text-slate-900">{score}</span>
                          <span className="text-[10px] uppercase text-slate-400">
                            ({area.priority?.category})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div>{area.population.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">{area.households} households</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{area.severity}/100</td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{area.urgency}/100</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            area.verificationStatus === "verified"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : area.verificationStatus === "pending_review"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {area.verificationStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAreaId(area.id);
                            setEditingArea(JSON.parse(JSON.stringify(area)));
                          }}
                          className="p-1.5 text-slate-400 hover:text-teal rounded hover:bg-slate-100"
                          title="Edit Ward Metrics"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Area Details & AI Assessment Panel */}
        <div className="lg:col-span-4 space-y-4">
          {selectedArea ? (
            <div className="bg-white rounded-xl border border-borderDefault p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedArea.name}</h3>
                  <span className="text-xs text-slate-400 font-mono">{selectedArea.id}</span>
                </div>
                <div
                  className="px-2.5 py-1 rounded text-white text-xs font-black"
                  style={{ backgroundColor: selectedArea.priority?.categoryColor }}
                >
                  Score: {selectedArea.priority?.score?.toFixed(1)}
                </div>
              </div>

              {/* Priority Component Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Priority Scoring Formula Breakdown
                </h4>
                <div className="space-y-1.5 text-xs">
                  {selectedArea.priority?.components.map((comp) => (
                    <div key={comp.factor} className="space-y-0.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-600 font-medium">
                          {comp.label} ({(comp.weight * 100).toFixed(0)}%)
                        </span>
                        <span className="font-bold text-slate-800">
                          +{comp.weightedContribution.toFixed(2)} pts
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal"
                          style={{ width: `${comp.normalizedValue}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resource Needs Breakdown */}
              <div className="border-t pt-3 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Stated Resource Requirements
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedArea.needs.map((n) => (
                    <div key={n.resourceType} className="bg-slate-50 border p-2 rounded">
                      <div className="capitalize font-bold text-slate-700">{n.resourceType}</div>
                      <div className="text-slate-900 text-sm font-black">
                        {n.requestedQty.toLocaleString()} {n.unit}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Local: {n.locallyAvailableQty} {n.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Field Report Assessment */}
              <div className="border-t pt-3 space-y-3">
                <div className="flex items-center gap-1.5 text-teal font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-teal" />
                  <span>AI Need Assessment Tool</span>
                </div>

                <div className="text-[11px] text-slate-500">
                  Paste incoming field reports or choose a quick sample:
                </div>

                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <button
                    onClick={() => {
                      const text = `Urgent: 1200 households cut off in ${selectedArea.name}. 3500 drinking water litres and 1500 food packs urgently needed. Sewage backflow causing child fevers.`;
                      setReportText(text);
                      handleRunAiAssessment(text);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                  >
                    Sample: Flash Flood Crisis
                  </button>
                  <button
                    onClick={() => {
                      const text = `Minor localized flooding in ${selectedArea.name}. 300 food packs requested for shelter camp. Water supply stable.`;
                      setReportText(text);
                      handleRunAiAssessment(text);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                  >
                    Sample: Moderate Alert
                  </button>
                </div>

                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Enter unstructured field report text..."
                  rows={3}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-teal"
                ></textarea>

                <button
                  onClick={() => handleRunAiAssessment()}
                  disabled={isAssessing || !reportText.trim()}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition"
                >
                  {isAssessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>AI Analyzing Field Report...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                      <span>Run AI Need Assessment</span>
                    </>
                  )}
                </button>

                {/* AI Assessment Result Display */}
                {aiResult && (
                  <div className="p-3 bg-teal/5 border border-teal/20 rounded-lg space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>AI Extracted Findings</span>
                      <span className="text-[10px] bg-teal text-white px-1.5 py-0.5 rounded">
                        {aiResult.isFallback ? "Heuristic Engine" : "AI Model Output"}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-700">{aiResult.summary}</div>

                    <div className="space-y-1">
                      <span className="font-semibold text-[11px] text-slate-800">Suggested Needs:</span>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        {aiResult.suggestedNeeds?.map((n: any) => (
                          <div key={n.resourceType} className="bg-white p-1 rounded border">
                            <span className="capitalize font-medium">{n.resourceType}:</span> {n.quantity} {n.unit}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between text-[11px] border-t pt-1">
                      <span>Suggested Severity: <strong>{aiResult.suggestedSeverity}</strong></span>
                      <span>Suggested Urgency: <strong>{aiResult.suggestedUrgency}</strong></span>
                    </div>

                    {aiResult.missingInformation?.length > 0 && (
                      <div className="text-[10px] text-amber-700 bg-amber-50 p-1 rounded">
                        Missing Info: {aiResult.missingInformation.join(", ")}
                      </div>
                    )}

                    <button
                      onClick={handleApplyAiSuggestions}
                      disabled={isSaving}
                      className="w-full mt-2 py-1.5 bg-teal hover:bg-teal-700 text-white font-semibold rounded text-xs transition"
                    >
                      {isSaving ? "Applying..." : "Accept AI Suggestions into Ward Record"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400 text-xs">
              Select a ward from the table or map to inspect its component breakdown and run AI assessments.
            </div>
          )}
        </div>
      </div>

      {/* Manual Edit Modal */}
      {editingArea && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base text-slate-900">
                Edit Ward Metrics: {editingArea.name}
              </h3>
              <button
                onClick={() => setEditingArea(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Affected Population</label>
                <input
                  type="number"
                  value={editingArea.population}
                  onChange={(e) =>
                    setEditingArea({ ...editingArea, population: parseInt(e.target.value) || 0 })
                  }
                  className="w-full p-2 bg-slate-50 border rounded mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Households</label>
                <input
                  type="number"
                  value={editingArea.households}
                  onChange={(e) =>
                    setEditingArea({ ...editingArea, households: parseInt(e.target.value) || 0 })
                  }
                  className="w-full p-2 bg-slate-50 border rounded mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Severity (0–100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingArea.severity}
                  onChange={(e) =>
                    setEditingArea({ ...editingArea, severity: parseInt(e.target.value) || 0 })
                  }
                  className="w-full p-2 bg-slate-50 border rounded mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Urgency (0–100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingArea.urgency}
                  onChange={(e) =>
                    setEditingArea({ ...editingArea, urgency: parseInt(e.target.value) || 0 })
                  }
                  className="w-full p-2 bg-slate-50 border rounded mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Vulnerability (0–100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingArea.vulnerability}
                  onChange={(e) =>
                    setEditingArea({ ...editingArea, vulnerability: parseInt(e.target.value) || 0 })
                  }
                  className="w-full p-2 bg-slate-50 border rounded mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Verification Status</label>
                <select
                  value={editingArea.verificationStatus}
                  onChange={(e) =>
                    setEditingArea({
                      ...editingArea,
                      verificationStatus: e.target.value as any,
                    })
                  }
                  className="w-full p-2 bg-slate-50 border rounded mt-1"
                >
                  <option value="verified">Verified</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setEditingArea(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveArea}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold bg-teal hover:bg-teal-700 text-white rounded shadow"
              >
                {isSaving ? "Saving..." : "Save Ward Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
