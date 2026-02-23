"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectCategory } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const ADMIN_AUTH_KEY = "portfolio_admin_basic_auth";

function normalizeCategory(value: string | null): ProjectCategory {
  return value?.toUpperCase() === "FIRMWARE" ? "FIRMWARE" : "SOFTWARE";
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminProjectCreatePage() {
  const router = useRouter();
  const [category, setCategory] = useState<ProjectCategory>("SOFTWARE");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const parsedCategory = normalizeCategory(new URLSearchParams(window.location.search).get("category"));
    setCategory(parsedCategory);

    const auth = window.sessionStorage.getItem(ADMIN_AUTH_KEY);
    if (!auth) {
      const next = `/projects/admin/new?category=${parsedCategory}`;
      router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
    }
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!API_BASE) {
      setError("NEXT_PUBLIC_API_BASE_URL 설정이 필요합니다.");
      return;
    }

    const auth = window.sessionStorage.getItem(ADMIN_AUTH_KEY);
    if (!auth) {
      setError("관리자 로그인 정보가 없습니다. 다시 로그인해 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/projects`, {
        method: "POST",
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          title: title.trim(),
          slug: (slug.trim() || slugify(title)).trim(),
          summary: summary.trim(),
          contentMarkdown: contentMarkdown.trim(),
          githubUrl: linkUrl.trim() || null,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        if (response.status === 401 || response.status === 403) {
          window.sessionStorage.removeItem(ADMIN_AUTH_KEY);
          const next = `/projects/admin/new?category=${category}`;
          router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
          return;
        }
        setError(payload?.message ?? `저장 실패 (${response.status})`);
        return;
      }

      setNotice("프로젝트가 생성되었습니다. 목록 페이지로 이동합니다.");
      setTimeout(() => {
        router.replace(`/projects?category=${category}`);
      }, 700);
    } catch {
      setError("요청 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="surface-card" style={{ padding: "22px clamp(18px, 4vw, 30px)", display: "grid", gap: 8 }}>
        <span className="badge">Admin</span>
        <h1 className="section-title">프로젝트 작성</h1>
        <p className="section-copy" style={{ fontSize: 14 }}>
          관리자 인증 후 Firmware/Software 프로젝트를 작성합니다.
        </p>
      </section>

      <section className="panel" style={{ padding: 16, display: "grid", gap: 10 }}>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
          <label className="field-label" htmlFor="project-category">
            카테고리
          </label>
          <select
            id="project-category"
            className="field-select"
            value={category}
            onChange={(event) => setCategory(event.target.value as ProjectCategory)}
          >
            <option value="SOFTWARE">Software</option>
            <option value="FIRMWARE">Firmware</option>
          </select>

          <label className="field-label" htmlFor="project-title">
            제목
          </label>
          <input
            id="project-title"
            className="field-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            required
          />

          <label className="field-label" htmlFor="project-slug">
            슬러그(URL)
          </label>
          <input
            id="project-slug"
            className="field-input"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder={slugify(title) || "auto-generated-from-title"}
            maxLength={160}
          />

          <label className="field-label" htmlFor="project-summary">
            요약
          </label>
          <input
            id="project-summary"
            className="field-input"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            maxLength={300}
            required
          />

          <label className="field-label" htmlFor="project-link">
            링크(GitHub/문서)
          </label>
          <input
            id="project-link"
            className="field-input"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            maxLength={300}
            placeholder="https://..."
          />

          <label className="field-label" htmlFor="project-markdown">
            상세 내용 (Markdown)
          </label>
          <textarea
            id="project-markdown"
            className="field-input"
            value={contentMarkdown}
            onChange={(event) => setContentMarkdown(event.target.value)}
            rows={8}
            required
          />

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? "저장 중..." : "작성 완료"}
            </button>
            {notice ? <span className="success-text">{notice}</span> : null}
            {error ? <span className="error-text">{error}</span> : null}
          </div>
        </form>
      </section>
    </div>
  );
}
