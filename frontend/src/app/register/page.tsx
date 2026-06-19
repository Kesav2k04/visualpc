"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, ArrowRight, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8500";
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.detail?.error?.message || data?.detail || "Registration failed";
        throw new Error(msg);
      }

      router.push("/login?registered=1");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed. Try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const inputStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: 12,
    border: "1px solid rgba(99,102,241,0.15)",
    background: "rgba(30,31,54,0.4)",
    padding: "14px 16px 14px 48px",
    fontSize: 14,
    color: "#e4e4ef",
    outline: "none",
    transition: "all 0.2s",
  };

  const iconStyle: React.CSSProperties = {
    position: "absolute",
    left: 16,
    top: "50%",
    transform: "translateY(-50%)",
    width: 18,
    height: 18,
    color: "#71728a",
    pointerEvents: "none",
  };

  const fields = [
    { id: "reg-username", label: "Username", type: "text", key: "username", placeholder: "Choose a username", icon: <svg style={iconStyle} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
    { id: "reg-email", label: "Email", type: "email", key: "email", placeholder: "you@example.com", icon: <svg style={iconStyle} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg> },
    { id: "reg-password", label: "Password", type: "password", key: "password", placeholder: "Min 8 characters", icon: <svg style={iconStyle} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> },
    { id: "reg-confirm", label: "Confirm Password", type: "password", key: "confirmPassword", placeholder: "Re-enter password", icon: <svg style={iconStyle} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: "-100px", top: "25%", width: 500, height: 500, borderRadius: "50%", background: "rgba(34,211,238,0.04)", filter: "blur(150px)" }} />
        <div style={{ position: "absolute", right: "-100px", bottom: "25%", width: 500, height: 500, borderRadius: "50%", background: "rgba(99,102,241,0.06)", filter: "blur(150px)" }} />
      </div>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{ position: "relative", width: "100%", maxWidth: 420 }}
      >
        <div className="glass-card" style={{ padding: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
            <div style={{ marginBottom: 20, display: "flex", height: 64, width: 64, alignItems: "center", justifyContent: "center", borderRadius: 16, background: "rgba(34,211,238,0.12)", boxShadow: "0 8px 32px rgba(34,211,238,0.1)" }}>
              <Zap style={{ width: 32, height: 32, color: "#22d3ee" }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e4e4ef" }}>Create Account</h1>
            <p style={{ marginTop: 6, fontSize: 14, color: "#71728a" }}>Join the VisualPC GPU Cloud Platform</p>
          </div>

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

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {fields.map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} style={{ display: "block", marginBottom: 8, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#71728a" }}>
                  {f.label}
                </label>
                <div style={{ position: "relative" }}>
                  {f.icon}
                  <input
                    id={f.id}
                    type={f.type}
                    value={formData[f.key as keyof typeof formData]}
                    onChange={update(f.key)}
                    placeholder={f.placeholder}
                    required
                    minLength={f.type === "password" ? 8 : undefined}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 12, background: "#22d3ee", padding: "14px 16px", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer", border: "none", transition: "all 0.2s", opacity: loading ? 0.5 : 1, marginTop: 4 }}
            >
              {loading ? (
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.6s linear infinite" }} />
              ) : (
                <>
                  Create Account
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </>
              )}
            </button>
          </form>

          <p style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "#71728a" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ fontWeight: 600, color: "#6366f1", textDecoration: "none" }}>
              Sign In
            </Link>
          </p>
        </div>

        <p style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: "rgba(113,114,138,0.6)" }}>
          VisualPC Distributed GPU Cloud Platform
        </p>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
