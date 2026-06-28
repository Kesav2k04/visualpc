"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  FlaskConical,
  X,
} from "lucide-react";
import { login } from "@/services/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemoBanner, setShowDemoBanner] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("demoBannerDismissed");
    if (!dismissed) setShowDemoBanner(true);
  }, []);

  const dismissBanner = () => {
    sessionStorage.setItem("demoBannerDismissed", "true");
    setShowDemoBanner(false);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ username, password });
      router.push("/dashboard");
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleGitHubSignIn = () => {
    signIn("github", { callbackUrl: "/dashboard" });
  };

  /* Input + icon shared styles — using inline to avoid Tailwind v4 issues */
  const inputStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: "12px",
    border: "1px solid rgba(99,102,241,0.15)",
    background: "rgba(30,31,54,0.4)",
    padding: "14px 16px 14px 48px",
    fontSize: "14px",
    color: "#e4e4ef",
    outline: "none",
    transition: "all 0.2s",
  };

  const iconStyle: React.CSSProperties = {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "18px",
    height: "18px",
    color: "#71728a",
    pointerEvents: "none",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
      {/* Background glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: "-100px", top: "25%", width: 500, height: 500, borderRadius: "50%", background: "rgba(99,102,241,0.06)", filter: "blur(150px)" }} />
        <div style={{ position: "absolute", right: "-100px", bottom: "25%", width: 500, height: 500, borderRadius: "50%", background: "rgba(34,211,238,0.04)", filter: "blur(150px)" }} />
      </div>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{ position: "relative", width: "100%", maxWidth: 420 }}
      >
        {/* ── Research Demo Notice Banner ── */}
        <AnimatePresence>
          {showDemoBanner && (
            <motion.div
              key="demo-banner"
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.4 }}
              style={{
                marginBottom: 16,
                borderRadius: 16,
                border: "1px solid rgba(245,158,11,0.25)",
                background: "rgba(245,158,11,0.06)",
                padding: "16px 18px",
                position: "relative",
                backdropFilter: "blur(8px)",
              }}
            >
              {/* Dismiss button */}
              <button
                onClick={dismissBanner}
                style={{
                  position: "absolute", top: 10, right: 10,
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(245,158,11,0.5)", padding: 4, lineHeight: 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 6,
                }}
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <FlaskConical size={15} style={{ color: "#f59e0b", flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Research Demo
                </span>
              </div>

              {/* Body */}
              <p style={{ fontSize: 12.5, color: "rgba(245,158,11,0.85)", lineHeight: 1.6, margin: 0 }}>
                This is an <strong>academic research prototype</strong>. The GPU worker runs on a local machine and the Edge node is a home Raspberry Pi — not cloud-deployed. The dashboard may show limited live data.
              </p>

              {/* Links */}
              <div style={{ marginTop: 10, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a
                  href="https://github.com/Kesav2k04/visualpc"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 11.5, color: "#f59e0b", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
                >
                  View Code & Docs →
                </a>
                <a
                  href="https://github.com/Kesav2k04/visualpc#architecture"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 11.5, color: "rgba(245,158,11,0.65)", fontWeight: 500, textDecoration: "none" }}
                >
                  Architecture Overview
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card */}
        <div className="glass-card" style={{ padding: "40px" }}>
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}
          >

            <div style={{ marginBottom: 20, display: "flex", height: 64, width: 64, alignItems: "center", justifyContent: "center", borderRadius: 16, background: "rgba(99,102,241,0.12)", boxShadow: "0 8px 32px rgba(99,102,241,0.1)" }}>
              <Zap style={{ width: 32, height: 32, color: "#6366f1" }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e4e4ef", letterSpacing: "-0.025em" }}>
              VisualPC Console
            </h1>
            <p style={{ marginTop: 6, fontSize: 14, color: "#71728a" }}>
              Sign in to the GPU Cloud Dashboard
            </p>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10, borderRadius: 12, background: "rgba(239,68,68,0.1)", padding: "12px 16px", fontSize: 14, color: "#ef4444" }}
            >
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              {error}
            </motion.div>
          )}

          {/* OAuth buttons — prominent */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: 12, borderRadius: 12, border: "1px solid rgba(99,102,241,0.15)", background: "rgba(255,255,255,0.03)", padding: "14px 16px", fontSize: 14, fontWeight: 500, color: "#e4e4ef", cursor: "pointer", transition: "all 0.2s" }}
              onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
            >
              <svg style={{ width: 20, height: 20, flexShrink: 0 }} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={handleGitHubSignIn}
              style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: 12, borderRadius: 12, border: "1px solid rgba(99,102,241,0.15)", background: "rgba(255,255,255,0.03)", padding: "14px 16px", fontSize: 14, fontWeight: 500, color: "#e4e4ef", cursor: "pointer", transition: "all 0.2s" }}
              onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
            >
              <svg style={{ width: 20, height: 20, flexShrink: 0 }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div style={{ position: "relative", marginBottom: 24 }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}>
              <div style={{ width: "100%", borderTop: "1px solid rgba(99,102,241,0.1)" }} />
            </div>
            <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
              <span style={{ background: "#12131f", padding: "0 16px", fontSize: 12, color: "#71728a" }}>
                or sign in with credentials
              </span>
            </div>
          </div>

          {/* Credentials form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label htmlFor="username" style={{ display: "block", marginBottom: 8, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#71728a" }}>
                Username
              </label>
              <div style={{ position: "relative" }}>
                <svg style={iconStyle} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" style={{ display: "block", marginBottom: 8, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#71728a" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <svg style={iconStyle} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#71728a",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 12, background: "#6366f1", padding: "14px 16px", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer", border: "none", transition: "all 0.2s", opacity: loading ? 0.5 : 1, marginTop: 4 }}
              onMouseOver={(e) => { if (!loading) { e.currentTarget.style.background = "#5558e6"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,102,241,0.3)"; } }}
              onMouseOut={(e) => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {loading ? (
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.6s linear infinite" }} />
              ) : (
                <>
                  Sign In
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </>
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "#71728a" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ fontWeight: 600, color: "#6366f1", textDecoration: "none" }}>
              Create Account
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: "rgba(113,114,138,0.6)" }}>
          VisualPC Distributed GPU Cloud Platform
        </p>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
