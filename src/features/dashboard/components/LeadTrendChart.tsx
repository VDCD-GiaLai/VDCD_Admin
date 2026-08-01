"use client";

import { useLeadTrends } from "../api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import { DropdownSelect } from "@/components/ui";

export function LeadTrendChart() {
  const [range, setRange] = useState("7days");
  const { data, isLoading, isError } = useLeadTrends(range);

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 shadow-[0px_2px_2px_rgba(0,0,0,0.05)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-text">Biểu đồ Leads</h3>
          <p className="text-sm text-text-muted">Xu hướng khách hàng tiềm năng</p>
        </div>
        <DropdownSelect
          placement="bottom-end"
          value={range}
          onChange={setRange}
          options={[
            { value: "7days", label: "7 ngày qua" },
            { value: "30days", label: "30 ngày qua" },
            { value: "90days", label: "90 ngày qua" },
          ]}
        />
      </div>

      <div className="h-[300px] w-full flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <span className="inline-block h-6 w-6 animate-[spin_0.75s_linear_infinite] rounded-full border-2 border-primary border-r-transparent" />
          </div>
        ) : isError || !data ? (
          <div className="flex h-full items-center justify-center text-sm text-danger">
            Không thể tải dữ liệu biểu đồ.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8EE" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6C7E96" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6C7E96" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "8px",
                  border: "1px solid #E2E8EE",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                itemStyle={{ color: "#011A42", fontWeight: 500 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#ca2a30"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: "#FFFFFF", stroke: "#ca2a30" }}
                activeDot={{ r: 6, fill: "#ca2a30", stroke: "#FFFFFF" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
