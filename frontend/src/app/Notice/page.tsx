"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import I18nText from "@/components/i18n-text";
import {
  clearAdminAuthHeader,
  getAdminAuthHeader,
  getAdminRole,
  isAdminLoggedIn,
  subscribeAdminAuth,
  type AdminRole,
} from "@/lib/admin-auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

type NoticeDto = {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

function getServerSnapshot(): boolean {
  return false;
}

function getServerRoleSnapshot(): AdminRole | null {
  return null;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function sortNotices(items: NoticeDto[]): NoticeDto[] {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export default function NoticePage() {
  const adminLoggedIn = useSyncExternalStore(subscribeAdminAuth, isAdminLoggedIn, getServerSnapshot);
  const adminRole = useSyncExternalStore(subscribeAdminAuth, getAdminRole, getServerRoleSnapshot);
  const canManageNotices = useMemo(() => adminLoggedIn && adminRole === "ADMIN", [adminLoggedIn, adminRole]);

  const [notices, setNotices] = useState<NoticeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);

  const loadNotices = useCallback(async () => {
    if (!API_BASE) {
      setListError("NEXT_PUBLIC_API_BASE_URL is not set.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setListError(null);
      const response = await fetch(`${API_BASE}/api/public/notices`, {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setListError(payload?.message ?? `Failed to load notices (${response.status})`);
        return;
      }
      const payload = (await response.json()) as NoticeDto[];
      setNotices(sortNotices(payload));
    } catch {
      setListError("Failed to load notices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotices();
  }, [loadNotices]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setContent("");
    setPinned(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageNotices) {
      setFormError("Notice management requires an ADMIN account.");
      return;
    }
    if (!API_BASE) {
      setFormError("NEXT_PUBLIC_API_BASE_URL is not set.");
      return;
    }

    const auth = getAdminAuthHeader();
    if (!auth) {
      setFormError("Admin login session is missing. Please login again.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFormNotice(null);

    const isEditing = editingId !== null;
    const endpoint = isEditing ? `${API_BASE}/api/admin/notices/${editingId}` : `${API_BASE}/api/admin/notices`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          pinned,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        if (response.status === 401 || response.status === 403) {
          clearAdminAuthHeader();
          setFormError("Admin session expired. Please login again.");
          return;
        }
        setFormError(payload?.message ?? `Request failed (${response.status})`);
        return;
      }

      const savedNotice = (await response.json()) as NoticeDto;
      if (isEditing) {
        setNotices((current) => sortNotices(current.map((item) => (item.id === savedNotice.id ? savedNotice : item))));
        setFormNotice("Notice updated.");
      } else {
        setNotices((current) => sortNotices([savedNotice, ...current]));
        setFormNotice("Notice created.");
      }

      resetForm();
      setShowForm(false);
    } catch {
      setFormError("Request failed while saving notice.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: number) {
    if (!canManageNotices) {
      setFormError("Notice management requires an ADMIN account.");
      return;
    }
    if (!API_BASE) {
      setFormError("NEXT_PUBLIC_API_BASE_URL is not set.");
      return;
    }

    const auth = getAdminAuthHeader();
    if (!auth) {
      setFormError("Admin login session is missing. Please login again.");
      return;
    }

    const confirmed = window.confirm("삭제하시겠습니까?");
    if (!confirmed) {
      return;
    }

    setFormError(null);
    setFormNotice(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/notices/${id}`, {
        method: "DELETE",
        headers: { Authorization: auth },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        if (response.status === 401 || response.status === 403) {
          clearAdminAuthHeader();
          setFormError("Admin session expired. Please login again.");
          return;
        }
        setFormError(payload?.message ?? `Delete failed (${response.status})`);
        return;
      }

      setNotices((current) => current.filter((item) => item.id !== id));
      if (editingId === id) {
        resetForm();
      }
      setFormNotice("Notice deleted.");
    } catch {
      setFormError("Request failed while deleting notice.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="surface-card top-banner" style={{ padding: "22px clamp(18px, 4vw, 30px)", display: "grid", gap: 10 }}>
        <span className="badge">Notice</span>
        <h1 className="section-title">Notice</h1>
        <p className="section-copy">
          <I18nText ko="사이트 공지와 업데이트 내역을 확인하는 공간입니다." en="This is where site announcements and update notes are posted." />
        </p>
      </section>

      <section style={{ display: "grid", gap: 12, maxWidth: 860 }}>
        {!loading && !listError && notices.length > 0 && canManageNotices ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (showForm) {
                  resetForm();
                  setShowForm(false);
                  return;
                }
                resetForm();
                setFormError(null);
                setFormNotice(null);
                setShowForm(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              {showForm ? "등록 취소" : "등록"}
            </button>
            {formNotice ? <span className="success-text">{formNotice}</span> : null}
            {formError ? <span className="error-text">{formError}</span> : null}
          </div>
        ) : null}

        {loading ? <p className="helper-text">Loading notices...</p> : null}
        {listError ? <p className="error-text">{listError}</p> : null}
        {!loading && !listError && notices.length === 0 ? (
          <>
            <p className="helper-text">
              <I18nText ko="등록된 공지가 아직 없습니다." en="No notices have been posted yet." />
            </p>
            {canManageNotices ? (
              <div>
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    resetForm();
                    setFormError(null);
                    setFormNotice(null);
                    setShowForm(true);
                  }}
                >
                  등록
                </button>
              </div>
            ) : null}
          </>
        ) : null}
        {!loading && !listError
          ? notices.map((item) => (
              <article key={item.id} className="panel" style={{ padding: 16, display: "grid", gap: 8 }}>
                <time style={{ fontSize: 12, fontWeight: 700, opacity: 0.78 }} dateTime={item.createdAt}>
                  {formatDate(item.createdAt)}
                </time>
                {item.pinned ? <span className="badge">Pinned</span> : null}
                <h2 style={{ margin: 0, fontSize: 20, letterSpacing: "-0.02em" }}>{item.title}</h2>
                <p className="section-copy" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {item.content}
                </p>
                {canManageNotices ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setTitle(item.title);
                        setContent(item.content);
                        setPinned(item.pinned);
                        setFormError(null);
                        setFormNotice(null);
                        setShowForm(true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Edit
                    </button>
                    <button className="btn-ghost" type="button" onClick={() => void onDelete(item.id)}>
                      Delete
                    </button>
                  </div>
                ) : null}
              </article>
            ))
          : null}
      </section>

      {canManageNotices && showForm ? (
        <section className="panel" style={{ padding: 16, display: "grid", gap: 10, maxWidth: 860 }}>
          <h2 className="project-detail-subtitle" style={{ margin: 0 }}>
            {editingId === null ? "Create Notice" : "Edit Notice"}
          </h2>
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
            <label className="field-label" htmlFor="notice-title">
              Title
            </label>
            <input
              id="notice-title"
              className="field-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={140}
              required
            />
            <label className="field-label" htmlFor="notice-content">
              Content
            </label>
            <textarea
              id="notice-content"
              className="field-input"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={6}
              maxLength={5000}
              required
              style={{ resize: "vertical", minHeight: 140 }}
            />
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, width: "fit-content", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={pinned}
                onChange={(event) => setPinned(event.target.checked)}
              />
              <span className="field-label" style={{ margin: 0 }}>
                Pin to top
              </span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <button className="btn" type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingId === null ? "Create" : "Update"}
              </button>
              <button
                className="btn-ghost"
                type="button"
                onClick={() => {
                  resetForm();
                  setFormError(null);
                  setFormNotice(null);
                  setShowForm(false);
                }}
              >
                Cancel
              </button>
              {formNotice ? <span className="success-text">{formNotice}</span> : null}
              {formError ? <span className="error-text">{formError}</span> : null}
            </div>
          </form>
        </section>
      ) : null}

      {!canManageNotices && adminLoggedIn ? (
        <section className="panel" style={{ padding: 16, maxWidth: 860 }}>
          <p className="helper-text">
            <I18nText
              ko="현재 계정은 공지 읽기 전용입니다. 작성/수정/삭제는 ADMIN 계정에서만 가능합니다."
              en="This account is read-only for notices. Create/Edit/Delete is available only for ADMIN accounts."
            />
          </p>
        </section>
      ) : null}
    </div>
  );
}
