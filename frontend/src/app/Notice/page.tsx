"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import I18nText, { useSiteLanguage } from "@/components/i18n-text";
import {
  clearAdminAuthHeader,
  getAdminRole,
  isAdminLoggedIn,
  subscribeAdminAuth,
  type AdminRole,
  withAdminAuthHeaders,
} from "@/lib/admin-auth";

const PUBLIC_NOTICES_API = "/api/public/notices";
const ADMIN_NOTICES_API = "/api/admin/notices";
const DEFAULT_NOTICE_FONT_SIZE = 18;
const MIN_NOTICE_FONT_SIZE = 12;
const MAX_NOTICE_FONT_SIZE = 48;

type NoticeDto = {
  id: number;
  content: string;
  pinned: boolean;
  fontSize: number;
  createdAt: string;
  updatedAt: string;
};

function getServerSnapshot(): boolean {
  return false;
}

function getServerRoleSnapshot(): AdminRole | null {
  return null;
}

function formatDate(value: string, language: "ko" | "en"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(language === "en" ? "en-US" : "ko-KR");
}

function sortNotices(items: NoticeDto[]): NoticeDto[] {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function normalizeNoticeFontSize(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_NOTICE_FONT_SIZE;
  }
  if (value < MIN_NOTICE_FONT_SIZE) {
    return MIN_NOTICE_FONT_SIZE;
  }
  if (value > MAX_NOTICE_FONT_SIZE) {
    return MAX_NOTICE_FONT_SIZE;
  }
  return Math.round(value);
}

