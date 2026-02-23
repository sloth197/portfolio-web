"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ProjectCategory } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

type Props = {
  category?: ProjectCategory;
};

function toBasicAuth(username: string, password: string): string {
  return `Basic ${btoa(`${username}:${password}`)}`;
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

export default function ProjectAdminCreateForm({ category }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canWrite = Boolean(category);
  const resolvedSlug = useMemo(() => (slug.trim() ? slug.trim() : slugify(title)), [slug, title]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!API_BASE) {
      setError("NEXT_PUBLIC_API_BASE_URL 설정이 필요합니다.");
      return;
    }
    if (!category) {
      setError("카테고리를 먼저 선택해 주세요.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/projects`, {
        method: "POST",
        headers: {
          Authorization: toBasicAuth(username, password),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          title: title.trim(),
          slug: resolvedSlug,
          summary: summary.trim(),
          contentMarkdown: contentMarkdown.trim(),
          githubUrl: linkUrl.trim() || null,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        if (response.status === 401 || response.status === 403) {
          setError("관리자 인증에 실패했습니다. 관리자 계정을 확인해 주세요.");
        } else {
          setError(payload?.message ?? `저장 실패 (${response.status})`);
        }
        return;
      }

      setNotice("프로젝트가 생성되었습니다. 목록 새로고침 후 확인해 주세요.");
      setTitle("");
      setSlug("");
      setSummary("");
      setContentMarkdown("");
      setLinkUrl("");
    } catch {
      setError("요청 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel" style={{ padding: 16, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>관리자 작성</h2>
          <p className="section-copy" style={{ fontSize: 13 }}>
            Firmware/Software 섹션에서 관리자 인증 후에만 작성 가능합니다.
          </p>
        </div>
        <button type="button" className="btn-ghost" onClick={() => setIsOpen((prev) => !prev)}>
          {isOpen ? "작성 닫기" : "작성 열기"}
        </button>
      </div>

      {!canWrite ? (
        <p className="section-copy" style={{ fontSize: 13 }}>
          상단에서 Software 또는 Firmware 카테고리를 선택하면 작성 폼이 활성화됩니다.
        </p>
      ) : null}

      {isOpen && canWrite ? (
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <div style={{ display: "grid", gap: 6 }}>
              <label className="field-label" htmlFor="admin-username">
                관리자 ID
              </label>
              <input
                id="admin-username"
                className="field-input"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <label className="field-label" htmlFor="admin-password">
                관리자 Password
              </label>
              <input
                id="admin-password"
                className="field-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="surface-card" style={{ padding: 12, display: "grid", gap: 10 }}>
            <p className="helper-text">카테고리: {category}</p>
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <div style={{ display: "grid", gap: 6 }}>
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
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                <label className="field-label" htmlFor="project-slug">
                  슬러그(URL)
                </label>
                <input
                  id="project-slug"
                  className="field-input"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder={resolvedSlug || "auto-generated-from-title"}
                  maxLength={160}
                />
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
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
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label className="field-label" htmlFor="project-link">
                첨부 링크(GitHub/문서)
              </label>
              <input
                id="project-link"
                className="field-input"
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://github.com/..."
                maxLength={300}
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label className="field-label" htmlFor="project-content">
                상세 내용(Markdown)
              </label>
              <textarea
                id="project-content"
                className="field-input"
                value={contentMarkdown}
                onChange={(event) => setContentMarkdown(event.target.value)}
                rows={7}
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "저장 중..." : "프로젝트 작성"}
            </button>
            {notice ? <span className="success-text">{notice}</span> : null}
            {error ? <span className="error-text">{error}</span> : null}
          </div>
        </form>
      ) : null}
    </section>
  );
}
