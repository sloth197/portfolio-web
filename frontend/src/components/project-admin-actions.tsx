"use client";

import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { canAdminManageProjects, clearAdminAuthHeader, isAdminLoggedIn, subscribeAdminAuth } from "@/lib/admin-auth";
import { useSiteLanguage } from "@/components/i18n-text";
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
  const language = useSiteLanguage();
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState<ProjectCategory>(project.category);
  const [title, setTitle] = useState(project.title);
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
  const t = language === "ko"
    ? {
        previewNoEdit: "미리보기 모드에서는 수정/삭제를 지원하지 않습니다.",
        apiBaseMissing: "NEXT_PUBLIC_API_BASE_URL이 설정되어 있지 않습니다.",
        updateFailed: (status: number) => `수정 실패 (${status})`,
        projectUpdated: "프로젝트가 수정되었습니다.",
        projectUpdatedUploaded: (count: number) => `프로젝트가 수정되었습니다. 파일 ${count}개를 업로드했습니다.`,
        uploadFailed: (names: string) => `일부 파일 업로드에 실패했습니다: ${names}`,
        updateRequestFailed: "수정 요청에 실패했습니다.",
        deleteConfirm: "이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
        deleteFailed: (status: number) => `삭제 실패 (${status})`,
        deleteRequestFailed: "삭제 요청에 실패했습니다.",
        assetDeleteFailed: (status: number) => `파일 삭제 실패 (${status})`,
        assetRemoved: "파일이 삭제되었습니다.",
        assetDeleteRequestFailed: "파일 삭제 요청에 실패했습니다.",
        cancelEdit: "수정 취소",
        edit: "수정",
        deleting: "삭제 중...",
        delete: "삭제",
        category: "카테고리",
        title: "제목",
        summary: "요약",
        projectPeriod: "프로젝트 기간",
        periodPlaceholder: "yyyy.mm - yyyy.mm",
        url: "URL",
        projectDetails: "프로젝트 상세",
        addFilesLabel: "파일 추가 (이미지/GIF/문서)",
        addFiles: "파일 추가",
        noFilesSelected: "선택된 새 파일이 없습니다.",
        currentFiles: "현재 파일",
        removing: "삭제 중...",
        remove: "삭제",
        saving: "저장 중...",
        save: "저장",
      }
    : {
        previewNoEdit: "Preview mode does not support edit/delete.",
        apiBaseMissing: "NEXT_PUBLIC_API_BASE_URL is not set.",
        updateFailed: (status: number) => `Update failed (${status})`,
        projectUpdated: "Project updated.",
        projectUpdatedUploaded: (count: number) => `Project updated. Uploaded ${count} file(s).`,
        uploadFailed: (names: string) => `Some files failed to upload: ${names}`,
        updateRequestFailed: "Update request failed.",
        deleteConfirm: "Delete this project? This action cannot be undone.",
        deleteFailed: (status: number) => `Delete failed (${status})`,
        deleteRequestFailed: "Delete request failed.",
        assetDeleteFailed: (status: number) => `Asset delete failed (${status})`,
        assetRemoved: "Asset removed.",
        assetDeleteRequestFailed: "Asset delete request failed.",
        cancelEdit: "Cancel Edit",
        edit: "Edit",
        deleting: "Deleting...",
        delete: "Delete",
        category: "Category",
        title: "Title",
        summary: "Summary",
        projectPeriod: "Project Period",
        periodPlaceholder: "yyyy.mm - yyyy.mm",
        url: "URL",
        projectDetails: "Project Details",
        addFilesLabel: "Add Files (Image/GIF/Docs)",
        addFiles: "Add files",
        noFilesSelected: "No new files selected.",
        currentFiles: "Current Files",
        removing: "Removing...",
        remove: "Remove",
        saving: "Saving...",
        save: "Save",
      };

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

  function requireSession(): boolean {
    if (!isAdminLoggedIn()) {
      router.replace(`/admin/login?next=${encodeURIComponent(resolveCurrentPath())}`);
      return false;
    }
    return true;
  }

  async function uploadSelectedFiles(): Promise<{ uploaded: ProjectAssetDto[]; failed: string[] }> {
    const uploaded: ProjectAssetDto[] = [];
    const failed: string[] = [];

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(`${API_BASE}/api/admin/projects/${project.id}/assets`, {
          method: "POST",
          credentials: "include",
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
      setError(t.previewNoEdit);
      return;
    }
    if (!requireSession()) {
      return;
    }
    setError(null);
    setNotice(null);
    setEditing(true);
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) {
      setError(t.previewNoEdit);
      return;
    }
    if (!API_BASE) {
      setError(t.apiBaseMissing);
      return;
    }

    if (!requireSession()) {
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const autoSlug = slugify(title);
      const response = await fetch(`${API_BASE}/api/admin/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          category,
          title: title.trim(),
          // Keep backward compatibility with older backend versions that still require slug.
          slug: project.slug || autoSlug || `project-${project.id}`,
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
        setError(payload?.message ?? t.updateFailed(response.status));
        return;
      }

      let noticeMessage = t.projectUpdated;

      if (selectedFiles.length > 0) {
        const uploadResult = await uploadSelectedFiles();
        if (uploadResult.uploaded.length > 0) {
          setAssets((prev) => [...prev, ...uploadResult.uploaded]);
          noticeMessage = t.projectUpdatedUploaded(uploadResult.uploaded.length);
          setSelectedFiles([]);
        }
        if (uploadResult.failed.length > 0) {
          setError(t.uploadFailed(uploadResult.failed.join(", ")));
        }
      }

      setNotice(noticeMessage);
      setEditing(false);
      router.refresh();
    } catch {
      setError(t.updateRequestFailed);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (disabled) {
      setError(t.previewNoEdit);
      return;
    }
    if (!API_BASE) {
      setError(t.apiBaseMissing);
      return;
    }
    if (!confirm(t.deleteConfirm)) {
      return;
    }

    if (!requireSession()) {
      return;
    }

    setDeleting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/projects/${project.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        if (response.status === 401 || response.status === 403) {
          clearAdminAuthHeader();
          router.replace(`/admin/login?next=${encodeURIComponent(resolveCurrentPath())}`);
          return;
        }
        setError(payload?.message ?? t.deleteFailed(response.status));
        return;
      }

      router.replace(returnPath);
      router.refresh();
    } catch {
      setError(t.deleteRequestFailed);
    } finally {
      setDeleting(false);
    }
  }

  async function onDeleteAsset(assetId: number) {
    if (!API_BASE) {
      setError(t.apiBaseMissing);
      return;
    }

    if (!requireSession()) {
      return;
    }

    setDeletingAssetId(assetId);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/projects/${project.id}/assets/${assetId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        if (response.status === 401 || response.status === 403) {
          clearAdminAuthHeader();
          router.replace(`/admin/login?next=${encodeURIComponent(resolveCurrentPath())}`);
          return;
        }
        setError(payload?.message ?? t.assetDeleteFailed(response.status));
        return;
      }

      setAssets((prev) => prev.filter((item) => item.id !== assetId));
      setNotice(t.assetRemoved);
    } catch {
      setError(t.assetDeleteRequestFailed);
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
            {deleting ? t.deleting : t.delete}
          </button>
        ) : null}
      </div>

      {editing && canEdit ? (
        <form onSubmit={onSave} style={{ display: "grid", gap: 10 }}>
          <label className="field-label" htmlFor="edit-category">
            {t.category}
          </label>
          <select
            id="edit-category"
            className="field-select"
            value={category}
            onChange={(event) => setCategory(event.target.value as ProjectCategory)}
          >
            <option value="SOFTWARE">C#</option>
            <option value="FIRMWARE">Java</option>
          </select>

          <label className="field-label" htmlFor="edit-title">
            {t.title}
          </label>
          <input id="edit-title" className="field-input" value={title} onChange={(event) => setTitle(event.target.value)} required />

          <label className="field-label" htmlFor="edit-summary">
            {t.summary}
          </label>
          <input
            id="edit-summary"
            className="field-input"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            required
          />

          <label className="field-label" htmlFor="edit-period">
            {t.projectPeriod}
          </label>
          <input
            id="edit-period"
            className="field-input"
            value={projectPeriod}
            onChange={(event) => setProjectPeriod(event.target.value)}
            maxLength={80}
            placeholder={t.periodPlaceholder}
          />

          <label className="field-label" htmlFor="edit-github">
            {t.url}
          </label>
          <input id="edit-github" className="field-input" value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} />

          <label className="field-label" htmlFor="edit-markdown">
            {t.projectDetails}
          </label>
          <NotionMarkdownEditor
            id="edit-markdown"
            value={contentMarkdown}
            onValueChange={setContentMarkdown}
            rows={12}
            required
          />

          <label className="field-label" htmlFor="edit-files">
            {t.addFilesLabel}
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
              {t.addFiles}
            </label>
            <p className="helper-text file-picker-names">
              {selectedFiles.length > 0 ? selectedFiles.map((file) => file.name).join(", ") : t.noFilesSelected}
            </p>
          </div>

          {sortedAssets.length > 0 ? (
            <div style={{ display: "grid", gap: 8 }}>
              <div className="field-label">{t.currentFiles}</div>
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
                        {deletingAssetId === asset.id ? t.removing : t.remove}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" type="submit" disabled={saving || deleting || deletingAssetId !== null}>
              {saving ? t.saving : t.save}
            </button>
          </div>
        </form>
      ) : null}

      {notice ? <p className="success-text">{notice}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
