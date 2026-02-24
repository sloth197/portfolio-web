"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const ADMIN_AUTH_KEY = "portfolio_admin_basic_auth";

function toBasicAuth(username: string, password: string): string {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nextPath, setNextPath] = useState("/projects/admin/new");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    setNextPath(next || "/projects/admin/new");
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!API_BASE) {
      setError("NEXT_PUBLIC_API_BASE_URL is not set.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const authHeader = toBasicAuth(username, password);
      const response = await fetch(`${API_BASE}/api/admin/projects/ping`, {
        method: "GET",
        headers: { Authorization: authHeader },
        cache: "no-store",
      });

      if (!response.ok) {
        setError("Login failed.");
        return;
      }

      window.sessionStorage.setItem(ADMIN_AUTH_KEY, authHeader);
      router.replace(nextPath);
    } catch {
      setError("Login request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="surface-card" style={{ padding: "22px clamp(18px, 4vw, 30px)", display: "grid", gap: 8 }}>
        <span className="badge">Login</span>
        <h1 className="section-title">Login</h1>
        <p className="section-copy" style={{ fontSize: 14 }}>
          Login is required to edit or delete projects.
        </p>
      </section>

      <section className="panel" style={{ padding: 16, maxWidth: 560 }}>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
          <label className="field-label" htmlFor="admin-username">
            Username
          </label>
          <input
            id="admin-username"
            className="field-input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />

          <label className="field-label" htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            className="field-input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? "Checking..." : "Login"}
            </button>
            {error ? <span className="error-text">{error}</span> : null}
          </div>
        </form>
      </section>
    </div>
  );
}
