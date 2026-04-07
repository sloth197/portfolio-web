"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearAdminAuthHeader,
  getAdminRole,
  isAdminLoggedIn,
  isLegacyBasicAuthMode,
  setAdminAuthSession,
  withAdminAuthHeaders,
  type AdminRole,
} from "@/lib/admin-auth";
import { getCrmApiBaseUrl } from "@/lib/crm-api-base";
import I18nText, { type SiteLanguage, useSiteLanguage } from "@/components/i18n-text";

type CrmStatus = "checking" | "ok" | "error";
type LeadStatus = "new" | "contacted" | "watchlist";

type JobSearchDashboardResponse = {
  summary?: {
    totalVisits?: number;
    uniqueVisitors?: number;
    totalProjectClicks?: number;
    avgStaySeconds?: number;
    topClickedProject?: string;
    topClickedCount?: number;
  };
  visitLogs?: VisitLog[];
  projectClickStats?: ProjectClickStat[];
  visitorLeads?: VisitorLead[];
};

type ApiEnvelope<T> = {
  success?: boolean;
  code?: string;
  message?: string;
  data?: T;
};

type VisitLog = {
  id: string;
  visitorId: string;
  visitedAt: string;
  pagePath: string;
  browser: string;
  device: string;
  referrer: string;
};

type ProjectClickStat = {
  id: string;
  projectName: string;
  totalClicks: number;
  githubClicks: number;
  detailClicks: number;
  avgStaySeconds: number;
};

type VisitorLead = {
  id: string;
  alias: string;
  interestProject: string;
  sourceHint: string;
  status: LeadStatus;
  lastSeenAt: string;
};

type CrmError =
  | { kind: "crm_api_base_missing" }
  | { kind: "crm_api_request_failed" }
  | { kind: "crm_api_check_failed"; status: number }
  | { kind: "crm_status_check_failed"; status: number }
  | { kind: "crm_status_request_failed" };

type LeadActionNotice =
  | { kind: "followup"; alias: string }
  | { kind: "memo"; alias: string };

const CRM_API_BASE = getCrmApiBaseUrl();
//임시
const VISIT_LOGS: VisitLog[] = [
  {
    id: "v1",
    visitorId: "anon-A12",
    visitedAt: "2026-04-07T09:12:00+09:00",
    pagePath: "/projects/admin-dashboard",
    browser: "Chrome",
    device: "Desktop",
    referrer: "google.com / search",
  },
  {
    id: "v2",
    visitorId: "anon-B07",
    visitedAt: "2026-04-07T09:25:00+09:00",
    pagePath: "/projects/smart-factory",
    browser: "Safari",
    device: "Mobile",
    referrer: "linkedin.com",
  },
  {
    id: "v3",
    visitorId: "anon-C33",
    visitedAt: "2026-04-07T09:44:00+09:00",
    pagePath: "/projects/api-gateway",
    browser: "Edge",
    device: "Desktop",
    referrer: "github.com",
  },
  {
    id: "v4",
    visitorId: "anon-A12",
    visitedAt: "2026-04-07T10:02:00+09:00",
    pagePath: "/projects/admin-dashboard",
    browser: "Chrome",
    device: "Desktop",
    referrer: "internal navigation",
  },
  {
    id: "v5",
    visitorId: "anon-D81",
    visitedAt: "2026-04-07T10:16:00+09:00",
    pagePath: "/projects/devops-pipeline",
    browser: "Firefox",
    device: "Tablet",
    referrer: "tistory.com / post",
  },
];

const PROJECT_CLICK_STATS: ProjectClickStat[] = [
  { id: "p1", projectName: "Admin Dashboard", totalClicks: 124, githubClicks: 48, detailClicks: 76, avgStaySeconds: 187 },
  { id: "p2", projectName: "Smart Factory", totalClicks: 98, githubClicks: 37, detailClicks: 61, avgStaySeconds: 162 },
  { id: "p3", projectName: "API Gateway", totalClicks: 83, githubClicks: 42, detailClicks: 41, avgStaySeconds: 210 },
  { id: "p4", projectName: "DevOps Pipeline", totalClicks: 71, githubClicks: 21, detailClicks: 50, avgStaySeconds: 149 },
];

