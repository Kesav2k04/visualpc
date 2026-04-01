"use client";

import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MetricRecord } from "@/hooks/useMetrics";

interface GPUChartProps {
  metrics: MetricRecord[];
}

export default function GPUChart({ metrics }: GPUChartProps) {
  // Group metrics by workload for chart visualization
  const chartData = metrics.map((m, i) => ({
    name: `#${i + 1}`,
    gpu_memory: m.gpu_memory_peak ?? 0,
    execution_time: (m.execution_time ?? 0) * 1000, // convert to ms
    workload: m.workload_size ?? "unknown",
  }));

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="glass-card p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            GPU Memory Usage
          </h3>
          <p className="text-xs text-muted-foreground">
            Peak memory across workloads (MB)
          </p>
        </div>
        <div className="flex gap-2">
          {["small", "medium", "large"].map((w) => (
            <span
              key={w}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-medium text-secondary-foreground"
            >
              {w}
            </span>
          ))}
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gpuGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="execGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1f36" />
            <XAxis
              dataKey="name"
              stroke="#71728a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#71728a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
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
            <Legend
              wrapperStyle={{ fontSize: "11px", color: "#a5a6c4" }}
            />
            <Area
              type="monotone"
              dataKey="gpu_memory"
              name="GPU Memory (MB)"
              stroke="#6366f1"
              fill="url(#gpuGrad)"
              strokeWidth={2}
              dot={false}
              animationDuration={1500}
            />
            <Area
              type="monotone"
              dataKey="execution_time"
              name="Exec Time (ms)"
              stroke="#22d3ee"
              fill="url(#execGrad)"
              strokeWidth={2}
              dot={false}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
