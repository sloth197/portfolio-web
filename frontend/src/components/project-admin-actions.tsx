"use client";

import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { canAdminManageProjects, clearAdminAuthHeader, getAdminAuthHeader, subscribeAdminAuth } from "@/lib/admin-auth";
import NotionMarkdownEditor from "@/components/notion-markdown-editor";
import type { ProjectAssetDto, ProjectCategory, ProjectDto } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const FILE_INPUT_ACCEPT = "image/*,.pdf,.zip,.md,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx";

type Props = {
  project: ProjectDto;
  returnPath: string;
  disabled?: boolean;
};

function getServerSnapshot(): boolean {
  return false;
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

function resolveAssetUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (API_BASE) {
    return `${API_BASE}${url}`;
  }
  return url;
}

export default function ProjectAdminActions({ project, returnPath, disabled = false }: Props) {
  const router = useRouter();
  const canManageProjects = useSyncExternalStore(subscribeAdminAuth, canAdminManageProjects, getServerSnapshot);
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState<ProjectCategory>(project.category);
  const [title, setTitle] = useState(project.title);
  const [slug, setSlug] = useState(project.slug);
  const [summary, setSummary] = useState(project.summary);
  const [projectPeriod, setProjectPeriod] = useState(project.projectPeriod ?? "");
  const [contentMarkdown, setContentMarkdown] = useState(project.contentMarkdown);
  const [githubUrl, setGithubUrl] = useState(project.githubUrl ?? "");
  const [assets, setAssets] = useState<ProjectAssetDto[]>(project.assets ?? []);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canEdit = canManageProjects && !disabled;

  useEffect(() => {
    if (!canManageProjects && editing) {
      setEditing(false);
    }
  }, [canManageProjects, editing]);

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
    const auth = getAdminAuthHeader();
    if (!auth) {
      router.replace(`/admin/login?next=${encodeURIComponent(resolveCurrentPath())}`);
      return null;
    }
    return auth;
  }

  async function uploadSelectedFiles(auth: string): Promise<{ uploaded: ProjectAssetDto[]; failed: string[] }> {
    const uploaded: ProjectAssetDto[] = [];
    const failed: string[] = [];

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(`${API_BASE}/api/admin/projects/${project.id}/assets`, {
          method: "POST",
          headers: { Authorization: auth },
          body: formData,
        });

        if (!response.ok) {
          failed.push(file.name);
          continue;
        }

        const createdAsset = (await response.json()) as ProjectAssetDto;
        uploaded.push(createdAsset);
      } catch {
        failed.push(file.name);
      }
    }

    return { uploaded, failed };
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
          projectPeriod: projectPeriod.trim() || null,
          contentMarkdown: contentMarkdown.trim(),
          githubUrl: githubUrl.trim() || null,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        if (response.status === 401 || response.status === 403) {
          clearAdminAuthHeader();
          router.replace(`/admin/login?next=${encodeURIComponent(resolveCurrentPath())}`);
          return;
        }
        setError(payload?.message ?? `Update failed (${response.status})`);
        return;
      }

      let noticeMessage = "Project updated.";

      if (selectedFiles.length > 0) {
        const uploadResult = await uploadSelectedFiles(auth);
        if (uploadResult.uploaded.length > 0) {
          setAssets((prev) => [...prev, ...uploadResult.uploaded]);
          noticeMessage = `Project updated. Uploaded ${uploadResult.uploaded.length} file(s).`;
          setSelectedFiles([]);
        }
        if (uploadResult.failed.length > 0) {
          setError(`Some files failed to upload: ${uploadResult.failed.join(", ")}`);
        }
      }

      setNotice(noticeMessage);
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
          clearAdminAuthHeader();
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

  async function onDeleteAsset(assetId: number) {
    if (!API_BASE) {
      setError("NEXT_PUBLIC_API_BASE_URL is not set.");
      return;
    }

    const auth = requireAuthHeader();
    if (!auth) {
      return;
    }

    setDeletingAssetId(assetId);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/projects/${project.id}/assets/${assetId}`, {
        method: "DELETE",
        headers: { Authorization: auth },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        if (response.status === 401 || response.status === 403) {
          clearAdminAuthHeader();
          router.replace(`/admin/login?next=${encodeURIComponent(resolveCurrentPath())}`);
          return;
        }
        setError(payload?.message ?? `Asset delete failed (${response.status})`);
        return;
      }

      setAssets((prev) => prev.filter((item) => item.id !== assetId));
      setNotice("Asset removed.");
    } catch {
      setError("Asset delete request failed.");
    } finally {
      setDeletingAssetId(null);
    }
  }

  const sortedAssets = useMemo(() => [...assets].sort((a, b) => a.id - b.id), [assets]);

  if (!canManageProjects) {
    return null;
  }

  return (
    <section className="panel" style={{ padding: 14, display: "grid", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn-ghost" onClick={() => (editing ? setEditing(false) : onStartEdit())}>
          {editing ? "Cancel Edit" : "Edit"}
        </button>
        {editing && canEdit ? (
          <button type="button" className="btn-ghost" onClick={onDelete} disabled={deleting || saving}>
            {deleting ? "Deleting..." : "Delete"}
          </button>
        ) : null}
      </div>

      {editing && canEdit ? (
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

          <label className="field-label" htmlFor="edit-period">
            Project Period
          </label>
          <input
            id="edit-period"
            className="field-input"
            value={projectPeriod}
            onChange={(event) => setProjectPeriod(event.target.value)}
            maxLength={80}
            placeholder="2026.01 - 2026.03"
          />

          <label className="field-label" htmlFor="edit-github">
            GitHub URL
          </label>
          <input id="edit-github" className="field-input" value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} />

          <label className="field-label" htmlFor="edit-markdown">
            Project Details (Notion-style Markdown)
          </label>
          <NotionMarkdownEditor
            id="edit-markdown"
            value={contentMarkdown}
            onValueChange={setContentMarkdown}
            rows={12}
            required
          />

          <label className="field-label" htmlFor="edit-files">
            Add Files (Image/GIF/Docs)
          </label>
          <div className="file-picker-row">
            <input
              id="edit-files"
              className="hidden-file-input"
              type="file"
              multiple
              accept={FILE_INPUT_ACCEPT}
              onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
            />
            <label htmlFor="edit-files" className="btn-ghost file-picker-button">
              Add files
            </label>
            <p className="helper-text file-picker-names">
              {selectedFiles.length > 0 ? selectedFiles.map((file) => file.name).join(", ") : "No new files selected."}
            </p>
          </div>

          {sortedAssets.length > 0 ? (
            <div style={{ display: "grid", gap: 8 }}>
              <div className="field-label">Current Files</div>
              <div className="admin-asset-list">
                {sortedAssets.map((asset) => {
                  const assetUrl = resolveAssetUrl(asset.url);
                  return (
                    <div key={asset.id} className="admin-asset-item">
                      <a href={assetUrl} target="_blank" rel="noreferrer" className="admin-asset-link">
                        {asset.originalName}
                      </a>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => onDeleteAsset(asset.id)}
                        disabled={deletingAssetId === asset.id || saving || deleting}
                      >
                        {deletingAssetId === asset.id ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" type="submit" disabled={saving || deleting || deletingAssetId !== null}>
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
