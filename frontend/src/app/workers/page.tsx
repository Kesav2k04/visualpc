"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Server, RefreshCw, Wifi, WifiOff, Clock, ChevronRight } from "lucide-react";
import { isAuthenticated } from "@/services/auth";
import { useMetrics } from "@/hooks/useMetrics";
import type { WorkerRecord } from "@/hooks/useMetrics";

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 5) return "just now";
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function statusColor(status: string | null): string {
  switch (status) {
    case "ONLINE": return "#22c55e";
    case "DEGRADED": return "#f59e0b";
    case "OFFLINE": return "#ef4444";
    default: return "#71728a";
  }
}

export default function WorkersPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [selected, setSelected] = useState<WorkerRecord | null>(null);
  const { workers, loading, error, lastUpdated, refresh } = useMetrics(5000);

  useEffect(() => {
    if (!isAuthenticated()) router.replace("/login");
    else setAuthed(true);
  }, [router]);

  if (!authed) return null;

  const alive = workers.filter((w) => w.status === "ONLINE").length;
  const degraded = workers.filter((w) => w.status === "DEGRADED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", height: 48, width: 48, alignItems: "center", justifyContent: "center", borderRadius: 16, background: "rgba(34,211,238,0.12)", boxShadow: "0 4px 24px rgba(34,211,238,0.1)" }}>
            <Server style={{ width: 24, height: 24, color: "#22d3ee" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e4e4ef", margin: 0 }}>Workers</h1>
            <p style={{ marginTop: 2, fontSize: 14, color: "#71728a" }}>
              {alive} online{degraded > 0 ? ` · ${degraded} degraded` : ""} · {workers.length} total
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, background: "rgba(30,31,54,0.6)", border: "1px solid rgba(99,102,241,0.1)", padding: "10px 20px", fontSize: 13, fontWeight: 500, color: "#9899b3", cursor: "pointer", transition: "all 0.2s" }}
          onMouseOver={(e) => { e.currentTarget.style.color = "#6366f1"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; }}
          onMouseOut={(e) => { e.currentTarget.style.color = "#9899b3"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.1)"; }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && <div style={{ borderRadius: 12, background: "rgba(239,68,68,0.1)", padding: "12px 20px", fontSize: 14, color: "#ef4444" }}>{error}</div>}

      {/* Status summary pills */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "Online", count: alive, color: "#22c55e" },
          { label: "Degraded", count: degraded, color: "#f59e0b" },
          { label: "Offline", count: workers.filter((w) => w.status === "OFFLINE").length, color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 20, background: `${s.color}10`, border: `1px solid ${s.color}20`, fontSize: 12, fontWeight: 600, color: s.color }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
            {s.count} {s.label}
          </div>
        ))}
      </div>

      {/* Worker cards */}
      {loading && workers.length === 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card" style={{ height: 220, opacity: 0.3 }} />
          ))}
        </div>
      ) : workers.length === 0 ? (
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "60px 20px" }}>
          <Server style={{ width: 48, height: 48, color: "rgba(113,114,138,0.3)" }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: "#71728a" }}>No workers registered</p>
          <p style={{ fontSize: 12, color: "rgba(113,114,138,0.6)" }}>Run POST /register-worker to register a GPU node</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          <AnimatePresence>
            {workers.map((w, i) => (
              <WorkerCard key={w.id} worker={w} delay={i * 0.05} onSelect={() => setSelected(w)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {lastUpdated && (
        <p style={{ textAlign: "center", fontSize: 12, color: "rgba(113,114,138,0.6)" }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", padding: 16 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card"
              style={{ maxWidth: 440, width: "100%", padding: 32 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e4e4ef", margin: 0 }}>{selected.name}</h2>
                <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: statusColor(selected.status), background: `${statusColor(selected.status)}15`, border: `1px solid ${statusColor(selected.status)}30` }}>
                  {selected.status}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <DetailRow label="Device" value={selected.device || "—"} />
                <DetailRow label="CUDA Version" value={selected.cuda_version || "—"} />
                <DetailRow label="GPU Memory" value={selected.gpu_memory_total ? `${selected.gpu_memory_total} MB` : "—"} />
                <DetailRow label="IP Address" value={selected.node_ip || "—"} />
                <DetailRow label="Role" value={selected.role || "worker"} />
                <DetailRow label="Last Heartbeat" value={timeAgo(selected.last_heartbeat)} />
                <DetailRow label="Reachable" value={selected.last_reach_success ? "Yes" : "No"} />
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ marginTop: 24, width: "100%", padding: "10px 20px", borderRadius: 10, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#6366f1", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WorkerCard({ worker, delay, onSelect }: { worker: WorkerRecord; delay: number; onSelect: () => void }) {
  const color = statusColor(worker.status);
  const heartbeat = worker.last_heartbeat;
  const reachable = worker.last_reach_success === true;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card glass-card-hover"
      onClick={onSelect}
      style={{ padding: 24, cursor: "pointer" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {reachable ? (
            <div style={{ display: "flex", width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 10, background: "rgba(34,197,94,0.1)" }}>
              <Wifi size={16} style={{ color: "#22c55e" }} />
            </div>
          ) : (
            <div style={{ display: "flex", width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 10, background: "rgba(239,68,68,0.1)" }}>
              <WifiOff size={16} style={{ color: "#ef4444" }} />
            </div>
          )}
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#e4e4ef", margin: 0 }}>{worker.name}</h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: "uppercase", color, background: `${color}12`, border: `1px solid ${color}25` }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
            {worker.status}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <CardDetail label="Device" value={worker.device || "—"} />
        <CardDetail label="CUDA" value={worker.cuda_version || "—"} />
        <CardDetail label="GPU Memory" value={worker.gpu_memory_total ? `${worker.gpu_memory_total} MB` : "—"} />
        <CardDetail label="IP" value={worker.node_ip || "—"} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(99,102,241,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#71728a" }}>
          <Clock size={12} />
          {timeAgo(heartbeat)}
        </div>
        <ChevronRight size={14} style={{ color: "#71728a" }} />
      </div>
    </motion.div>
  );
}

function CardDetail({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
      <span style={{ color: "#71728a" }}>{label}</span>
      <span style={{ fontFamily: "monospace", color: "#e4e4ef" }}>{value}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(99,102,241,0.04)", fontSize: 13 }}>
      <span style={{ color: "#71728a" }}>{label}</span>
      <span style={{ fontFamily: "monospace", color: "#e4e4ef", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
