"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { ShieldAlert, ArrowLeft, UserCheck } from "lucide-react";

interface AccessRestrictedProps {
  requiredPermission?: string;
  message?: string;
}

export function AccessRestricted({
  requiredPermission = "admin",
  message = "This administrative section requires Administrator privileges. Your active session is currently set to Emergency Coordinator.",
}: AccessRestrictedProps) {
  const { currentRole, setCurrentRole } = useApp();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-borderDefault shadow-md p-6 text-center space-y-4">
        <div className="w-14 h-14 bg-critical/10 text-critical rounded-2xl mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-mono font-bold text-critical uppercase tracking-wider bg-critical/10 px-2.5 py-0.5 rounded-full border border-critical/20">
            HTTP 403 — Forbidden
          </span>
          <h2 className="text-xl font-black text-navy mt-2">Access Restricted</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">{message}</p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left space-y-1">
          <div className="flex justify-between text-slate-500">
            <span>Your Current Role:</span>
            <span className="font-bold text-slate-800 capitalize">{currentRole}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Required Role:</span>
            <span className="font-bold text-indigo-700">Administrator</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Security Guard:</span>
            <span className="font-mono text-[11px] text-slate-700">{requiredPermission}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Overview</span>
          </Link>
          <button
            onClick={() => setCurrentRole("admin")}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Switch to Admin Role</span>
          </button>
        </div>
      </div>
    </div>
  );
}
