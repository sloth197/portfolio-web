"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAdminAuthHeader, getAdminAuthHeader } from "@/lib/admin-auth";
import type { ProjectCategory, ProjectDto } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
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

async function uploadSelectedFiles(projectId: number, auth: string, files: File[]): Promise<string[]> {
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
        headers: { Authorization: auth },
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
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const parsedCategory = normalizeCategory(new URLSearchParams(window.location.search).get("category"));
    setCategory(parsedCategory);

    const auth = getAdminAuthHeader();
    if (!auth) {
      const next = `/projects/admin/new?category=${parsedCategory}`;
      router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
    }
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!API_BASE) {
      setError("NEXT_PUBLIC_API_BASE_URL is not set.");
      return;
    }

    const auth = getAdminAuthHeader();
    if (!auth) {
      setError("Admin login session is missing. Please login again.");
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
          clearAdminAuthHeader();
          const next = `/projects/admin/new?category=${category}`;
          router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
          return;
        }
        setError(payload?.message ?? `Create failed (${response.status})`);
        return;
      }

      const createdProject = (await response.json()) as ProjectDto;
      const failedUploads = await uploadSelectedFiles(createdProject.id, auth, selectedFiles);
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
          Create firmware/software projects and optionally upload image, GIF, or document files.
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
            <option value="SOFTWARE">Software</option>
            <option value="FIRMWARE">Firmware</option>
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

          <label className="field-label" htmlFor="project-slug">
            Slug (URL)
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

          <label className="field-label" htmlFor="project-link">
            Link (GitHub/Docs)
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
            Content Markdown
          </label>
          <textarea
            id="project-markdown"
            className="field-input"
            value={contentMarkdown}
            onChange={(event) => setContentMarkdown(event.target.value)}
            rows={8}
            required
          />

          <label className="field-label" htmlFor="project-files">
            Files (Image/GIF/Docs)
          </label>
          <input
            id="project-files"
            className="field-input"
            type="file"
            multiple
            accept={FILE_INPUT_ACCEPT}
            onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
          />
          <p className="helper-text" style={{ margin: 0 }}>
            {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : "No files selected."}
          </p>

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
