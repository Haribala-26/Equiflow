"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  LayoutDashboard,
  MapPin,
  Boxes,
  Scale,
  Map as MapIcon,
  FlaskConical,
  FileText,
  ShieldCheck,
  Sliders,
  Users2,
  Activity,
  Lock,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { currentRole } = useApp();
  const isAdmin = currentRole === "admin";

  const operationalNavItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/affected-areas", label: "Affected Areas", icon: MapPin },
    {
      href: "/resource-inventory",
      label: "Resource Inventory",
      icon: Boxes,
      badge: !isAdmin ? "Read-Only" : undefined,
    },
    { href: "/allocation-centre", label: "Allocation Centre", icon: Scale },
    { href: "/map-view", label: "Map View", icon: MapIcon },
    { href: "/reports-audit", label: "Reports & Audit", icon: FileText },
  ];

  const adminNavItems = [
    { href: "/admin", label: "Governance Hub", icon: ShieldCheck },
    { href: "/admin?tab=scoring", label: "Scoring Formula", icon: Sliders },
    { href: "/admin?tab=inventory", label: "Inventory Control", icon: Boxes },
    { href: "/admin?tab=users", label: "Users & Roles", icon: Users2 },
  ];

  return (
    <aside className="w-64 bg-white border-r border-borderDefault flex flex-col justify-between shrink-0 h-[calc(100vh-84px)] sticky top-[84px] overflow-y-auto">
      <div className="p-3 space-y-4">
        {/* Operations Section */}
        <div>
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Operations</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
              {isAdmin ? "Admin" : "Coordinator"}
            </span>
          </div>
          <nav className="space-y-0.5 mt-1">
            {operationalNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-teal/10 text-teal font-semibold border-l-4 border-teal"
                      : "text-slate-600 hover:bg-slate-50 hover:text-navy"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-teal" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded border border-slate-200">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Administration Section (Visible strictly for Administrators) */}
        {isAdmin && (
          <div className="pt-2 border-t border-slate-100">
            <div className="px-3 py-1.5 text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Administration</span>
            </div>
            <nav className="space-y-0.5 mt-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href.split("?")[0]);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? "bg-indigo-50 text-indigo-900 font-semibold border-l-4 border-indigo-600"
                        : "text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-900"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* System Status Box */}
      <div className="p-3 m-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
        <div className="font-semibold text-slate-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Status
          </span>
          <span className="text-[10px] font-mono text-slate-500">v1.0</span>
        </div>
        <div className="text-[11px] text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span>Role:</span>
            <span className="font-medium text-slate-800 capitalize">{currentRole}</span>
          </div>
          <div className="flex justify-between">
            <span>Priority Engine:</span>
            <span className="font-medium text-slate-700">Deterministic</span>
          </div>
          <div className="flex justify-between">
            <span>Allocation Core:</span>
            <span className="font-medium text-slate-700">2-Phase Constrained</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
