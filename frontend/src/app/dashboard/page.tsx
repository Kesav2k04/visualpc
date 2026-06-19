"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { isAuthenticated, getUserRole } from "@/services/auth";
import { useMetrics } from "@/hooks/useMetrics";
import { Send, ListTodo, Zap, Info, Server, Activity, Rocket, X, Cpu } from "lucide-react";
import Link from "next/link";

import Navbar from "@/components/Navbar";
import SystemHealth from "@/components/SystemHealth";
import GPUChart from "@/components/GPUChart";
import LatencyChart from "@/components/LatencyChart";
import WorkersTable from "@/components/WorkersTable";
import JobsTable from "@/components/JobsTable";
import MetricsTimeline from "@/components/MetricsTimeline";
import TopologyGraph from "@/components/TopologyGraph";

export default function DashboardPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState("user");
  const { metrics, jobs, workers, health, loading, error, lastUpdated, refresh } =
    useMetrics(5000);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      setAuthed(true);
      setRole(getUserRole());
    }
  }, [router]);

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  // User role: show simplified landing
  if (role !== "admin") {
    return <UserLanding jobs={jobs} refresh={refresh} />;
  }

  // Admin role: full dashboard
  return (
    <div className="space-y-8">
      {/* Top Navbar */}
      <Navbar
        health={health}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        loading={loading}
      />

      {/* Error banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-destructive/10 px-5 py-3.5 text-sm text-destructive"
        >
          {error}
        </motion.div>
      )}

      {/* Loading skeleton */}
      {loading && metrics.length === 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card h-[130px] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Health stat cards */}
          <SystemHealth metrics={metrics} jobs={jobs} workers={workers} />

          {/* Professional Empty State Banner */}
          {metrics.length === 0 && workers.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-8 sm:p-10"
            >
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
                  <Server className="h-8 w-8 text-indigo-400" />
                </div>
                <h2 className="mb-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Waiting for Compute Nodes
                </h2>
                <p className="mb-8 max-w-2xl text-base text-slate-400 sm:text-lg">
                  Welcome to the VisualPC Distributed Cluster. The system is currently idle. To visualize real-time telemetry, execute the Edge Gateway and GPU Worker modules in your local environment.
                </p>
                
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-2 text-sm text-slate-300">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    <span>Run Master Node</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-2 text-sm text-slate-300">
                    <Server className="h-4 w-4 text-indigo-400" />
                    <span>Connect Edge Gateway</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-2 text-sm text-slate-300">
                    <Zap className="h-4 w-4 text-green-400" />
                    <span>Start GPU Worker</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-5 sm:p-6"
              style={{ minHeight: 320 }}
            >
              <GPUChart metrics={metrics} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-5 sm:p-6"
              style={{ minHeight: 320 }}
            >
              <LatencyChart metrics={metrics} />
            </motion.div>
          </div>

          {/* Topology animation */}
          <TopologyGraph />

          {/* Tables row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card overflow-hidden"
            >
              <WorkersTable workers={workers} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="glass-card overflow-hidden"
            >
              <JobsTable jobs={jobs} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card overflow-hidden lg:col-span-2 2xl:col-span-1"
            >
              <MetricsTimeline metrics={metrics} />
            </motion.div>
          </div>

          {/* Live status footer */}
          <div className="flex items-center justify-center gap-2.5 pb-6">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-xs text-muted-foreground">
              Live — auto-refreshing every 5 seconds
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/* ------ Simplified User Landing ------ */
interface UserLandingProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jobs: any[];
  refresh: () => void;
}

function UserLanding({ jobs, refresh }: UserLandingProps) {
  const [showAssist, setShowAssist] = useState(false);
  const myJobs = jobs.slice(0, 5);

  useEffect(() => {
    const hasSeen = localStorage.getItem("visualpc_assist_seen");
    if (!hasSeen) {
      setShowAssist(true);
    }
  }, []);

  const dismissAssist = () => {
    setShowAssist(false);
    localStorage.setItem("visualpc_assist_seen", "true");
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 680, margin: "0 auto" }}>
        {/* Welcome */}
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ textAlign: "center", paddingTop: 24 }}>
          <div style={{ display: "inline-flex", width: 56, height: 56, alignItems: "center", justifyContent: "center", borderRadius: 16, background: "rgba(99,102,241,0.12)", marginBottom: 16 }}>
            <Zap style={{ width: 28, height: 28, color: "#6366f1" }} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#e4e4ef", margin: 0 }}>Welcome to VisualPC</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#71728a" }}>Distributed GPU Cloud Platform</p>
        </motion.div>

        {/* Submit Job CTA */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <Link href="/submit-job" style={{ textDecoration: "none" }}>
            <div className="glass-card glass-card-hover" style={{
              padding: 32, textAlign: "center", cursor: "pointer",
              borderImage: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(34,211,238,0.3)) 1",
            }}>
              <div style={{ display: "inline-flex", width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 14, background: "linear-gradient(135deg, #6366f1, #22d3ee)", marginBottom: 12 }}>
                <Send style={{ width: 20, height: 20, color: "white" }} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#e4e4ef", margin: "0 0 6px" }}>Submit GPU Job</h2>
              <p style={{ fontSize: 13, color: "#71728a" }}>Configure and dispatch workloads to the cluster</p>
            </div>
          </Link>
        </motion.div>

        {/* My Jobs */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ListTodo size={16} style={{ color: "#6366f1" }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#e4e4ef", margin: 0 }}>My Recent Jobs</h3>
            </div>
            <Link href="/jobs" style={{ fontSize: 12, color: "#6366f1", textDecoration: "none" }}>View all</Link>
          </div>
          {myJobs.length === 0 ? (
            <div className="glass-card" style={{ padding: 32, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#71728a" }}>No jobs submitted yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {myJobs.map((j) => (
                <div key={j.job_id} className="glass-card" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontFamily: "monospace", color: "#e4e4ef" }}>{j.job_id.slice(0, 8)}...</div>
                    <div style={{ fontSize: 11, color: "#71728a" }}>{j.workload_size} · {j.priority}</div>
                  </div>
                  <span style={{
                    padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                    color: j.status === "completed" ? "#22c55e" : j.status === "queued" ? "#f59e0b" : "#6366f1",
                    background: j.status === "completed" ? "rgba(34,197,94,0.1)" : j.status === "queued" ? "rgba(245,158,11,0.1)" : "rgba(99,102,241,0.1)",
                  }}>
                    {j.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* New User Onboarding Assist */}
      {showAssist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-indigo-500/30 bg-slate-900 shadow-2xl"
          >
            {/* Background Glows */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
            
            <button 
              onClick={dismissAssist}
              className="absolute right-4 top-4 z-10 rounded-full bg-slate-800/50 p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="relative z-10 p-8">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                <Rocket className="h-8 w-8 text-indigo-400" />
              </div>
              
              <h2 className="mb-2 text-2xl font-bold tracking-tight text-white">Get Started with VisualPC</h2>
              <p className="mb-6 text-sm leading-relaxed text-slate-400">
                You are now connected to the distributed GPU cloud. Here is a quick guide to kick off your first compute workload:
              </p>

              <div className="mb-8 flex flex-col gap-4">
                <div className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-800/40 p-4">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                    <Send size={14} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200">Submit a Job</h3>
                    <p className="text-xs text-slate-400">Click the submit button to queue matrix multiplication workloads.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-800/40 p-4">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                    <Cpu size={14} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200">Execution</h3>
                    <p className="text-xs text-slate-400">The master scheduler will dispatch your job to the nearest available GPU node.</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={dismissAssist}
                className="w-full rounded-xl bg-indigo-500 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-600 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
              >
                Got it, Let's Go!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
