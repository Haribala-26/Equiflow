"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ResourceStock } from "@/domain/types";

interface Props {
  inventory: ResourceStock[];
}

export function ShortageProjectionChart({ inventory }: Props) {
  // Generate a 7-day burn forecast
  const days = [0, 1, 2, 3, 4, 5, 6, 7];

  const data = days.map((day) => {
    const point: any = { day: day === 0 ? "Today" : `Day +${day}` };
    for (const item of inventory) {
      const burn = item.dailyConsumptionRate || 1000;
      const remaining = Math.max(0, item.available - burn * day);
      point[item.type] = remaining;
    }
    return point;
  });

  const colors: Record<string, string> = {
    food: "#167D83",
    water: "#0284C7",
    medical: "#B42318",
    shelter: "#D99118",
    hygiene: "#8B5CF6",
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748B" }} />
          <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
          {inventory.map((stock) => (
            <Line
              key={stock.type}
              type="monotone"
              dataKey={stock.type}
              name={`${stock.name} (${stock.unit})`}
              stroke={colors[stock.type] || "#167D83"}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
