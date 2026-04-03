"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAdminAuthHeader, getAdminRole, isAdminLoggedIn, setAdminAuthSession, type AdminRole } from "@/lib/admin-auth";
import I18nText from "@/components/i18n-text";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

type CrmStatus = "checking" | "ok" | "error";

function normalizeRole(value: unknown): AdminRole {
  return value === "CRM" ? "CRM" : "ADMIN";
}

export default function CrmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<CrmStatus>(API_BASE ? "checking" : "error");
  const [role, setRole] = useState<AdminRole | null>(() => getAdminRole());
  const [error, setError] = useState<string | null>(API_BASE ? null : "NEXT_PUBLIC_API_BASE_URL is not set.");

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login?next=/crm");
      return;
    }

    if (!API_BASE) {
      return;
    }

    const controller = new AbortController();

    async function checkSession() {
      try {
        const response = await fetch(`${API_BASE}/api/admin/auth/session`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            clearAdminAuthHeader();
            router.replace("/admin/login?next=/crm");
            return;
          }
          setStatus("error");
          setError(`CRM check failed (${response.status})`);
          return;
        }

        const payload = (await response.json().catch(() => null)) as { authenticated?: boolean; role?: string } | null;
        if (!payload?.authenticated) {
          clearAdminAuthHeader();
          router.replace("/admin/login?next=/crm");
          return;
        }
        const normalizedRole = normalizeRole(payload.role);
        setAdminAuthSession(normalizedRole);
        setRole(normalizedRole);
        setStatus("ok");
      } catch {
        setStatus("error");
        setError("CRM status request failed.");
      }
    }

    void checkSession();

    return () => controller.abort();
  }, [router]);

  const canManageProjects = useMemo(() => role === "ADMIN", [role]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="surface-card top-banner top-banner-admin" style={{ padding: "22px clamp(18px, 4vw, 30px)", display: "grid", gap: 8 }}>
        <span className="badge">CRM</span>
        <h1 className="section-title">Customer Relationship Management System</h1>
        <p className="section-copy" style={{ fontSize: 14 }}>
          <I18nText ko="CRM이 사이트 내부 라우트에서 동작합니다." en="CRM operates on the internal route of the site." />
        </p>
      </section>

      <section className="panel" style={{ padding: 16, display: "grid", gap: 10 }}>
        <h2 className="project-detail-subtitle">Session Status</h2>
        <p className="section-copy" style={{ margin: 0 }}>
          상태: {status === "checking" ? "확인 중..." : status === "ok" ? "연결됨" : "오류"}
        </p>
        <p className="section-copy" style={{ margin: 0 }}>
          역할: {role ?? "-"}
        </p>
        {error ? <p className="error-text">{error}</p> : null}
      </section>

      <section className="panel" style={{ padding: 16, display: "grid", gap: 10 }}>
        <h2 className="project-detail-subtitle">Quick Links</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn-ghost" href="/projects">
            프로젝트 목록
          </Link>
          {canManageProjects ? (
            <Link className="btn" href="/projects/admin/new">
              프로젝트 생성
            </Link>
          ) : (
            <span className="helper-text">읽기 전용 계정은 프로젝트 생성/수정이 제한됩니다.</span>
          )}
        </div>
      </section>
    </div>
  );
}
