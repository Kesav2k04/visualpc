"use client";

import { motion } from "framer-motion";
import { Server, Wifi, WifiOff, Cpu, HardDrive } from "lucide-react";
import type { WorkerRecord } from "@/hooks/useMetrics";

interface WorkersTableProps {
  workers: WorkerRecord[];
}

export default function WorkersTable({ workers }: WorkersTableProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="glass-card overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Worker Nodes
          </h3>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {workers.length} nodes
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">
                Name
              </th>
              <th className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell sm:px-6">
                Device
              </th>
              <th className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:table-cell sm:px-6">
                CUDA / Memory
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">
                Status
              </th>
              <th className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell sm:px-6">
                IP
              </th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w, i) => (
              <motion.tr
                key={w.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="border-b border-border/50 transition-colors hover:bg-secondary/30"
              >
                <td className="px-4 py-3 sm:px-6">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                      <Server className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {w.name}
                    </span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell sm:px-6">
                  {w.device || "—"}
                </td>
                <td className="hidden px-4 py-3 md:table-cell sm:px-6">
                  <div className="flex flex-col gap-0.5">
                    {w.cuda_version && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Cpu className="h-3 w-3" /> CUDA {w.cuda_version}
                      </span>
                    )}
                    {w.gpu_memory_total && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <HardDrive className="h-3 w-3" />{" "}
                        {w.gpu_memory_total.toFixed(0)} MB
                      </span>
                    )}
                    {!w.cuda_version && !w.gpu_memory_total && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 sm:px-6">
                  {(w.status ?? "").toLowerCase() === "online" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                      <Wifi className="h-3 w-3" />
                      Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                      <WifiOff className="h-3 w-3" />
                      Offline
                    </span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-xs font-mono text-muted-foreground lg:table-cell sm:px-6">
                  {w.node_ip || "—"}
                </td>
              </motion.tr>
            ))}
            {workers.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-muted-foreground"
                >
                  No workers registered
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
