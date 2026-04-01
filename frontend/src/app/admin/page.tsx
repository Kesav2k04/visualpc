"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield,
  Server,
  Activity,
  RefreshCw,
  Database,
  AlertTriangle,
} from "lucide-react";
import { isAuthenticated } from "@/services/auth";
import { useMetrics } from "@/hooks/useMetrics";

export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const { workers, jobs, metrics, health, loading, refresh } = useMetrics(5000);

  useEffect(() => {
    if (!isAuthenticated()) router.replace("/login");
    else setAuthed(true);
  }, [router]);

  if (!authed) return null;

  const queued = jobs.filter((j) => j.status === "queued").length;
  const running = jobs.filter((j) => j.status === "running" || j.status === "dispatched").length;
  const failed = jobs.filter((j) => j.status === "failed").length;
  const activeWorkers = workers.filter((w) => w.status?.toLowerCase() === "online").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 shadow-lg shadow-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">System overview and administration</p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-medium text-secondary-foreground transition-all hover:bg-primary/20 hover:text-primary self-start"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* System health panel */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Database} label="DB Status" value={health?.status === "healthy" ? "Healthy" : "Offline"} color={health?.status === "healthy" ? "#22c55e" : "#ef4444"} />
        <StatCard icon={Server} label="Workers" value={`${activeWorkers} / ${workers.length}`} color="#22d3ee" />
        <StatCard icon={Activity} label="Queue" value={`${queued} queued · ${running} running`} color="#f59e0b" />
        <StatCard icon={AlertTriangle} label="Failed Jobs" value={failed} color={failed > 0 ? "#ef4444" : "#22c55e"} />
      </div>

      {/* Workers detail */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card overflow-hidden"
      >
        <div className="flex items-center gap-3 border-b border-border px-6 py-5">
          <Server className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-bold text-foreground">Worker Management</h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
          <table className="w-full" role="table">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border">
                <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Name</th>
                <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                <th scope="col" className="hidden px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:table-cell">Device</th>
                <th scope="col" className="hidden px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:table-cell">CUDA</th>
                <th scope="col" className="hidden px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground lg:table-cell">GPU Memory</th>
                <th scope="col" className="hidden px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground lg:table-cell">IP</th>
              </tr>
            </thead>
            <tbody>
              {workers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No workers registered
                  </td>
                </tr>
              ) : (
                workers.map((w) => (
                  <tr key={w.id} className="border-b border-border/50 transition-colors hover:bg-secondary/20">
                    <td className="px-6 py-3.5 text-sm font-medium text-foreground">{w.name}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${w.status?.toLowerCase() === "online"
                          ? "bg-green-500/10 text-green-400"
                          : w.status?.toLowerCase() === "degraded"
                            ? "bg-yellow-500/10 text-yellow-400"
                            : "bg-red-500/10 text-red-400"
                          }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${w.status?.toLowerCase() === "online"
                            ? "bg-green-400"
                            : w.status?.toLowerCase() === "degraded"
                              ? "bg-yellow-400"
                              : "bg-red-400"
                            }`}
                        />
                        {w.status}
                      </span>
                    </td>
                    <td className="hidden px-6 py-3.5 text-xs text-muted-foreground sm:table-cell">{w.device || "—"}</td>
                    <td className="hidden px-6 py-3.5 text-xs text-muted-foreground md:table-cell">{w.cuda_version || "—"}</td>
                    <td className="hidden px-6 py-3.5 text-xs text-muted-foreground lg:table-cell">{w.gpu_memory_total ? `${w.gpu_memory_total} MB` : "—"}</td>
                    <td className="hidden px-6 py-3.5 font-mono text-xs text-muted-foreground lg:table-cell">{w.node_ip || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* System metrics summary */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 sm:p-8"
      >
        <h3 className="text-sm font-bold text-foreground mb-5">System Metrics Summary</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MiniStat label="Total Metrics" value={health?.metrics ?? metrics.length} />
          <MiniStat label="Total Jobs" value={health?.jobs ?? jobs.length} />
          <MiniStat label="Total Workers" value={health?.workers ?? workers.length} />
          <MiniStat label="Queued Jobs" value={health?.queued_jobs ?? queued} />
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-card glass-card-hover p-6"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground mt-0.5">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-secondary/40 p-4 text-center border border-border/20">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