export default function NoticePage() {
  const language = useSiteLanguage();
  const adminLoggedIn = useSyncExternalStore(subscribeAdminAuth, isAdminLoggedIn, getServerSnapshot);
  const adminRole = useSyncExternalStore(subscribeAdminAuth, getAdminRole, getServerRoleSnapshot);
  const canManageNotices = useMemo(() => adminLoggedIn && adminRole === "ADMIN", [adminLoggedIn, adminRole]);

  const t = useMemo(
    () => ({
      loadNoticesFailed: language === "en" ? "Failed to load notices." : "공지 목록을 불러오지 못했습니다.",
      noticeManagementRequiresAdmin:
        language === "en" ? "Notice management requires an ADMIN account." : "공지 관리는 ADMIN 계정이 필요합니다.",
      adminSessionMissing:
        language === "en" ? "Admin login session is missing. Please login again." : "관리자 로그인 세션이 없습니다. 다시 로그인해 주세요.",
      adminSessionExpired:
        language === "en" ? "Admin session expired. Please login again." : "관리자 세션이 만료되었습니다. 다시 로그인해 주세요.",
      requestFailedWhileSaving: language === "en" ? "Request failed while saving notice." : "공지 저장 요청에 실패했습니다.",
      requestFailedWhileDeleting: language === "en" ? "Request failed while deleting notice." : "공지 삭제 요청에 실패했습니다.",
      noticeUpdated: language === "en" ? "Notice updated." : "공지가 수정되었습니다.",
      noticeCreated: language === "en" ? "Notice created." : "공지가 등록되었습니다.",
      noticeDeleted: language === "en" ? "Notice deleted." : "공지가 삭제되었습니다.",
      deleteConfirm: language === "en" ? "Do you want to delete this notice?" : "삭제하시겠습니까?",
      requestFailedPrefix: language === "en" ? "Request failed" : "요청 실패",
      deleteFailedPrefix: language === "en" ? "Delete failed" : "삭제 실패",
      loadingNotices: language === "en" ? "Loading notices..." : "공지를 불러오는 중...",
      pinned: language === "en" ? "Pinned" : "상단 고정",
      edit: language === "en" ? "Edit" : "수정",
      delete: language === "en" ? "Delete" : "삭제",
      createNotice: language === "en" ? "Create Notice" : "공지 등록",
      editNotice: language === "en" ? "Edit Notice" : "공지 수정",
      content: language === "en" ? "Content" : "내용",
      textSize: language === "en" ? "Text size" : "글자 크기",
      pinToTop: language === "en" ? "Pin to top" : "상단 고정",
      saving: language === "en" ? "Saving..." : "저장 중...",
      create: language === "en" ? "Create" : "등록",
      update: language === "en" ? "Update" : "수정",
      cancel: language === "en" ? "Cancel" : "취소",
      register: language === "en" ? "Create" : "등록",
      registerCancel: language === "en" ? "Cancel Create" : "등록 취소",
    }),
    [language],
  );

  const [notices, setNotices] = useState<NoticeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [fontSize, setFontSize] = useState(DEFAULT_NOTICE_FONT_SIZE);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);

  const loadNotices = useCallback(async () => {
    try {
      setLoading(true);
      setListError(null);
      const response = await fetch(PUBLIC_NOTICES_API, {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setListError(payload?.message ?? `${t.loadNoticesFailed} (${response.status})`);
        return;
      }
      const payload = (await response.json()) as NoticeDto[];
      const normalized = payload.map((item) => ({
        ...item,
        fontSize: normalizeNoticeFontSize(item.fontSize),
      }));
      setNotices(sortNotices(normalized));
    } catch {
      setListError(t.loadNoticesFailed);
    } finally {
      setLoading(false);
    }
  }, [t.loadNoticesFailed]);

  useEffect(() => {
    void loadNotices();
  }, [loadNotices]);

  function resetForm() {
    setEditingId(null);
    setContent("");
    setPinned(false);
    setFontSize(DEFAULT_NOTICE_FONT_SIZE);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageNotices) {
      setFormError(t.noticeManagementRequiresAdmin);
      return;
    }

    if (!adminLoggedIn) {
      setFormError(t.adminSessionMissing);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFormNotice(null);

    const isEditing = editingId !== null;
    const endpoint = isEditing ? `${ADMIN_NOTICES_API}/${editingId}` : ADMIN_NOTICES_API;
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: withAdminAuthHeaders({
          "Content-Type": "application/json",
        }),
        credentials: "include",
        body: JSON.stringify({
          // Keep legacy compatibility with older backend versions requiring title.
          title: "공지",
          content: content.trim(),
          pinned,
          fontSize: normalizeNoticeFontSize(fontSize),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        if (response.status === 401 || response.status === 403) {
          clearAdminAuthHeader();
          setFormError(t.adminSessionExpired);
          return;
        }
        setFormError(payload?.message ?? `${t.requestFailedPrefix} (${response.status})`);
        return;
      }

      const savedNotice = (await response.json()) as NoticeDto;
      const normalizedSavedNotice = {
        ...savedNotice,
        fontSize: normalizeNoticeFontSize(savedNotice.fontSize),
      };
      if (isEditing) {
        setNotices((current) =>
          sortNotices(current.map((item) => (item.id === normalizedSavedNotice.id ? normalizedSavedNotice : item))),
        );
        setFormNotice(t.noticeUpdated);
      } else {
        setNotices((current) => sortNotices([normalizedSavedNotice, ...current]));
        setFormNotice(t.noticeCreated);
      }

      resetForm();
      setShowForm(false);
    } catch {
      setFormError(t.requestFailedWhileSaving);
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: number) {
    if (!canManageNotices) {
      setFormError(t.noticeManagementRequiresAdmin);
      return;
    }

    if (!adminLoggedIn) {
      setFormError(t.adminSessionMissing);
      return;
    }

    const confirmed = window.confirm(t.deleteConfirm);
    if (!confirmed) {
      return;
    }

    setFormError(null);
    setFormNotice(null);

    try {
      const response = await fetch(`${ADMIN_NOTICES_API}/${id}`, {
        method: "DELETE",
        headers: withAdminAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        if (response.status === 401 || response.status === 403) {
          clearAdminAuthHeader();
          setFormError(t.adminSessionExpired);
          return;
        }
        setFormError(payload?.message ?? `${t.deleteFailedPrefix} (${response.status})`);
        return;
      }

      setNotices((current) => current.filter((item) => item.id !== id));
      if (editingId === id) {
        resetForm();
      }
      setFormNotice(t.noticeDeleted);
    } catch {
      setFormError(t.requestFailedWhileDeleting);
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
              {showForm ? t.registerCancel : t.register}
            </button>
            {formNotice ? <span className="success-text">{formNotice}</span> : null}
            {formError ? <span className="error-text">{formError}</span> : null}
          </div>
        ) : null}

        {loading ? <p className="helper-text">{t.loadingNotices}</p> : null}
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
                  {t.register}
                </button>
              </div>
            ) : null}
          </>
        ) : null}
        {!loading && !listError
          ? notices.map((item) => (
              <article key={item.id} className="panel" style={{ padding: 16, display: "grid", gap: 8 }}>
                <time style={{ fontSize: 12, fontWeight: 700, opacity: 0.78 }} dateTime={item.createdAt}>
                  {formatDate(item.createdAt, language)}
                </time>
                {item.pinned ? <span className="badge">{t.pinned}</span> : null}
                <p
                  className="section-copy"
                  style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: `${normalizeNoticeFontSize(item.fontSize)}px` }}
                >
                  {item.content}
                </p>
                {canManageNotices ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setContent(item.content);
                        setPinned(item.pinned);
                        setFontSize(normalizeNoticeFontSize(item.fontSize));
                        setFormError(null);
                        setFormNotice(null);
                        setShowForm(true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      {t.edit}
                    </button>
                    <button className="btn-ghost" type="button" onClick={() => void onDelete(item.id)}>
                      {t.delete}
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
            {editingId === null ? t.createNotice : t.editNotice}
          </h2>
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
            <label className="field-label" htmlFor="notice-content">
              {t.content}
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
            <label className="field-label" htmlFor="notice-font-size">
              {t.textSize}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <input
                id="notice-font-size"
                type="range"
                min={MIN_NOTICE_FONT_SIZE}
                max={MAX_NOTICE_FONT_SIZE}
                step={1}
                value={fontSize}
                onChange={(event) => setFontSize(normalizeNoticeFontSize(Number(event.target.value)))}
                style={{ width: "min(340px, 100%)" }}
              />
              <input
                type="number"
                className="field-input"
                min={MIN_NOTICE_FONT_SIZE}
                max={MAX_NOTICE_FONT_SIZE}
                step={1}
                value={fontSize}
                onChange={(event) => setFontSize(normalizeNoticeFontSize(Number(event.target.value)))}
                style={{ width: 88, padding: "8px 10px" }}
              />
              <span className="helper-text" style={{ fontWeight: 700 }}>
                {fontSize}px
              </span>
            </div>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, width: "fit-content", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={pinned}
                onChange={(event) => setPinned(event.target.checked)}
              />
              <span className="field-label" style={{ margin: 0 }}>
                {t.pinToTop}
              </span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <button className="btn" type="submit" disabled={submitting}>
                {submitting ? t.saving : editingId === null ? t.create : t.update}
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
                {t.cancel}
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
