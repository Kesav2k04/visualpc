"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Cpu,
  Server,
  Timer,
} from "lucide-react";
import type { MetricRecord, JobRecord, WorkerRecord } from "@/hooks/useMetrics";

interface SystemHealthProps {
  metrics: MetricRecord[];
  jobs: JobRecord[];
  workers: WorkerRecord[];
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  color: string;
  delay: number;
}

function StatCard({ icon: Icon, label, value, sub, color, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="glass-card glass-card-hover flex flex-col gap-3 p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      </div>
    </motion.div>
  );
}

export default function SystemHealth({
  metrics,
  jobs,
  workers,
}: SystemHealthProps) {
  const activeWorkers = workers.filter((w) => {
    const s = (w.status ?? "").toLowerCase();
    return s === "online" || s === "active";
  }).length;
  const completedJobs = jobs.filter((j) => j.status === "completed").length;

  const avgLatency =
    metrics.length > 0
      ? (
        metrics.reduce((s, m) => s + (m.latency_total ?? 0), 0) /
        metrics.length
      ).toFixed(3)
      : "—";

  const avgGpuMem =
    metrics.length > 0
      ? (
        metrics.reduce((s, m) => s + (m.gpu_memory_peak ?? 0), 0) /
        metrics.length
      ).toFixed(1)
      : "—";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={Server}
        label="Active Workers"
        value={activeWorkers}
        sub={`${workers.length} total registered`}
        color="#22c55e"
        delay={0}
      />
      <StatCard
        icon={Activity}
        label="Total Metrics"
        value={metrics.length}
        sub="Performance records"
        color="#6366f1"
        delay={0.1}
      />
      <StatCard
        icon={Cpu}
        label="Avg GPU Memory"
        value={`${avgGpuMem} MB`}
        sub="Peak usage average"
        color="#22d3ee"
        delay={0.2}
      />
      <StatCard
        icon={Timer}
        label="Avg Latency"
        value={`${avgLatency}s`}
        sub={`${completedJobs} jobs completed`}
        color="#f59e0b"
        delay={0.3}
      />
    </div>
  );
}
