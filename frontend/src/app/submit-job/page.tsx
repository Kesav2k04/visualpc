"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Send, Cpu, Zap, ArrowLeft, CheckCircle } from "lucide-react";
import { isAuthenticated } from "@/services/auth";
import api from "@/services/api";

export default function SubmitJobPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  const [workload, setWorkload] = useState("small");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ job_id: string; status: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      setAuthed(true);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await api.post("/jobs", {
        workload_size: workload,
        priority,
        job_type: "gpu_compute",
      });
      setResult({
        job_id: res.data?.job?.job_id ?? "unknown",
        status: res.data?.status ?? "queued",
      });
    } catch {
      setError("Failed to submit job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  const workloads = [
    { value: "small", label: "Small", desc: "256 × 256 matrix", mem: "~10 MB", emoji: "🟢", color: "#22c55e" },
    { value: "medium", label: "Medium", desc: "1024 × 1024 matrix", mem: "~100 MB", emoji: "🟡", color: "#f59e0b" },
    { value: "large", label: "Large", desc: "4096 × 4096 matrix", mem: "~1 GB", emoji: "🔴", color: "#ef4444" },
  ];

  const priorities = [
    { value: "high", label: "High", desc: "Processed first", color: "#ef4444", bg: "bg-destructive/8" },
    { value: "medium", label: "Medium", desc: "Standard queue", color: "#f59e0b", bg: "bg-warning/8" },
    { value: "low", label: "Low", desc: "Best effort", color: "#22c55e", bg: "bg-success/8" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 768 }}>
      {/* Header */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 shadow-lg shadow-primary/10">
            <Send className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Submit GPU Job</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Configure and dispatch workloads to the GPU compute cluster
            </p>
          </div>
        </div>
      </motion.div>

      {/* Success */}
      {result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card flex items-center gap-5 p-6"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success/15">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Job Submitted Successfully</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Job ID: <span className="font-mono text-foreground">{result.job_id}</span> · Status: <span className="text-success">{result.status}</span>
            </p>
          </div>
          <Link
            href="/jobs"
            className="shrink-0 rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-all"
          >
            View Jobs →
          </Link>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl bg-destructive/10 px-5 py-3.5 text-sm text-destructive"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        {/* Workload selection */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 sm:p-8"
        >
          <h2 className="mb-6 flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-foreground">
            <Cpu className="h-5 w-5 text-primary" /> Workload Size
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {workloads.map((w) => (
              <button
                key={w.value}
                type="button"
                onClick={() => setWorkload(w.value)}
                className={`group rounded-xl border-2 p-5 text-left transition-all ${
                  workload === w.value
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border/50 hover:border-border hover:bg-secondary/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{w.emoji}</span>
                  {workload === w.value && (
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">Selected</span>
                  )}
                </div>
                <p className="text-base font-bold text-foreground">{w.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{w.desc}</p>
                <p className="mt-0.5 text-[11px] font-mono text-muted-foreground/70">{w.mem}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Priority selection */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 sm:p-8"
        >
          <h2 className="mb-6 flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-foreground">
            <Zap className="h-5 w-5 text-warning" /> Priority Level
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {priorities.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={`rounded-xl border-2 p-5 text-left transition-all ${
                  priority === p.value
                    ? "border-current shadow-lg"
                    : "border-border/50 hover:border-border hover:bg-secondary/30 opacity-60 hover:opacity-100"
                } ${p.bg}`}
                style={priority === p.value ? { borderColor: p.color, boxShadow: `0 4px 20px ${p.color}20` } : {}}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-base font-bold text-foreground">{p.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Submit */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ marginTop: 8 }}
        >
          <button
            type="submit"
            disabled={loading}
            className="group flex items-center gap-3 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <Send className="h-5 w-5" />
                Submit Job to Cluster
              </>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
}
