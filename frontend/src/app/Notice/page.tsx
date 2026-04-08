"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const language = useSiteLanguage();
  const adminLoggedIn = useSyncExternalStore(subscribeAdminAuth, isAdminLoggedIn, getServerSnapshot);
  const adminRole = useSyncExternalStore(subscribeAdminAuth, getAdminRole, getServerRoleSnapshot);
  const hasShownDeniedAlertRef = useRef(false);
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
      detail: language === "en" ? "Details" : "상세 내용",
      options: language === "en" ? "Options" : "옵션",
      contentRequired: language === "en" ? "Please fill in details." : "상세 내용을 입력해 주세요.",
      textSize: language === "en" ? "Text size" : "글자 크기",
      pinToTop: language === "en" ? "Pin to top" : "상단 고정",
      pinSingleHint: language === "en" ? "Only one pinned notice is allowed." : "고정 공지는 1개만 설정할 수 있습니다.",
      pinReplaceHint:
        language === "en"
          ? "The existing pinned notice will be automatically unpinned."
          : "기존 고정 공지는 자동으로 해제됩니다.",
      preview: language === "en" ? "Preview" : "미리보기",
      previewPlaceholder: language === "en" ? "Preview will appear here." : "미리보기가 여기에 표시됩니다.",
      otherNotices: language === "en" ? "Other notices" : "일반 공지",
      noOtherNotices: language === "en" ? "There are no regular notices yet." : "일반 공지가 아직 없습니다.",
      saving: language === "en" ? "Saving..." : "저장 중...",
      create: language === "en" ? "Create" : "등록",
      update: language === "en" ? "Update" : "수정",
      cancel: language === "en" ? "Cancel" : "취소",
      register: language === "en" ? "Create" : "등록",
      registerCancel: language === "en" ? "Cancel Create" : "등록 취소",
      writeAndEdit: language === "en" ? "Write / Edit" : "작성 및 수정",
    }),
    [language],
  );

  const [notices, setNotices] = useState<NoticeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [detail, setDetail] = useState("");
  const [pinned, setPinned] = useState(false);
  const [fontSize, setFontSize] = useState(DEFAULT_NOTICE_FONT_SIZE);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);

  const pinnedNotice = useMemo(() => notices.find((item) => item.pinned) ?? null, [notices]);
  const otherNotices = useMemo(() => {
    if (!pinnedNotice) {
      return notices;
    }
    return notices.filter((item) => item.id !== pinnedNotice.id);
  }, [notices, pinnedNotice]);
  const composedContent = useMemo(() => detail.trim(), [detail]);

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
    if (adminLoggedIn) {
      hasShownDeniedAlertRef.current = false;
      return;
    }
    if (hasShownDeniedAlertRef.current) {
      return;
    }
    hasShownDeniedAlertRef.current = true;
    window.alert(language === "en" ? "You do not have permission." : "권한이 없습니다");
    router.replace("/");
  }, [adminLoggedIn, language, router]);

  useEffect(() => {
    if (!adminLoggedIn) {
      return;
    }
    void loadNotices();
  }, [adminLoggedIn, loadNotices]);

  function resetForm() {
    setEditingId(null);
    setDetail("");
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
    const contentPayload = detail.trim();

    if (!contentPayload) {
      setSubmitting(false);
      setFormError(t.contentRequired);
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method,
        headers: withAdminAuthHeaders({
          "Content-Type": "application/json",
        }),
        credentials: "include",
        body: JSON.stringify({
          content: contentPayload,
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
      setNotices((current) => {
        const merged = isEditing
          ? current.map((item) => (item.id === normalizedSavedNotice.id ? normalizedSavedNotice : item))
          : [normalizedSavedNotice, ...current];
        const normalized = normalizedSavedNotice.pinned
          ? merged.map((item) => (item.id === normalizedSavedNotice.id ? item : { ...item, pinned: false }))
          : merged;
        return sortNotices(normalized);
      });
      if (isEditing) {
        setFormNotice(t.noticeUpdated);
      } else {
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

  function startEdit(item: NoticeDto): void {
    setEditingId(item.id);
    setDetail(item.content);
    setPinned(item.pinned);
    setFontSize(normalizeNoticeFontSize(item.fontSize));
    setFormError(null);
    setFormNotice(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderNoticeCard(item: NoticeDto, compact = false) {
    return (
      <article
        key={item.id}
        className="panel notice-panel"
        style={{ padding: compact ? 12 : 16, display: "grid", gap: compact ? 6 : 8 }}
      >
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
            <button className="btn-ghost" type="button" onClick={() => startEdit(item)}>
              {t.edit}
            </button>
            <button className="btn-ghost" type="button" onClick={() => void onDelete(item.id)}>
              {t.delete}
            </button>
          </div>
        ) : null}
      </article>
    );
  }

  if (!adminLoggedIn) {
    return null;
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

      <section style={{ display: "grid", gap: 12, width: "100%" }}>
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
        {!loading && !listError && !showForm && notices.length === 0 ? (
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
        {!loading && !listError && !showForm ? (
          pinnedNotice ? (
            <div style={{ display: "grid", gap: 18 }}>
              <div>{renderNoticeCard(pinnedNotice)}</div>
              <div style={{ display: "grid", gap: 10 }}>
                <p className="helper-text" style={{ margin: 0, fontWeight: 700 }}>
                  {t.otherNotices}
                </p>
                {otherNotices.length > 0 ? otherNotices.map((item) => renderNoticeCard(item)) : (
                  <p className="helper-text" style={{ margin: 0 }}>
                    {t.noOtherNotices}
                  </p>
                )}
              </div>
            </div>
          ) : (
            notices.map((item) => renderNoticeCard(item))
          )
        ) : null}
      </section>

      {canManageNotices && showForm ? (
        <section className="notice-editor-workspace">
          <div className="notice-editor-workspace-grid">
            <div className="notice-editor-workspace-main">
              <h3 className="notice-editor-workspace-main-title">{t.writeAndEdit}</h3>
              <form onSubmit={onSubmit} className="notice-editor-form">
                <label className="field-label" htmlFor="notice-detail">
                  {t.detail}
                </label>
                <textarea
                  id="notice-detail"
                  className="field-input notice-editor-body"
                  value={detail}
                  onChange={(event) => setDetail(event.target.value)}
                  rows={10}
                  maxLength={5000}
                  style={{ resize: "vertical", minHeight: 220 }}
                />

                <h3 className="project-detail-subtitle" style={{ margin: 0 }}>
                  {t.options}
                </h3>
                <label className="notice-editor-pin-row">
                  <input
                    type="checkbox"
                    checked={pinned}
                    onChange={(event) => setPinned(event.target.checked)}
                  />
                  <span className="field-label" style={{ margin: 0 }}>
                    {t.pinToTop}
                  </span>
                </label>
                <p className="helper-text" style={{ margin: 0 }}>
                  {pinned && pinnedNotice && pinnedNotice.id !== editingId ? t.pinReplaceHint : t.pinSingleHint}
                </p>

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

                <label className="field-label" htmlFor="notice-preview">
                  {t.preview}
                </label>
                <div id="notice-preview" className="notice-editor-preview-box">
                  <p
                    className="field-input"
                    style={{
                      margin: 0,
                      border: "none",
                      padding: 0,
                      background: "transparent",
                      whiteSpace: "pre-wrap",
                      fontSize: `${normalizeNoticeFontSize(fontSize)}px`,
                      lineHeight: 1.55,
                    }}
                  >
                    {composedContent || t.previewPlaceholder}
                  </p>
                </div>
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
            </div>
          </div>
        </section>
      ) : null}

      {!canManageNotices && adminLoggedIn ? (
        <section className="panel" style={{ padding: 16, width: "100%" }}>
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
