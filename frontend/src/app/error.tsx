"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Application Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-red-500/10 blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 glass-card flex max-w-md flex-col items-center p-10 border-red-500/20"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="mb-3 text-2xl font-bold tracking-tight text-white">
          System Fault Detected
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          A critical rendering error occurred in the dashboard UI. The cluster connection may have been interrupted.
        </p>

        <div className="mb-8 w-full rounded-lg bg-black/40 p-4 text-left border border-white/5 overflow-hidden">
          <code className="text-xs text-red-400 break-words font-mono">
            {error.message || "Unknown invariant violation"}
          </code>
        </div>

        <button
          onClick={() => reset()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-700 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-slate-700"
        >
          <RefreshCcw className="h-4 w-4" />
          Reboot Interface
        </button>
      </motion.div>
    </div>
  );
}
