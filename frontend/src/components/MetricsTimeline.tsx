"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import type { MetricRecord } from "@/hooks/useMetrics";

interface MetricsTimelineProps {
  metrics: MetricRecord[];
}

export default function MetricsTimeline({ metrics }: MetricsTimelineProps) {
  const recent = metrics.slice(-10).reverse();

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      className="glass-card overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-semibold text-foreground">
            Metrics Timeline
          </h3>
        </div>
        <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
          Latest {recent.length}
        </span>
      </div>

      <div className="divide-y divide-border/40">
        {recent.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 * i }}
            className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-secondary/20"
          >
            {/* Timeline dot */}
            <div className="flex flex-col items-center">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  i === 0 ? "bg-success glow-green" : "bg-muted-foreground/40"
                }`}
              />
              {i < recent.length - 1 && (
                <span className="mt-1 h-6 w-px bg-border" />
              )}
            </div>

            {/* Content */}
            <div className="flex flex-1 items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">
                  {m.workload_size ?? "unknown"} workload
                </p>
                <p className="text-[11px] text-muted-foreground">
                  GPU: {m.gpu_memory_peak?.toFixed(1) ?? "—"} MB ·
                  Latency: {m.latency_total?.toFixed(3) ?? "—"}s
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-muted-foreground">
                  {m.timestamp
                    ? new Date(m.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
        {recent.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">
            No metrics recorded yet
          </p>
        )}
      </div>
    </motion.div>
  );
}
