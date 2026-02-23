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
      setError("NEXT_PUBLIC_API_BASE_URL 설정이 필요합니다.");
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
        setError("로그인에 실패했습니다.");
        return;
      }

      window.sessionStorage.setItem(ADMIN_AUTH_KEY, authHeader);
      router.replace(nextPath);
    } catch {
      setError("로그인 요청 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="surface-card" style={{ padding: "22px clamp(18px, 4vw, 30px)", display: "grid", gap: 8 }}>
        <span className="badge">Admin</span>
        <h1 className="section-title">Admin 로그인</h1>
        <p className="section-copy" style={{ fontSize: 14 }}>
          로그인 후 프로젝트 작성 페이지로 이동합니다.
        </p>
      </section>

      <section className="panel" style={{ padding: 16, maxWidth: 560 }}>
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
              {submitting ? "확인 중..." : "로그인"}
            </button>
            {error ? <span className="error-text">{error}</span> : null}
          </div>
        </form>
      </section>
    </div>
  );
}
