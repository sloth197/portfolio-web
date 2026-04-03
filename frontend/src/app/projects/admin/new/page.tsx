"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAdminAuthHeader, getAdminRole, isAdminLoggedIn, setAdminAuthSession } from "@/lib/admin-auth";
import { getPublicApiBaseUrl } from "@/lib/api-base";
import NotionMarkdownEditor from "@/components/notion-markdown-editor";
import type { ProjectCategory, ProjectDto } from "@/lib/types";

const API_BASE = getPublicApiBaseUrl();
const FILE_INPUT_ACCEPT = "image/*,.pdf,.zip,.md,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx";

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

async function uploadSelectedFiles(projectId: number, files: File[]): Promise<string[]> {
  if (!API_BASE || files.length === 0) {
    return [];
  }

  const failures: string[] = [];

  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE}/api/admin/projects/${projectId}/assets`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        failures.push(file.name);
      }
    } catch {
      failures.push(file.name);
    }
  }

  return failures;
}

export default function AdminProjectCreatePage() {
  const router = useRouter();
  const [category, setCategory] = useState<ProjectCategory>("SOFTWARE");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [projectPeriod, setProjectPeriod] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const parsedCategory = normalizeCategory(new URLSearchParams(window.location.search).get("category"));
    setCategory(parsedCategory);

    if (!isAdminLoggedIn()) {
      const next = `/projects/admin/new?category=${parsedCategory}`;
      router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function verifySession() {
      try {
        const response = await fetch("/api/admin/auth/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          clearAdminAuthHeader();
          const next = `/projects/admin/new?category=${parsedCategory}`;
          router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
          return;
        }
        const payload = (await response.json().catch(() => null)) as { authenticated?: boolean; role?: string } | null;
        if (!payload?.authenticated) {
          clearAdminAuthHeader();
          const next = `/projects/admin/new?category=${parsedCategory}`;
          router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
          return;
        }
        const role = payload.role === "CRM" ? "CRM" : "ADMIN";
        if (!cancelled) {
          setAdminAuthSession(role);
        }
        if (role !== "ADMIN") {
          router.replace("/projects");
        }
      } catch {
        if (!cancelled) {
          setError("Failed to verify admin session.");
        }
      }
    }

    void verifySession();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!API_BASE) {
      setError("NEXT_PUBLIC_API_BASE_URL is not set.");
      return;
    }

    if (!isAdminLoggedIn()) {
      setError("Admin login session is missing. Please login again.");
      return;
    }
    if (getAdminRole() !== "ADMIN") {
      setError("This account does not have project management permission.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const autoSlug = slugify(title);
      const response = await fetch(`${API_BASE}/api/admin/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          category,
          title: title.trim(),
          // Keep backward compatibility with older backend versions that still require slug.
          slug: autoSlug || `project-${Date.now()}`,
          summary: summary.trim(),
          projectPeriod: projectPeriod.trim() || null,
          contentMarkdown: contentMarkdown.trim(),
          githubUrl: linkUrl.trim() || null,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        if (response.status === 401 || response.status === 403) {
          clearAdminAuthHeader();
          const next = `/projects/admin/new?category=${category}`;
          router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
          return;
        }
        setError(payload?.message ?? `Create failed (${response.status})`);
        return;
      }

      const createdProject = (await response.json()) as ProjectDto;
      const failedUploads = await uploadSelectedFiles(createdProject.id, selectedFiles);
      const uploadedCount = selectedFiles.length - failedUploads.length;

      if (failedUploads.length > 0) {
        setError(`Project created, but ${failedUploads.length} file(s) failed: ${failedUploads.join(", ")}`);
      }

      setNotice(uploadedCount > 0 ? `Project created. Uploaded ${uploadedCount} file(s).` : "Project created.");
      setTimeout(() => {
        router.replace(`/projects?category=${category}`);
      }, 700);
    } catch {
      setError("Request failed while creating project.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="surface-card top-banner top-banner-admin" style={{ padding: "22px clamp(18px, 4vw, 30px)", display: "grid", gap: 8 }}>
        <span className="badge">Admin</span>
        <h1 className="section-title">Create Project</h1>
        <p className="section-copy" style={{ fontSize: 14 }}>
          Create Java/C# projects and optionally upload image, GIF, or document files.
        </p>
      </section>

      <section className="panel" style={{ padding: 16, display: "grid", gap: 10 }}>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
          <label className="field-label" htmlFor="project-category">
            Category
          </label>
          <select
            id="project-category"
            className="field-select"
            value={category}
            onChange={(event) => setCategory(event.target.value as ProjectCategory)}
          >
            <option value="SOFTWARE">C#</option>
            <option value="FIRMWARE">Java</option>
          </select>

          <label className="field-label" htmlFor="project-title">
            Title
          </label>
          <input
            id="project-title"
            className="field-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            required
          />

          <label className="field-label" htmlFor="project-summary">
            Summary
          </label>
          <input
            id="project-summary"
            className="field-input"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            maxLength={300}
            required
          />

          <label className="field-label" htmlFor="project-period">
            Project Period
          </label>
          <input
            id="project-period"
            className="field-input"
            value={projectPeriod}
            onChange={(event) => setProjectPeriod(event.target.value)}
            maxLength={80}
            placeholder="yyyy.mm - yyyy.mm"
          />
          <label className="field-label" htmlFor="project-link">
            URL
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
            Project Details
          </label>
          <NotionMarkdownEditor
            id="project-markdown"
            value={contentMarkdown}
            onValueChange={setContentMarkdown}
            rows={12}
            required
          />

          <label className="field-label" htmlFor="project-files">
            Files (Image/GIF/Docs)
          </label>
          <div className="file-picker-row">
            <input
              id="project-files"
              className="hidden-file-input"
              type="file"
              multiple
              accept={FILE_INPUT_ACCEPT}
              onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
            />
            <label htmlFor="project-files" className="btn-ghost file-picker-button">
              Add files
            </label>
            <p className="helper-text file-picker-names">
              {selectedFiles.length > 0 ? selectedFiles.map((file) => file.name).join(", ") : "No files selected."}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create"}
            </button>
            {notice ? <span className="success-text">{notice}</span> : null}
            {error ? <span className="error-text">{error}</span> : null}
          </div>
        </form>
      </section>
    </div>
  );
}
