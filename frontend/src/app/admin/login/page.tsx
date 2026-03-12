"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setAdminAuthSession, type AdminRole } from "@/lib/admin-auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

function toBasicAuth(username: string, password: string): string {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nextPath, setNextPath] = useState("/projects");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  function resolveRole(value: unknown): AdminRole {
    return value === "CRM" ? "CRM" : "ADMIN";
  }

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    setNextPath(next || "/projects");
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
        if (response.status === 401 || response.status === 403) {
          const nextAttempts = failedAttempts + 1;
          setFailedAttempts(nextAttempts);
          setError(nextAttempts >= 3 ? "너 관리자 아니지?" : "아이디 또는 비밀번호가 틀렸습니다");
          return;
        }
        setError("Login failed.");
        return;
      }

      setFailedAttempts(0);
      const payload = (await response.json().catch(() => null)) as { role?: string; canManageProjects?: boolean } | null;
      const role = resolveRole(payload?.role);
      const canManageProjects = payload?.canManageProjects ?? role === "ADMIN";

      setAdminAuthSession(authHeader, role);

      if (!canManageProjects && nextPath.startsWith("/projects/admin")) {
        router.replace("/projects");
        return;
      }
      router.replace(nextPath);
    } catch {
      setError("Login request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="surface-card top-banner top-banner-login" style={{ padding: "22px clamp(18px, 4vw, 30px)", display: "grid", gap: 8 }}>
        <span className="badge">Login</span>
        <h1 className="section-title">Login </h1>
        <p className="section-copy" style={{ fontSize: 14 }}>
          관리자 계정으로 로그인할 수 있습니다.
        </p>
      </section>

      <section className="panel" style={{ padding: 16, width: "min(560px, 100%)", margin: "0 auto" }}>
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
