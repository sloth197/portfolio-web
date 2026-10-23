"use client";

import { FormEvent, useState } from "react";
import { setAdminAuthSession, type AdminRole } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  function resolveRole(value: unknown): AdminRole {
    return value === "CRM" ? "CRM" : "ADMIN";
  }

  function redirectHomeWithEntryTransition(): void {
    window.location.assign("/");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        if (response.status === 401 || response.status === 403) {
          const nextAttempts = failedAttempts + 1;
          setFailedAttempts(nextAttempts);
          setError(nextAttempts >= 3 ? "You are not authorized to access this area." : (payload?.message ?? "Invalid ID or password."));
          return;
        }
        if (response.status === 429) {
          setError(payload?.message ?? "Too many login attempts. Please try again later.");
          return;
        }
        setError("Login failed.");
        return;
      }

      setFailedAttempts(0);
      const payload = (await response.json().catch(() => null)) as {
        authenticated?: boolean;
        role?: string;
      } | null;
      if (!payload?.authenticated) {
        setError("Login failed.");
        return;
      }
      const role = resolveRole(payload?.role);

      setAdminAuthSession(role);
      redirectHomeWithEntryTransition();
    } catch {
      setError("Login request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page-editorial">
      <section className="login-page-intro">
        <div className="login-page-accent" aria-hidden="true" />
        <div>
          <h1><span className="login-title-initial">L</span>ogin</h1>
          <p>Sign in to continue building.</p>
          <span className="login-page-kicker">XHBT.DEV / ADMIN PORTAL</span>
        </div>
      </section>

      <section className="panel login-page-form-panel">
        <svg className="login-border-dot" viewBox="0 0 100 100" aria-hidden="true" preserveAspectRatio="none">
          <rect x="0.5" y="0.5" width="99" height="99" rx="7.5" pathLength="400" />
        </svg>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
          <label className="field-label" htmlFor="admin-username">
            ID
          </label>
          <input
            id="admin-username"
            className="field-input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />

          <label className="field-label" htmlFor="admin-password">
            PW
          </label>
          <input
            id="admin-password"
            type="password"
            className="field-input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <div className="login-page-submit-row">
            <button className="btn login-page-submit" type="submit" disabled={submitting}>
              {submitting ? "Checking..." : "Login"}
            </button>
            {error ? <span className="error-text">{error}</span> : null}
          </div>
        </form>
      </section>
    </div>
  );
}
