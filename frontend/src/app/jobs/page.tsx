"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ListTodo, RefreshCw, Filter, Plus } from "lucide-react";
import { isAuthenticated } from "@/services/auth";
import { useMetrics } from "@/hooks/useMetrics";
import JobsTable from "@/components/JobsTable";

export default function JobsPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const { jobs, loading, error, lastUpdated, refresh } = useMetrics(5000);

  useEffect(() => {
    if (!isAuthenticated()) router.replace("/login");
    else setAuthed(true);
  }, [router]);

  if (!authed) return null;

  const filtered = filter === "all"
    ? jobs
    : jobs.filter((j) => j.status === filter);

  const counts = {
    all: jobs.length,
    queued: jobs.filter((j) => j.status === "queued").length,
    running: jobs.filter((j) => j.status === "running" || j.status === "dispatched").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    failed: jobs.filter((j) => j.status === "failed").length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 shadow-lg shadow-primary/10">
            <ListTodo className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{jobs.length} total jobs in the queue</p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start">
          <button
            onClick={() => router.push("/submit-job")}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Submit Job
          </button>
          <button
            onClick={refresh}
            className="flex items-center justify-center rounded-xl bg-secondary px-3 py-2.5 text-secondary-foreground transition-all hover:bg-primary/20 hover:text-primary"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 px-5 py-3.5 text-sm text-destructive">{error}</div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        {(["all", "queued", "running", "completed", "failed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold capitalize transition-all ${
              filter === f
                ? "bg-primary/15 text-primary ring-1 ring-primary/20"
                : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <JobsTable jobs={filtered} />
      </div>

      {lastUpdated && (
        <p className="text-center text-xs text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
