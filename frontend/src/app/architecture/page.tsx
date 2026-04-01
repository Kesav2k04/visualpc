"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, Network } from "lucide-react";
import { isAuthenticated } from "@/services/auth";

/* ─── Architecture Diagram Data ─── */

interface NodeDef {
  id: string;
  label: string;
  sub: string;
  emoji: string;
  cx: number;
  cy: number;
  color: string;
  glow: string;
}

const NODES: NodeDef[] = [
  { id: "edge",      label: "Edge Gateway",   sub: "Raspberry Pi · IoT",     emoji: "📡", cx: 150,  cy: 80,   color: "#22c55e", glow: "0 0 30px rgba(34,197,94,0.3)" },
  { id: "master",    label: "Master Node",    sub: "Scheduler · Port 9000",  emoji: "🖥️",  cx: 500,  cy: 80,   color: "#6366f1", glow: "0 0 30px rgba(99,102,241,0.3)" },
  { id: "gpu",       label: "GPU Worker",     sub: "RTX 4060 · CUDA 12.x",  emoji: "⚡",  cx: 850,  cy: 80,   color: "#f59e0b", glow: "0 0 30px rgba(245,158,11,0.3)" },
  { id: "monitor",   label: "Monitoring API", sub: "FastAPI · Port 8500",    emoji: "📊", cx: 500,  cy: 320,  color: "#22d3ee", glow: "0 0 30px rgba(34,211,238,0.3)" },
  { id: "db",        label: "PostgreSQL",     sub: "Metrics Database",       emoji: "🗄️",  cx: 150,  cy: 320,  color: "#a855f7", glow: "0 0 30px rgba(168,85,247,0.3)" },
  { id: "dashboard", label: "Dashboard",      sub: "Next.js · Port 3000",    emoji: "🖥️",  cx: 850,  cy: 320,  color: "#ec4899", glow: "0 0 30px rgba(236,72,153,0.3)" },
];

interface EdgeDef { from: string; to: string; label: string; }

const EDGES: EdgeDef[] = [
  { from: "edge",      to: "master",    label: "POST /receive-job" },
  { from: "master",    to: "gpu",       label: "Execute Workload" },
  { from: "gpu",       to: "monitor",   label: "Metrics Export" },
  { from: "monitor",   to: "db",        label: "SQLAlchemy ORM" },
  { from: "dashboard", to: "monitor",   label: "REST API + JWT" },
  { from: "master",    to: "monitor",   label: "Job Status" },
];

const NW = 220;
const NH = 100;

function getAnchor(n: NodeDef) {
  return { x: n.cx, y: n.cy };
}

