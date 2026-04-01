"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Server,
  ListTodo,
  Send,
  Network,
  Shield,
  LogOut,
  Zap,
  Menu,
  X,
  User,
} from "lucide-react";
import { logout, getUserRole } from "@/services/auth";

const ADMIN_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/metrics", label: "Metrics", icon: BarChart3 },
  { href: "/workers", label: "Workers", icon: Server },
  { href: "/jobs", label: "Jobs", icon: ListTodo },
  { href: "/submit-job", label: "Submit Job", icon: Send },
  { href: "/architecture", label: "Architecture", icon: Network },
  { href: "/admin", label: "Admin", icon: Shield },
];

const USER_NAV = [
  { href: "/submit-job", label: "Submit Job", icon: Send },
  { href: "/jobs", label: "My Jobs", icon: ListTodo },
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("user");

  useEffect(() => {
    setRole(getUserRole());
  }, []);

  const navItems = role === "admin" ? ADMIN_NAV : USER_NAV;

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 60,
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "rgba(30,31,54,0.95)",
          border: "1px solid rgba(99,102,241,0.15)",
          color: "#e4e4ef",
          cursor: "pointer",
        }}
        className="sidebar-toggle"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 39,
            background: "rgba(0,0,0,0.5)",
          }}
          className="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 260,
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          background: "rgba(12,13,31,0.97)",
          borderRight: "1px solid rgba(99,102,241,0.08)",
          transition: "transform 0.3s ease",
        }}
        className={`sidebar-panel ${open ? "sidebar-open" : ""}`}
      >
        {/* Logo */}
        <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <div style={{
              display: "flex", width: 36, height: 36, alignItems: "center", justifyContent: "center",
              borderRadius: 10, background: "rgba(99,102,241,0.12)",
            }}>
              <Zap style={{ width: 20, height: 20, color: "#6366f1" }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#e4e4ef", letterSpacing: "-0.025em" }}>VisualPC</div>
              <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71728a" }}>GPU CLOUD</div>
            </div>
          </Link>
        </div>

        {/* Role badge */}
        <div style={{ padding: "12px 20px 4px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 8,
            background: role === "admin" ? "rgba(99,102,241,0.1)" : "rgba(34,211,238,0.1)",
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            color: role === "admin" ? "#6366f1" : "#22d3ee",
          }}>
            <User size={10} />
            {role === "admin" ? "Admin" : "User"}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "12px 12px", display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#6366f1" : "#9899b3",
                  background: active ? "rgba(99,102,241,0.08)" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
                onMouseOver={(e) => { if (!active) e.currentTarget.style.background = "rgba(99,102,241,0.04)"; }}
                onMouseOut={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: "14px 14px 18px",
            borderTop: "1px solid rgba(99,102,241,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* User badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 8px",
              borderRadius: 8,
              background: "rgba(30,31,54,0.6)",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                background: "rgba(99,102,241,0.15)",
                color: "#6366f1",
              }}
            >
              N
            </div>

            <div style={{ fontSize: 12, color: "#9899b3" }}>
              {role === "admin" ? "Administrator" : "User"}
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "9px 10px",
              borderRadius: 10,
              fontSize: 13,
              color: "#71728a",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.background = "rgba(239,68,68,0.06)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = "#71728a";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 1023px) {
          .sidebar-toggle { display: flex !important; }
          .sidebar-panel { transform: translateX(-100%); }
          .sidebar-panel.sidebar-open { transform: translateX(0); }
        }
        @media (min-width: 1024px) {
          .sidebar-overlay { display: none !important; }
        }
      `}</style>
    </>
  );
}
