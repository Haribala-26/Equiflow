"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Boxes,
  Scale,
  Map as MapIcon,
  SlidersHorizontal,
  FileText,
  Settings,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/affected-areas", label: "Affected Areas", icon: MapPin },
    { href: "/resource-inventory", label: "Resource Inventory", icon: Boxes },
    { href: "/allocation-centre", label: "Allocation Centre", icon: Scale },
    { href: "/map-view", label: "Map View", icon: MapIcon },
    { href: "/reports-audit", label: "Reports & Audit", icon: FileText },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-borderDefault flex flex-col justify-between shrink-0 h-[calc(100vh-84px)] sticky top-[84px]">
      <div className="p-3">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Operations
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-teal/10 text-teal font-semibold border-l-4 border-teal"
                    : "text-slate-600 hover:bg-slate-50 hover:text-navy"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-teal" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Status Box */}
      <div className="p-3 m-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
        <div className="font-semibold text-slate-800 flex items-center justify-between">
          <span>System Status</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <div className="text-[11px] text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span>Chennai Map:</span>
            <span className="font-medium text-slate-700">Online</span>
          </div>
          <div className="flex justify-between">
            <span>Priority Engine:</span>
            <span className="font-medium text-slate-700">Active (v1.0)</span>
          </div>
          <div className="flex justify-between">
            <span>Allocation Engine:</span>
            <span className="font-medium text-slate-700">Constrained</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
