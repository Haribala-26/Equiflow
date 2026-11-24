"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { AuditEvent } from "@/domain/types";
import { FileText, Shield, Clock, User, CheckCircle2, AlertCircle } from "lucide-react";

export default function ReportsAuditPage() {
  const { currentRun } = useApp();
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/audit")
      .then((res) => res.json())
      .then((data) => setAuditEvents(data.events || []))
      .catch((err) => console.error("Failed to load audit events:", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-navy tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal" />
            <span>Reports & Immutable Audit Trail</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Transparent chronological record of all allocation runs, manual overrides, and policy adjustments
          </p>
        </div>
      </div>

      {/* Fairness Compliance Summary */}
      {currentRun && (
        <div className="bg-white p-4 rounded-xl border border-borderDefault shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal" />
            <span>Active Run Compliance Summary ({currentRun.id})</span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 rounded border">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Overall Satisfaction</span>
              <span className="text-lg font-black text-navy">
                {currentRun.fairness.overallSatisfactionRate.toFixed(1)}%
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded border">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Critical Coverage</span>
              <span className="text-lg font-black text-critical">
                {currentRun.fairness.criticalCoverageRate.toFixed(0)}%
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded border">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Equity Variance</span>
              <span className="text-lg font-black text-slate-700">
                ±{currentRun.fairness.coverageVariance.toFixed(1)}%
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded border">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Status</span>
              <span className="text-lg font-black capitalize text-emerald-700">
                {currentRun.status.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Timeline */}
      <div className="bg-white rounded-xl border border-borderDefault shadow-sm overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-borderDefault flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Immutable Audit Trail Events ({auditEvents.length})
          </h3>
          <span className="text-[11px] text-slate-500">Append-Only Event Store</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {auditEvents.map((event) => (
            <div key={event.id} className="p-3.5 hover:bg-slate-50 transition text-xs space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{event.action}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                    {event.entityType}:{event.entityId}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="text-slate-600 text-[11px]">{event.details}</div>

              {event.reason && (
                <div className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px] inline-block font-medium">
                  Override Rationale: {event.reason}
                </div>
              )}

              <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
                <User className="w-3 h-3" />
                <span>Actor: {event.actor} ({event.role})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
