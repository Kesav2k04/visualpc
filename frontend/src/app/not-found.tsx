"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Terminal, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 glass-card flex max-w-md flex-col items-center p-10"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/10 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
          <Terminal className="h-10 w-10 text-indigo-400" />
        </div>
        <h1 className="mb-2 text-7xl font-bold tracking-tighter text-white">404</h1>
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-slate-200">
          Node Unreachable
        </h2>
        <p className="mb-8 text-sm text-slate-400">
          The requested endpoint or resource does not exist in the active cluster topology. Please verify your destination.
        </p>

        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-600 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
