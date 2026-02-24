"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectCategory, ProjectDto } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const ADMIN_AUTH_KEY = "portfolio_admin_basic_auth";

type Props = {
  project: ProjectDto;
  returnPath: string;
  disabled?: boolean;
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ProjectAdminActions({ project, returnPath, disabled = false }: Props) {
  const router = useRouter();
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState<ProjectCategory>(project.category);
  const [title, setTitle] = useState(project.title);
  const [slug, setSlug] = useState(project.slug);
  const [summary, setSummary] = useState(project.summary);
  const [contentMarkdown, setContentMarkdown] = useState(project.contentMarkdown);
  const [githubUrl, setGithubUrl] = useState(project.githubUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const auth = window.sessionStorage.getItem(ADMIN_AUTH_KEY);
    setAdminLoggedIn(Boolean(auth));
  }, []);

  useEffect(() => {
    if (!adminLoggedIn && editing) {
      setEditing(false);
    }
  }, [adminLoggedIn, editing]);

  useEffect(() => {
    const root = document.getElementById("project-detail-layout");
    if (!root) {
      return;
    }
    if (editing) {
      root.setAttribute("data-editing", "true");
    } else {
      root.removeAttribute("data-editing");
    }
    return () => {
      root.removeAttribute("data-editing");
    };
  }, [editing]);

  function resolveCurrentPath(): string {
    if (typeof window === "undefined") {
      return returnPath;
    }
    return `${window.location.pathname}${window.location.search}`;
  }

  function requireAuthHeader(): string | null {
    if (typeof window === "undefined") {
      return null;
    }

    const auth = window.sessionStorage.getItem(ADMIN_AUTH_KEY);
    if (!auth) {
      setAdminLoggedIn(false);
      router.replace(`/admin/login?next=${encodeURIComponent(resolveCurrentPath())}`);
      return null;
    }
    setAdminLoggedIn(true);
    return auth;
  }

  function onStartEdit() {
    if (disabled) {
      setError("Preview mode does not support edit/delete.");
      return;
    }
    const auth = requireAuthHeader();
    if (!auth) {
      return;
    }
    setError(null);
    setNotice(null);
    setEditing(true);
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) {
      setError("Preview mode does not support edit/delete.");
      return;
    }
    if (!API_BASE) {
      setError("NEXT_PUBLIC_API_BASE_URL is not set.");
      return;
    }

    const auth = requireAuthHeader();
    if (!auth) {
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/projects/${project.id}`, {
        method: "PUT",
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
          githubUrl: githubUrl.trim() || null,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        if (response.status === 401 || response.status === 403) {
          window.sessionStorage.removeItem(ADMIN_AUTH_KEY);
          setAdminLoggedIn(false);
          router.replace(`/admin/login?next=${encodeURIComponent(resolveCurrentPath())}`);
          return;
        }
        setError(payload?.message ?? `Update failed (${response.status})`);
        return;
      }

      setNotice("Project updated.");
      setEditing(false);
      router.refresh();
    } catch {
      setError("Update request failed.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (disabled) {
      setError("Preview mode does not support edit/delete.");
      return;
    }
    if (!API_BASE) {
      setError("NEXT_PUBLIC_API_BASE_URL is not set.");
      return;
    }
    if (!confirm("Delete this project? This action cannot be undone.")) {
      return;
    }

    const auth = requireAuthHeader();
    if (!auth) {
      return;
    }

    setDeleting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/projects/${project.id}`, {
        method: "DELETE",
        headers: {
          Authorization: auth,
        },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        if (response.status === 401 || response.status === 403) {
          window.sessionStorage.removeItem(ADMIN_AUTH_KEY);
          setAdminLoggedIn(false);
          router.replace(`/admin/login?next=${encodeURIComponent(resolveCurrentPath())}`);
          return;
        }
        setError(payload?.message ?? `Delete failed (${response.status})`);
        return;
      }

      router.replace(returnPath);
      router.refresh();
    } catch {
      setError("Delete request failed.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="panel" style={{ padding: 14, display: "grid", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn-ghost" onClick={() => (editing ? setEditing(false) : onStartEdit())}>
          {editing ? "Cancel Edit" : "Edit"}
        </button>
        {editing && adminLoggedIn ? (
          <button type="button" className="btn-ghost" onClick={onDelete} disabled={deleting || saving}>
            {deleting ? "Deleting..." : "Delete"}
          </button>
        ) : null}
      </div>

      {editing && adminLoggedIn ? (
        <form onSubmit={onSave} style={{ display: "grid", gap: 10 }}>
          <label className="field-label" htmlFor="edit-category">
            Category
          </label>
          <select
            id="edit-category"
            className="field-select"
            value={category}
            onChange={(event) => setCategory(event.target.value as ProjectCategory)}
          >
            <option value="SOFTWARE">Software</option>
            <option value="FIRMWARE">Firmware</option>
          </select>

          <label className="field-label" htmlFor="edit-title">
            Title
          </label>
          <input id="edit-title" className="field-input" value={title} onChange={(event) => setTitle(event.target.value)} required />

          <label className="field-label" htmlFor="edit-slug">
            Slug
          </label>
          <input
            id="edit-slug"
            className="field-input"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder={slugify(title) || "auto-generated-from-title"}
            required
          />

          <label className="field-label" htmlFor="edit-summary">
            Summary
          </label>
          <input
            id="edit-summary"
            className="field-input"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            required
          />

          <label className="field-label" htmlFor="edit-github">
            GitHub URL
          </label>
          <input id="edit-github" className="field-input" value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} />

          <label className="field-label" htmlFor="edit-markdown">
            Content Markdown
          </label>
          <textarea
            id="edit-markdown"
            className="field-input"
            value={contentMarkdown}
            onChange={(event) => setContentMarkdown(event.target.value)}
            rows={9}
            required
          />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" type="submit" disabled={saving || deleting}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      ) : null}

      {notice ? <p className="success-text">{notice}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
