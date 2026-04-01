"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { MetricRecord } from "@/hooks/useMetrics";

interface LatencyChartProps {
  metrics: MetricRecord[];
}

const COLORS: Record<string, string> = {
  small: "#22c55e",
  medium: "#f59e0b",
  large: "#ef4444",
  unknown: "#6366f1",
};

export default function LatencyChart({ metrics }: LatencyChartProps) {
  const chartData = metrics.slice(-25).map((m, i) => ({
    name: `Job ${i + 1}`,
    latency: m.latency_total ?? 0,
    workload: m.workload_size ?? "unknown",
  }));

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="glass-card p-6"
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          Job Latency Breakdown
        </h3>
        <p className="text-xs text-muted-foreground">
          End-to-end latency per job (seconds)
        </p>
      </div>

      <div className="mb-3 flex gap-3">
        {Object.entries(COLORS)
          .filter(([k]) => k !== "unknown")
          .map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] font-medium text-muted-foreground capitalize">
                {label}
              </span>
            </div>
          ))}
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1f36" />
            <XAxis
              dataKey="name"
              stroke="#71728a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              stroke="#71728a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              label={{
                value: "Latency (s)",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 11, fill: "#71728a" },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#12131f",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#e4e4ef",
              }}
            />
            <Bar
              dataKey="latency"
              name="Latency (s)"
              radius={[6, 6, 0, 0]}
              animationDuration={1200}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.workload] || COLORS.unknown}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