const VISITOR_LEADS: VisitorLead[] = [
  {
    id: "l1",
    alias: "Lead-A12",
    interestProject: "Admin Dashboard",
    sourceHint: "GitHub profile click",
    status: "new",
    lastSeenAt: "2026-04-07T10:02:00+09:00",
  },
  {
    id: "l2",
    alias: "Lead-B07",
    interestProject: "Smart Factory",
    sourceHint: "LinkedIn inbound",
    status: "contacted",
    lastSeenAt: "2026-04-07T09:25:00+09:00",
  },
  {
    id: "l3",
    alias: "Lead-D81",
    interestProject: "DevOps Pipeline",
    sourceHint: "Blog referral",
    status: "watchlist",
    lastSeenAt: "2026-04-07T10:16:00+09:00",
  },
];

function normalizeRole(value: unknown): AdminRole {
  return value === "CRM" ? "CRM" : "ADMIN";
}

function formatDateTime(value: string, language: SiteLanguage): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(language === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toRelativeTime(value: string, language: SiteLanguage, nowMs: number | null): string {
  if (nowMs === null) {
    return "-";
  }
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) {
    return "-";
  }
  const diffMs = nowMs - target;
  if (diffMs < 0) {
    return language === "ko" ? "방금" : "just now";
  }
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    return language === "ko" ? "방금" : "just now";
  }
  if (diffHours < 24) {
    return language === "ko" ? `${diffHours}시간 전` : `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return language === "ko" ? `${diffDays}일 전` : `${diffDays}d ago`;
}

function buildErrorMessage(error: CrmError | null, language: SiteLanguage): string | null {
  if (!error) {
    return null;
  }
  if (error.kind === "crm_api_base_missing") {
    return language === "ko" ? "CRM API 기본 URL이 설정되지 않았습니다." : "CRM API base URL is not configured.";
  }
  if (error.kind === "crm_api_request_failed") {
    return language === "ko" ? "CRM API 요청에 실패했습니다." : "CRM API request failed.";
  }
  if (error.kind === "crm_api_check_failed") {
    if (error.status === 503) {
      return language === "ko"
        ? "CRM API 서버가 일시 중지 상태에서 기동 중입니다. 잠시 후 다시 시도해 주세요."
        : "CRM API is waking from hibernation. Please retry shortly.";
    }
    return language === "ko" ? `CRM API 상태 확인 실패 (${error.status})` : `CRM API check failed (${error.status})`;
  }
  if (error.kind === "crm_status_check_failed") {
    return language === "ko" ? `CRM 세션 확인 실패 (${error.status})` : `CRM session check failed (${error.status})`;
  }
  return language === "ko" ? "CRM 상태 확인 요청에 실패했습니다." : "CRM status request failed.";
}

function buildLeadActionNoticeMessage(notice: LeadActionNotice | null, language: SiteLanguage): string | null {
  if (!notice) {
    return null;
  }
  if (notice.kind === "followup") {
    return language === "ko"
      ? `${notice.alias} 후속 액션 기능은 다음 단계에서 연결됩니다.`
      : `Follow-up action for ${notice.alias} will be connected in the next step.`;
  }
  return language === "ko"
    ? `${notice.alias} 메모 기능은 다음 단계에서 연결됩니다.`
    : `Memo feature for ${notice.alias} will be connected in the next step.`;
}

function getLeadStatusLabel(status: LeadStatus, language: SiteLanguage): string {
  const labels: Record<LeadStatus, { ko: string; en: string }> = {
    new: { ko: "신규", en: "New" },
    contacted: { ko: "응답 완료", en: "Contacted" },
    watchlist: { ko: "추적 중", en: "Watchlist" },
  };
  return labels[status][language];
}

function isLeadStatus(value: unknown): value is LeadStatus {
  return value === "new" || value === "contacted" || value === "watchlist";
}

function normalizeVisitLogs(items: unknown): VisitLog[] {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      id: String(item.id ?? ""),
      visitorId: String(item.visitorId ?? ""),
      visitedAt: String(item.visitedAt ?? ""),
      pagePath: String(item.pagePath ?? ""),
      browser: String(item.browser ?? ""),
      device: String(item.device ?? ""),
      referrer: String(item.referrer ?? ""),
    }))
    .filter((item) => item.id && item.visitorId && item.visitedAt);
}

function normalizeProjectClickStats(items: unknown): ProjectClickStat[] {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      id: String(item.id ?? ""),
      projectName: String(item.projectName ?? ""),
      totalClicks: Number(item.totalClicks ?? 0),
      githubClicks: Number(item.githubClicks ?? 0),
      detailClicks: Number(item.detailClicks ?? 0),
      avgStaySeconds: Number(item.avgStaySeconds ?? 0),
    }))
    .filter((item) => item.id && item.projectName);
}

function normalizeVisitorLeads(items: unknown): VisitorLead[] {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => {
      const status = isLeadStatus(item.status) ? item.status : "new";
      return {
        id: String(item.id ?? ""),
        alias: String(item.alias ?? ""),
        interestProject: String(item.interestProject ?? ""),
        sourceHint: String(item.sourceHint ?? ""),
        status,
        lastSeenAt: String(item.lastSeenAt ?? ""),
      };
    })
    .filter((item) => item.id && item.alias);
}

export default function CrmPage() {
  const router = useRouter();
  const language = useSiteLanguage();
  const [status, setStatus] = useState<CrmStatus>("checking");
  const [role, setRole] = useState<AdminRole | null>(() => getAdminRole());
  const [error, setError] = useState<CrmError | null>(null);
  const [leadActionNotice, setLeadActionNotice] = useState<LeadActionNotice | null>(null);
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>(VISIT_LOGS);
  const [projectClickStats, setProjectClickStats] = useState<ProjectClickStat[]>(PROJECT_CLICK_STATS);
  const [visitorLeads, setVisitorLeads] = useState<VisitorLead[]>(VISITOR_LEADS);
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    const updateNowMs = () => {
      setNowMs(Date.now());
    };
    const timeoutId = window.setTimeout(updateNowMs, 0);
    const timerId = window.setInterval(() => {
      updateNowMs();
    }, 60_000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login?next=/crm");
      return;
    }
    const controller = new AbortController();

    async function checkCrmApiReachability(): Promise<CrmError | null> {
      if (!CRM_API_BASE) {
        return { kind: "crm_api_base_missing" };
      }

      try {
        const response = await fetch(`${CRM_API_BASE}/v1/users/me`, {
          method: "GET",
          headers: withAdminAuthHeaders(),
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.ok || response.status === 401 || response.status === 403) {
          return null;
        }

        return { kind: "crm_api_check_failed", status: response.status };
      } catch {
        return { kind: "crm_api_request_failed" };
      }
    }

    async function syncPortfolioDashboardData() {
      try {
        const response = await fetch(`${CRM_API_BASE}/v1/dashboard/portfolio/job-search`, {
          method: "GET",
          headers: withAdminAuthHeaders(),
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json().catch(() => null)) as ApiEnvelope<JobSearchDashboardResponse> | null;
        const data = payload?.data;
        if (!data || typeof data !== "object") {
          return;
        }

        const nextVisitLogs = normalizeVisitLogs(data.visitLogs);
        const nextProjectClickStats = normalizeProjectClickStats(data.projectClickStats);
        const nextVisitorLeads = normalizeVisitorLeads(data.visitorLeads);

        if (nextVisitLogs.length > 0) {
          setVisitLogs(nextVisitLogs);
        }
        if (nextProjectClickStats.length > 0) {
          setProjectClickStats(nextProjectClickStats);
        }
        if (nextVisitorLeads.length > 0) {
          setVisitorLeads(nextVisitorLeads);
        }
      } catch {
        // no-op: keep fallback sample data when backend payload is unavailable
      }
    }

    async function checkSessionAndCrmApi() {
      if (isLegacyBasicAuthMode()) {
        const crmError = await checkCrmApiReachability();
        if (crmError) {
          if (crmError.kind === "crm_api_check_failed" && crmError.status === 503) {
            await syncPortfolioDashboardData();
            setStatus("ok");
            setError(crmError);
            return;
          }
          setStatus("error");
          setError(crmError);
          return;
        }
        await syncPortfolioDashboardData();
        setStatus("ok");
        setError(null);
        return;
      }

      try {
        const response = await fetch("/api/admin/auth/session", {
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
          setError({ kind: "crm_status_check_failed", status: response.status });
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

        const crmError = await checkCrmApiReachability();
        if (crmError) {
          if (crmError.kind === "crm_api_check_failed" && crmError.status === 503) {
            await syncPortfolioDashboardData();
            setStatus("ok");
            setError(crmError);
            return;
          }
          setStatus("error");
          setError(crmError);
          return;
        }

        await syncPortfolioDashboardData();
        setStatus("ok");
        setError(null);
      } catch {
        setStatus("error");
        setError({ kind: "crm_status_request_failed" });
      }
    }

    void checkSessionAndCrmApi();

    return () => controller.abort();
  }, [router]);

  const t = useMemo(() => {
    const isKo = language === "ko";
    return {
      title: isKo ? "CRM" : "Customer Relationship Management",
      sessionStatusTitle: isKo ? "세션 상태" : "Session Status",
      statusLabel: isKo ? "상태" : "Status",
      statusChecking: isKo ? "확인 중..." : "Checking...",
      statusOk: isKo ? "연결됨" : "Connected",
      statusError: isKo ? "오류" : "Error",
      roleLabel: isKo ? "역할" : "Role",
      roleModeLabel: isKo ? "권한 모드" : "Access Mode",
      roleModeAdmin: isKo ? "ADMIN (편집 가능)" : "ADMIN (Editable)",
      roleModeCrm: isKo ? "CRM (읽기 전용)" : "CRM (Read-only)",
      summaryVisits: isKo ? "총 방문 로그" : "Total Visit Logs",
      summaryVisitors: isKo ? "고유 방문자" : "Unique Visitors",
      summaryClicks: isKo ? "총 프로젝트 클릭" : "Total Project Clicks",
      summaryStay: isKo ? "평균 체류 시간" : "Average Stay Time",
      visitLogTitle: isKo ? "방문 로그" : "Visit Logs",
      visitLogDesc: isKo ? "방문 시간, 페이지, 브라우저/기기, 유입 경로를 확인합니다." : "Track visit time, page, browser/device, and referrer.",
      visitTime: isKo ? "방문 시간" : "Visit Time",
      visitPage: isKo ? "페이지" : "Page",
      visitBrowser: isKo ? "브라우저" : "Browser",
      visitDevice: isKo ? "기기" : "Device",
      visitReferrer: isKo ? "유입 경로" : "Referrer",
      clickTrackingTitle: isKo ? "프로젝트 클릭 트래킹" : "Project Click Tracking",
      clickTrackingDesc: isKo
        ? "프로젝트 클릭 수, GitHub 버튼 클릭 수, 상세보기 클릭 수, 평균 체류 시간을 확인합니다."
        : "Track project clicks, GitHub clicks, detail clicks, and average stay time.",
      projectName: isKo ? "프로젝트" : "Project",
      totalClicks: isKo ? "총 클릭" : "Total Clicks",
      githubClicks: isKo ? "GitHub 클릭" : "GitHub Clicks",
      detailClicks: isKo ? "상세보기 클릭" : "Detail Clicks",
      avgStay: isKo ? "평균 체류" : "Avg Stay",
      topClicked: isKo ? "최다 클릭 프로젝트" : "Top Clicked Project",
      leadManageTitle: isKo ? "방문자 리드 관리 (임시)" : "Visitor Lead Management (Temporary)",
      leadManageDesc: isKo ? "후속 액션 전 준비용 임시 리드 목록입니다." : "Temporary lead list for follow-up planning.",
      leadAlias: isKo ? "리드" : "Lead",
      leadInterest: isKo ? "관심 프로젝트" : "Interest Project",
      leadSource: isKo ? "유입 힌트" : "Source Hint",
      leadStatus: isKo ? "상태" : "Status",
      leadLastSeen: isKo ? "최근 방문" : "Last Seen",
      leadAction: isKo ? "액션" : "Action",
      followupButton: isKo ? "후속 액션" : "Follow-up",
      memoButton: isKo ? "메모" : "Memo",
      readOnlyHint: isKo ? "CRM 계정은 현재 읽기 전용입니다." : "CRM accounts are currently read-only.",
      tempInfoTitle: isKo ? "임시 구성 안내" : "Temporary Setup",
      tempInfoCopy: isKo
        ? "현재 데이터는 취준 포트폴리오 CRM용 샘플 데이터입니다. 실시간 트래킹 연동은 다음 단계에서 진행합니다."
        : "Current data is sample data for job search portfolio CRM. Real-time tracking integration is planned next.",
    };
  }, [language]);

  const errorMessage = useMemo(() => buildErrorMessage(error, language), [error, language]);
  const leadActionMessage = useMemo(() => buildLeadActionNoticeMessage(leadActionNotice, language), [leadActionNotice, language]);
  const isAdmin = useMemo(() => role === "ADMIN", [role]);

  const analytics = useMemo(() => {
    const uniqueVisitors = new Set(visitLogs.map((item) => item.visitorId)).size;
    const totalProjectClicks = projectClickStats.reduce((sum, item) => sum + item.totalClicks, 0);
    const totalStaySeconds = projectClickStats.reduce((sum, item) => sum + item.avgStaySeconds, 0);
    const avgStaySeconds = projectClickStats.length === 0 ? 0 : Math.round(totalStaySeconds / projectClickStats.length);
    const topProject = [...projectClickStats].sort((a, b) => b.totalClicks - a.totalClicks)[0] ?? null;

    return {
      totalVisits: visitLogs.length,
      uniqueVisitors,
      totalProjectClicks,
      avgStaySeconds,
      topProject,
    };
  }, [projectClickStats, visitLogs]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="surface-card top-banner top-banner-admin" style={{ padding: "22px clamp(18px, 4vw, 30px)", display: "grid", gap: 8 }}>
        <span className="badge">CRM</span>
        <h1 className="section-title">{t.title}</h1>
        <p className="section-copy" style={{ fontSize: 14 }}>
          <I18nText ko="취업 준비용 포트폴리오 방문/클릭/리드 데이터를 관리합니다." en="Manage portfolio visit/click/lead data for job search preparation." />
        </p>
      </section>

      <section className="panel" style={{ padding: 16, display: "grid", gap: 10 }}>
        <h2 className="project-detail-subtitle">{t.sessionStatusTitle}</h2>
        <p className="section-copy" style={{ margin: 0 }}>
          {t.statusLabel}: {status === "checking" ? t.statusChecking : status === "ok" ? t.statusOk : t.statusError}
        </p>
        <p className="section-copy" style={{ margin: 0 }}>
          {t.roleLabel}: {role ?? "-"}
        </p>
        <p className="section-copy" style={{ margin: 0 }}>
          {t.roleModeLabel}: {isAdmin ? t.roleModeAdmin : role === "CRM" ? t.roleModeCrm : "-"}
        </p>
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        {leadActionMessage ? <p className="helper-text">{leadActionMessage}</p> : null}
      </section>

      <section className="panel" style={{ padding: 16, display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          <article style={{ borderRadius: 14, border: "1px solid rgba(87, 126, 183, 0.45)", background: "rgba(13, 27, 52, 0.78)", padding: 14, display: "grid", gap: 8 }}>
            <span className="helper-text">{t.summaryVisits}</span>
            <strong style={{ fontSize: 36, lineHeight: 1, color: "#ecf3ff", letterSpacing: "-0.03em" }}>{analytics.totalVisits}</strong>
          </article>
          <article style={{ borderRadius: 14, border: "1px solid rgba(87, 126, 183, 0.45)", background: "rgba(13, 27, 52, 0.78)", padding: 14, display: "grid", gap: 8 }}>
            <span className="helper-text">{t.summaryVisitors}</span>
            <strong style={{ fontSize: 36, lineHeight: 1, color: "#ecf3ff", letterSpacing: "-0.03em" }}>{analytics.uniqueVisitors}</strong>
          </article>
          <article style={{ borderRadius: 14, border: "1px solid rgba(87, 126, 183, 0.45)", background: "rgba(13, 27, 52, 0.78)", padding: 14, display: "grid", gap: 8 }}>
            <span className="helper-text">{t.summaryClicks}</span>
            <strong style={{ fontSize: 36, lineHeight: 1, color: "#ecf3ff", letterSpacing: "-0.03em" }}>{analytics.totalProjectClicks}</strong>
          </article>
          <article style={{ borderRadius: 14, border: "1px solid rgba(87, 126, 183, 0.45)", background: "rgba(13, 27, 52, 0.78)", padding: 14, display: "grid", gap: 8 }}>
            <span className="helper-text">{t.summaryStay}</span>
            <strong style={{ fontSize: 36, lineHeight: 1, color: "#ecf3ff", letterSpacing: "-0.03em" }}>{analytics.avgStaySeconds}s</strong>
          </article>
        </div>
      </section>

      <section className="panel" style={{ padding: 16, display: "grid", gap: 10 }}>
        <h3 className="project-detail-subtitle" style={{ margin: 0 }}>{t.visitLogTitle}</h3>
        <p className="helper-text" style={{ margin: 0 }}>{t.visitLogDesc}</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 920, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(57, 83, 126, 0.65)" }}>
                <th style={{ color: "#8da5cb", textAlign: "left", fontSize: 14, fontWeight: 500, padding: "6px 0 10px" }}>{t.visitTime}</th>
                <th style={{ color: "#8da5cb", textAlign: "left", fontSize: 14, fontWeight: 500, padding: "6px 0 10px" }}>{t.visitPage}</th>
                <th style={{ color: "#8da5cb", textAlign: "left", fontSize: 14, fontWeight: 500, padding: "6px 0 10px" }}>{t.visitBrowser}</th>
                <th style={{ color: "#8da5cb", textAlign: "left", fontSize: 14, fontWeight: 500, padding: "6px 0 10px" }}>{t.visitDevice}</th>
                <th style={{ color: "#8da5cb", textAlign: "left", fontSize: 14, fontWeight: 500, padding: "6px 0 10px" }}>{t.visitReferrer}</th>
              </tr>
            </thead>
            <tbody>
              {visitLogs.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid rgba(43, 62, 94, 0.65)" }}>
                  <td style={{ color: "#dce9ff", fontSize: 15, padding: "10px 0" }}>{formatDateTime(item.visitedAt, language)}</td>
                  <td style={{ color: "#adc1e0", fontSize: 15, padding: "10px 0" }}>{item.pagePath}</td>
                  <td style={{ color: "#adc1e0", fontSize: 15, padding: "10px 0" }}>{item.browser}</td>
                  <td style={{ color: "#adc1e0", fontSize: 15, padding: "10px 0" }}>{item.device}</td>
                  <td style={{ color: "#adc1e0", fontSize: 15, padding: "10px 0" }}>{item.referrer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" style={{ padding: 16, display: "grid", gap: 10 }}>
        <h3 className="project-detail-subtitle" style={{ margin: 0 }}>{t.clickTrackingTitle}</h3>
        <p className="helper-text" style={{ margin: 0 }}>{t.clickTrackingDesc}</p>
        <p className="helper-text" style={{ margin: 0 }}>
          {t.topClicked}: {analytics.topProject ? `${analytics.topProject.projectName} (${analytics.topProject.totalClicks})` : "-"}
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 920, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(57, 83, 126, 0.65)" }}>
                <th style={{ color: "#8da5cb", textAlign: "left", fontSize: 14, fontWeight: 500, padding: "6px 0 10px" }}>{t.projectName}</th>
                <th style={{ color: "#8da5cb", textAlign: "left", fontSize: 14, fontWeight: 500, padding: "6px 0 10px" }}>{t.totalClicks}</th>
                <th style={{ color: "#8da5cb", textAlign: "left", fontSize: 14, fontWeight: 500, padding: "6px 0 10px" }}>{t.githubClicks}</th>
                <th style={{ color: "#8da5cb", textAlign: "left", fontSize: 14, fontWeight: 500, padding: "6px 0 10px" }}>{t.detailClicks}</th>
                <th style={{ color: "#8da5cb", textAlign: "left", fontSize: 14, fontWeight: 500, padding: "6px 0 10px" }}>{t.avgStay}</th>
              </tr>
            </thead>
            <tbody>
              {projectClickStats.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid rgba(43, 62, 94, 0.65)" }}>
                  <td style={{ color: "#dce9ff", fontSize: 15, padding: "10px 0" }}>{item.projectName}</td>
                  <td style={{ color: "#adc1e0", fontSize: 15, padding: "10px 0" }}>{item.totalClicks}</td>
                  <td style={{ color: "#adc1e0", fontSize: 15, padding: "10px 0" }}>{item.githubClicks}</td>
                  <td style={{ color: "#adc1e0", fontSize: 15, padding: "10px 0" }}>{item.detailClicks}</td>
                  <td style={{ color: "#adc1e0", fontSize: 15, padding: "10px 0" }}>{item.avgStaySeconds}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" style={{ padding: 16, display: "grid", gap: 10 }}>
        <h3 className="project-detail-subtitle" style={{ margin: 0 }}>{t.leadManageTitle}</h3>
        <p className="helper-text" style={{ margin: 0 }}>{t.leadManageDesc}</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 960, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(57, 83, 126, 0.65)" }}>
                <th style={{ color: "#8da5cb", textAlign: "left", fontSize: 14, fontWeight: 500, padding: "6px 0 10px" }}>{t.leadAlias}</th>
                <th style={{ color: "#8da5cb", textAlign: "left", fontSize: 14, fontWeight: 500, padding: "6px 0 10px" }}>{t.leadInterest}</th>
                <th style={{ color: "#8da5cb", textAlign: "left", fontSize: 14, fontWeight: 500, padding: "6px 0 10px" }}>{t.leadSource}</th>
                <th style={{ color: "#8da5cb", textAlign: "left", fontSize: 14, fontWeight: 500, padding: "6px 0 10px" }}>{t.leadStatus}</th>
                <th style={{ color: "#8da5cb", textAlign: "left", fontSize: 14, fontWeight: 500, padding: "6px 0 10px" }}>{t.leadLastSeen}</th>
                <th style={{ color: "#8da5cb", textAlign: "left", fontSize: 14, fontWeight: 500, padding: "6px 0 10px" }}>{t.leadAction}</th>
              </tr>
            </thead>
            <tbody>
              {visitorLeads.map((lead) => (
                <tr key={lead.id} style={{ borderBottom: "1px solid rgba(43, 62, 94, 0.65)" }}>
                  <td style={{ color: "#dce9ff", fontSize: 15, padding: "10px 0" }}>{lead.alias}</td>
                  <td style={{ color: "#adc1e0", fontSize: 15, padding: "10px 0" }}>{lead.interestProject}</td>
                  <td style={{ color: "#adc1e0", fontSize: 15, padding: "10px 0" }}>{lead.sourceHint}</td>
                  <td style={{ color: "#adc1e0", fontSize: 15, padding: "10px 0" }}>{getLeadStatusLabel(lead.status, language)}</td>
                  <td style={{ color: "#adc1e0", fontSize: 15, padding: "10px 0" }}>
                    {formatDateTime(lead.lastSeenAt, language)} ({toRelativeTime(lead.lastSeenAt, language, nowMs)})
                  </td>
                  <td style={{ color: "#adc1e0", fontSize: 15, padding: "10px 0" }}>
                    {isAdmin ? (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => setLeadActionNotice({ kind: "followup", alias: lead.alias })}
                        >
                          {t.followupButton}
                        </button>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => setLeadActionNotice({ kind: "memo", alias: lead.alias })}
                        >
                          {t.memoButton}
                        </button>
                      </div>
                    ) : (
                      <span className="helper-text">{t.readOnlyHint}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <article
          style={{
            borderRadius: 14,
            border: "1px solid rgba(87, 126, 183, 0.45)",
            background: "rgba(13, 27, 52, 0.78)",
            padding: 14,
            display: "grid",
            gap: 8,
          }}
        >
          <h3 className="project-detail-subtitle" style={{ margin: 0 }}>{t.tempInfoTitle}</h3>
          <p className="helper-text" style={{ margin: 0 }}>{t.tempInfoCopy}</p>
        </article>
      </section>
    </div>
  );
}
