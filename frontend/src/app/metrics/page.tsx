"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";
import { isAuthenticated } from "@/services/auth";
import { useMetrics } from "@/hooks/useMetrics";
import type { MetricRecord } from "@/hooks/useMetrics";

export default function MetricsPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const { metrics, loading, error, lastUpdated, refresh } = useMetrics(5000);

  useEffect(() => {
    if (!isAuthenticated()) router.replace("/login");
    else setAuthed(true);
  }, [router]);

  if (!authed) return null;

  const avgLatency =
    metrics.length > 0
      ? (metrics.reduce((s, m) => s + (m.latency_total ?? 0), 0) / metrics.length).toFixed(3)
      : "—";
  const avgGpu =
    metrics.length > 0
      ? (metrics.reduce((s, m) => s + (m.gpu_memory_peak ?? 0), 0) / metrics.length).toFixed(1)
      : "—";

  const handleExport = () => {
    const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8500";
    const token = typeof window !== "undefined" ? localStorage.getItem("visualpc_token") : null;
    window.open(`${API}/metrics/export${token ? `?token=${token}` : ""}`, "_blank");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 shadow-lg shadow-primary/10">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Metrics</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Performance metrics across all GPU workloads</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 self-start"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 px-5 py-3.5 text-sm text-destructive">{error}</div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <SummaryCard icon={Activity} label="Total Records" value={metrics.length} color="#6366f1" />
        <SummaryCard icon={TrendingUp} label="Avg GPU Memory" value={`${avgGpu} MB`} color="#22d3ee" />
        <SummaryCard icon={TrendingDown} label="Avg Latency" value={`${avgLatency}s`} color="#f59e0b" />
      </div>

      {/* Metrics table */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h3 className="text-sm font-bold text-foreground">All Metrics</h3>
          {lastUpdated && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
        <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
          <table className="w-full" role="table">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border">
                <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">ID</th>
                <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Workload</th>
                <th scope="col" className="hidden px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:table-cell">Exec Time</th>
                <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">GPU Mem</th>
                <th scope="col" className="hidden px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:table-cell">Latency</th>
              </tr>
            </thead>
            <tbody>
              {loading && metrics.length === 0 ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {[...Array(5)].map((__, j) => (
                      <td key={j} className="px-6 py-3.5"><div className="h-4 w-16 animate-pulse rounded bg-secondary/50" /></td>
                    ))}
                  </tr>
                ))
              ) : metrics.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center text-sm text-muted-foreground">
                    No metrics recorded yet. Submit a job to generate metrics.
                  </td>
                </tr>
              ) : (
                metrics.map((m) => (
                  <MetricRow key={m.id} metric={m} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-card glass-card-hover flex items-center gap-5 p-6"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}15` }}>
        <Icon className="h-6 w-6" style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
      </div>
    </motion.div>
  );
}

function MetricRow({ metric }: { metric: MetricRecord }) {
  return (
    <tr className="border-b border-border/50 transition-colors hover:bg-secondary/20">
      <td className="px-6 py-3.5 font-mono text-xs text-foreground">#{metric.id}</td>
      <td className="px-6 py-3.5">
        <span className="rounded-lg bg-secondary/60 px-2.5 py-1 text-xs font-medium text-secondary-foreground capitalize">
          {metric.workload_size || "—"}
        </span>
      </td>
      <td className="hidden px-6 py-3.5 text-xs text-muted-foreground sm:table-cell">
        {metric.execution_time != null ? `${(metric.execution_time * 1000).toFixed(0)}ms` : "—"}
      </td>
      <td className="px-6 py-3.5 text-xs text-muted-foreground">
        {metric.gpu_memory_peak != null ? `${metric.gpu_memory_peak.toFixed(1)} MB` : "—"}
      </td>
      <td className="hidden px-6 py-3.5 text-xs text-muted-foreground md:table-cell">
        {metric.latency_total != null ? `${metric.latency_total.toFixed(3)}s` : "—"}
      </td>
    </tr>
  );
}
