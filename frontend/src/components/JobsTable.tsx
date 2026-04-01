"use client";

import { motion } from "framer-motion";
import { ListTodo } from "lucide-react";
import type { JobRecord } from "@/hooks/useMetrics";

interface JobsTableProps {
  jobs: JobRecord[];
}

const statusStyles: Record<string, string> = {
  completed: "bg-success/10 text-success",
  queued: "bg-warning/10 text-warning",
  running: "bg-accent/10 text-accent",
  dispatched: "bg-accent/10 text-accent",
  failed: "bg-destructive/10 text-destructive",
};

const priorityStyles: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-success/10 text-success",
};

/* Skeleton row for loading state */
function SkeletonRow() {
  return (
    <tr className="border-b border-border/50">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3 sm:px-6">
          <div className="h-4 w-16 animate-pulse rounded bg-secondary/50" />
        </td>
      ))}
    </tr>
  );
}

export default function JobsTable({ jobs }: JobsTableProps) {
  const isLoading = false; // Can be passed as prop for initial load

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.7, duration: 0.5 }}
      className="glass-card overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-accent" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-foreground">Job Queue</h3>
        </div>
        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
          {jobs.length} jobs
        </span>
      </div>

      <div className="max-h-[340px] overflow-y-auto overflow-x-auto">
        <table className="w-full" role="table">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border">
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">
                Job ID
              </th>
              <th scope="col" className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell sm:px-6">
                Type
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">
                Workload
              </th>
              <th scope="col" className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:table-cell sm:px-6">
                Priority
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">
                Status
              </th>
              <th scope="col" className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell sm:px-6">
                Submitted By
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && jobs.length === 0 ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : (
              <>
                {jobs.map((j, i) => (
                  <motion.tr
                    key={j.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * i }}
                    className="border-b border-border/50 transition-colors hover:bg-secondary/30"
                  >
                    <td className="px-4 py-3 sm:px-6">
                      <span className="font-mono text-xs text-foreground" title={j.job_id}>
                        {j.job_id.length > 12
                          ? `${j.job_id.slice(0, 12)}…`
                          : j.job_id}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell sm:px-6">
                      {j.job_type || "—"}
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground capitalize">
                        {j.workload_size || "—"}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell sm:px-6">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          priorityStyles[j.priority || ""] || "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {j.priority || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          statusStyles[j.status || ""] || "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {j.status || "—"}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell sm:px-6">
                      {j.submitted_by || "—"}
                    </td>
                  </motion.tr>
                ))}
                {jobs.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-sm text-muted-foreground"
                    >
                      No jobs found
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
