"use client";

import { motion } from "framer-motion";
import { RefreshCw, Wifi, WifiOff, Clock } from "lucide-react";
import type { HealthStatus } from "@/hooks/useMetrics";

interface NavbarProps {
  health: HealthStatus | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
  loading: boolean;
}

export default function Navbar({
  health,
  lastUpdated,
  onRefresh,
  loading,
}: NavbarProps) {
  const isHealthy = health?.status === "healthy";

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="glass-card relative z-10 flex items-center justify-between border-b border-border px-4 py-3 sm:px-6"
    >
      {/* Left: System status */}
      <div className="flex items-center gap-3 sm:gap-4 pl-12 lg:pl-0">
        <div className="flex items-center gap-2">
          {isHealthy ? (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
              </span>
              <Wifi className="hidden h-4 w-4 text-success sm:block" aria-hidden="true" />
              <span className="text-xs font-medium text-success">
                Online
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive glow-red" aria-hidden="true" />
              <WifiOff className="hidden h-4 w-4 text-destructive sm:block" aria-hidden="true" />
              <span className="text-xs font-medium text-destructive">
                Offline
              </span>
            </div>
          )}
        </div>

        <div className="hidden h-4 w-px bg-border sm:block" />

        <span className="hidden text-xs text-muted-foreground sm:inline">
          v{health?.version || "3.0"} · {health?.workers ?? 0}W · {health?.queued_jobs ?? 0}Q
        </span>
      </div>

      {/* Right: Last updated + refresh */}
      <div className="flex items-center gap-3 sm:gap-4">
        {lastUpdated && (
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {lastUpdated.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
        )}

        <button
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh data"
          className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-all hover:bg-primary/20 hover:text-primary disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </motion.header>
  );
}