export default function ArchitecturePage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) router.replace("/login");
    else setAuthed(true);
  }, [router]);

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]));

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <Link href="/dashboard" className="mb-4 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 shadow-lg shadow-primary/10">
            <Network className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Architecture</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">VisualPC Distributed Cloud-Edge GPU Computing Platform</p>
          </div>
        </div>
      </motion.div>

      {/* Diagram */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="glass-card overflow-hidden p-6 sm:p-8 lg:p-10"
      >
        <div className="overflow-x-auto">
          <svg
            viewBox="0 0 1000 420"
            preserveAspectRatio="xMidYMid meet"
            className="mx-auto w-full"
            style={{ minWidth: 700, maxHeight: 500 }}
          >
            <defs>
              <linearGradient id="edgeLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.7} />
              </linearGradient>
              <filter id="nodeGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Edges */}
            {EDGES.map((e, i) => {
              const from = getAnchor(nodeMap[e.from]);
              const to = getAnchor(nodeMap[e.to]);
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2;
              const angle = Math.atan2(to.y - from.y, to.x - from.x);
              const labelOffset = 16;
              const lx = mx + Math.sin(angle) * labelOffset;
              const ly = my - Math.cos(angle) * labelOffset;
              return (
                <g key={`edge-${i}`}>
                  {/* Background line */}
                  <motion.line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke="#1e1f36" strokeWidth={2.5}
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ delay: 0.3 + 0.12 * i, duration: 0.7 }}
                  />
                  {/* Gradient dashed line */}
                  <motion.line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke="url(#edgeLine)" strokeWidth={2} strokeDasharray="8 5"
                    initial={{ opacity: 0 }} animate={{ opacity: 0.7 }}
                    transition={{ delay: 0.6 + 0.12 * i }}
                  />
                  {/* Label background pill */}
                  <rect
                    x={lx - 65} y={ly - 12}
                    width={130} height={24} rx={12}
                    fill="#0a0b14" fillOpacity={0.95}
                    stroke="#1e1f36" strokeWidth={1}
                  />
                  {/* Label text */}
                  <text
                    x={lx} y={ly + 4}
                    textAnchor="middle" fill="#a5a6c4"
                    fontSize={10} fontFamily="system-ui, sans-serif" fontWeight={500}
                  >
                    {e.label}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {NODES.map((n, i) => {
              const isHov = hoveredNode === n.id;
              const x = n.cx - NW / 2;
              const y = n.cy - NH / 2;
              return (
                <motion.g
                  key={n.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i, duration: 0.6 }}
                  onMouseEnter={() => setHoveredNode(n.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Glow behind card on hover */}
                  {isHov && (
                    <rect
                      x={x - 4} y={y - 4}
                      width={NW + 8} height={NH + 8}
                      rx={20} fill="none"
                      stroke={n.color} strokeWidth={1.5}
                      opacity={0.4}
                      filter="url(#nodeGlow)"
                    />
                  )}
                  {/* Node card */}
                  <rect
                    x={x} y={y} width={NW} height={NH} rx={16}
                    fill="#12131f" fillOpacity={isHov ? 0.98 : 0.85}
                    stroke={isHov ? n.color : "#1e1f36"}
                    strokeWidth={isHov ? 2 : 1}
                  />
                  {/* Emoji icon */}
                  <text x={x + 20} y={y + 42} fontSize={24}>{n.emoji}</text>
                  {/* Label */}
                  <text x={x + 54} y={y + 38} fill="#e4e4ef" fontSize={14} fontWeight={700} fontFamily="system-ui, sans-serif">
                    {n.label}
                  </text>
                  {/* Subtitle */}
                  <text x={x + 54} y={y + 58} fill="#71728a" fontSize={11} fontFamily="system-ui, sans-serif">
                    {n.sub}
                  </text>
                  {/* Status dot */}
                  <circle cx={x + NW - 16} cy={y + 16} r={5} fill={n.color} opacity={isHov ? 1 : 0.7} />
                </motion.g>
              );
            })}

            {/* Directional arrows — subtle triangles */}
            {EDGES.map((e, i) => {
              const from = getAnchor(nodeMap[e.from]);
              const to = getAnchor(nodeMap[e.to]);
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const ux = dx / len;
              const uy = dy / len;
              // Arrow at 65% from start
              const ax = from.x + dx * 0.65;
              const ay = from.y + dy * 0.65;
              const sz = 6;
              return (
                <motion.polygon
                  key={`arr-${i}`}
                  points={`${ax + ux * sz},${ay + uy * sz} ${ax - uy * sz * 0.6},${ay + ux * sz * 0.6} ${ax + uy * sz * 0.6},${ay - ux * sz * 0.6}`}
                  fill="#6366f1"
                  opacity={0.5}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 0.8 + 0.1 * i }}
                />
              );
            })}
          </svg>
        </div>
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex flex-wrap justify-center gap-3"
      >
        {NODES.map((n) => (
          <div
            key={n.id}
            className="flex items-center gap-2.5 rounded-xl bg-secondary/40 px-4 py-2 border border-border/30"
          >
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: n.color }} />
            <span className="text-xs font-medium text-muted-foreground">{n.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Data flow description */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="glass-card p-6 sm:p-8"
      >
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">
          Data Flow Pipeline
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { step: "1", title: "Edge Ingestion", desc: "Raspberry Pi sends compute jobs via POST /receive-job to the Master Node." },
            { step: "2", title: "Job Scheduling", desc: "Master Node schedules and dispatches workloads to GPU Workers based on priority." },
            { step: "3", title: "GPU Execution", desc: "GPU Worker uses CUDA/PyTorch to run matrix operations and AI workloads." },
            { step: "4", title: "Metrics Collection", desc: "Execution results and GPU metrics are sent to the Monitoring API." },
            { step: "5", title: "Data Persistence", desc: "Metrics and job records are stored in PostgreSQL via SQLAlchemy ORM." },
            { step: "6", title: "Dashboard Rendering", desc: "Next.js dashboard fetches data via JWT-authenticated REST API calls." },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
