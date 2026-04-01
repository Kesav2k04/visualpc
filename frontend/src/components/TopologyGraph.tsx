"use client";

import { motion } from "framer-motion";

/**
 * Animated topology diagram: Edge Gateway → Master Node → GPU Worker
 * CSS-animated arrows show job dispatch flow.
 */
export default function TopologyGraph() {
  const nodes = [
    { id: "edge", label: "Edge Gateway", sub: "Raspberry Pi", color: "#f59e0b", x: 60, y: 52 },
    { id: "master", label: "Master Node", sub: "Scheduler", color: "#6366f1", x: 270, y: 52 },
    { id: "worker", label: "GPU Worker", sub: "CUDA Runtime", color: "#22c55e", x: 480, y: 52 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card"
      style={{ padding: 24 }}
    >
      <h3 style={{ fontSize: 13, fontWeight: 700, color: "#e4e4ef", margin: "0 0 16px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        System Topology
      </h3>
      <div style={{ position: "relative", width: "100%", height: 130, overflow: "hidden" }}>
        <svg viewBox="0 0 620 120" style={{ width: "100%", height: "100%" }}>
          <defs>
            <marker id="arrowHead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#6366f1" />
            </marker>
          </defs>

          {/* Animated connection lines */}
          <line x1="155" y1="52" x2="250" y2="52" stroke="rgba(99,102,241,0.25)" strokeWidth="2" markerEnd="url(#arrowHead)">
            <animate attributeName="stroke-opacity" values="0.15;0.6;0.15" dur="2s" repeatCount="indefinite" />
          </line>
          <line x1="365" y1="52" x2="460" y2="52" stroke="rgba(99,102,241,0.25)" strokeWidth="2" markerEnd="url(#arrowHead)">
            <animate attributeName="stroke-opacity" values="0.15;0.6;0.15" dur="2s" begin="0.7s" repeatCount="indefinite" />
          </line>

          {/* Edge labels */}
          <text x="200" y="42" textAnchor="middle" fontSize="9" fill="#71728a">POST /compute</text>
          <text x="410" y="42" textAnchor="middle" fontSize="9" fill="#71728a">DISPATCH</text>

          {/* Animated data dots */}
          <circle r="3" fill="#6366f1">
            <animateMotion dur="2s" repeatCount="indefinite" path="M155,52 L250,52" />
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle r="3" fill="#22c55e">
            <animateMotion dur="2s" repeatCount="indefinite" begin="0.7s" path="M365,52 L460,52" />
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="0.7s" />
          </circle>

          {/* Nodes */}
          {nodes.map((n) => (
            <g key={n.id}>
              <rect
                x={n.x} y={n.y - 30} width={100} height={60} rx="12"
                fill="rgba(30,31,54,0.7)" stroke={`${n.color}40`} strokeWidth="1.5"
              />
              <circle cx={n.x + 10} cy={n.y - 10} r="4" fill={n.color} />
              <text x={n.x + 53} y={n.y - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="#e4e4ef">
                {n.label}
              </text>
              <text x={n.x + 50} y={n.y + 10} textAnchor="middle" fontSize="9" fill="#71728a">
                {n.sub}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </motion.div>
  );
}
