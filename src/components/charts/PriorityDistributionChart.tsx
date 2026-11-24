"use client";

import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PRIORITY_CATEGORIES } from "@/domain/config";
import { PriorityCategory } from "@/domain/types";

interface Props {
  areas: Array<{ priority?: { category: PriorityCategory } }>;
}

export function PriorityDistributionChart({ areas }: Props) {
  const counts: Record<PriorityCategory, number> = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
  };

  for (const a of areas) {
    if (a.priority?.category) {
      counts[a.priority.category] += 1;
    }
  }

  const data = [
    { name: "Critical (≥80)", value: counts.critical, color: PRIORITY_CATEGORIES.critical.color },
    { name: "High (60–79.9)", value: counts.high, color: PRIORITY_CATEGORIES.high.color },
    { name: "Moderate (40–59.9)", value: counts.moderate, color: PRIORITY_CATEGORIES.moderate.color },
    { name: "Low (<40)", value: counts.low, color: PRIORITY_CATEGORIES.low.color },
  ].filter((d) => d.value > 0);

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={65}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
