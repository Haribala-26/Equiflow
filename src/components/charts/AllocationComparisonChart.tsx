"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AllocationItem } from "@/domain/types";

interface Props {
  items: AllocationItem[];
}

export function AllocationComparisonChart({ items }: Props) {
  // Aggregate by ward
  const wardMap = new Map<string, { name: string; demanded: number; allocated: number }>();

  for (const item of items) {
    const existing = wardMap.get(item.areaName) || {
      name: item.areaName,
      demanded: 0,
      allocated: 0,
    };
    existing.demanded += item.eligibleDemand;
    existing.allocated += item.recommendedQty;
    wardMap.set(item.areaName, existing);
  }

  const data = Array.from(wardMap.values());

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} />
          <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              border: "1px solid #E2E8F0",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
          <Bar dataKey="demanded" name="Requested Demand" fill="#94A3B8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="allocated" name="Optimized Allocation" fill="#167D83" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
