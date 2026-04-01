"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/services/api";

/* ===== Type definitions ===== */

export interface MetricRecord {
  id: number;
  job_id: number;
  execution_time: number | null;
  gpu_memory_peak: number | null;
  latency_total: number | null;
  workload_size: string | null;
  timestamp: string | null;
}

export interface JobRecord {
  id: number;
  job_id: string;
  job_type: string | null;
  workload_size: string | null;
  priority: string | null;
  status: string | null;
  submitted_by: string | null;
  created_at: string | null;
}

export interface WorkerRecord {
  id: number;
  name: string;
  device: string | null;
  status: string | null;
  cuda_version: string | null;
  gpu_memory_total: number | null;
  node_ip: string | null;
  role: string | null;
  last_heartbeat: string | null;
  last_reach_success: boolean | null;
  registered_at: string | null;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  workers: number;
  jobs: number;
  metrics: number;
  queued_jobs: number;
}

export interface DashboardData {
  metrics: MetricRecord[];
  jobs: JobRecord[];
  workers: WorkerRecord[];
  health: HealthStatus | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

/* ===== Helpers ===== */

function extract(res: { data: unknown }): unknown[] {
  const d = res.data;
  if (d && typeof d === "object" && "data" in d && Array.isArray((d as Record<string, unknown>).data)) {
    return (d as Record<string, unknown>).data as unknown[];
  }
  if (Array.isArray(d)) return d;
  return [];
}

/* ===== Hook with AbortController + exponential backoff ===== */

const BASE_INTERVAL = 5000;
const MAX_INTERVAL = 60000;

export function useMetrics(intervalMs = BASE_INTERVAL): DashboardData {
  const [metrics, setMetrics] = useState<MetricRecord[]>([]);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [workers, setWorkers] = useState<WorkerRecord[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const consecutiveFailures = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAll = useCallback(async () => {
    // Cancel any in-flight requests
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const opts = { signal: controller.signal };
      const [metricsRes, jobsRes, workersRes, healthRes] = await Promise.all([
        api.get("/metrics", opts),
        api.get("/jobs", opts),
        api.get("/workers", opts),
        api.get("/health", opts),
      ]);

      setMetrics(extract(metricsRes) as MetricRecord[]);
      setJobs(extract(jobsRes) as JobRecord[]);
      setWorkers(extract(workersRes) as WorkerRecord[]);
      setHealth(healthRes.data as HealthStatus);
      setError(null);
      setLastUpdated(new Date());
      consecutiveFailures.current = 0;
    } catch (err: unknown) {
      // Ignore aborted requests
      if (err instanceof Error && err.name === "CanceledError") return;
      consecutiveFailures.current += 1;
      const message =
        err instanceof Error ? err.message : "Failed to fetch data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();

    const tick = () => {
      // Exponential backoff: double interval per failure, cap at MAX_INTERVAL
      const backoff = Math.min(
        intervalMs * Math.pow(2, consecutiveFailures.current),
        MAX_INTERVAL
      );
      timerRef.current = setTimeout(async () => {
        await fetchAll();
        tick();
      }, backoff);
    };

    tick();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchAll, intervalMs]);

  return { metrics, jobs, workers, health, loading, error, lastUpdated, refresh: fetchAll };
}
