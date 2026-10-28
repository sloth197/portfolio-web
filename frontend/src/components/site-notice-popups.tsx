"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type PopupNotice = {
  id: string;
  title: string;
  message: string;
  fontSize: number;
};

type NoticeDto = {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  fontSize: number;
  createdAt: string;
  updatedAt: string;
};

const INTRO_TOTAL_MS = 4000;
const POPUP_STORAGE_PREFIX = "xhbt-popup-hide-until:";
const PUBLIC_NOTICES_API = "/api/public/notices";
const POPUP_FIXED_TITLE = "NOTICE";
const DEFAULT_NOTICE_FONT_SIZE = 18;
const MIN_NOTICE_FONT_SIZE = 12;
const MAX_NOTICE_FONT_SIZE = 48;

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

function popupStorageKey(id: string): string {
  return `${POPUP_STORAGE_PREFIX}${id}`;
}

function isHiddenForToday(id: string): boolean {
  const raw = window.localStorage.getItem(popupStorageKey(id));
  if (!raw) {
    return false;
  }
  const until = Number(raw);
  if (!Number.isFinite(until)) {
    return false;
  }
  return Date.now() < until;
}

function hideFor24HoursTimestamp(): number {
  return Date.now() + 24 * 60 * 60 * 1000;
}

export default function SiteNoticePopups() {
  const pathname = usePathname();
  const [visibleNotices, setVisibleNotices] = useState<PopupNotice[]>([]);

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    const timer = window.setTimeout(() => {
      const loadPinnedNotices = async () => {
        try {
          const response = await fetch(PUBLIC_NOTICES_API, {
            method: "GET",
            cache: "no-store",
          });

          if (!response.ok) {
            setVisibleNotices([]);
            return;
          }

          const payload = (await response.json()) as NoticeDto[];
          const pinnedNotices = payload
            .filter((notice) => notice.pinned)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((notice) => ({
              id: `notice-${notice.id}`,
              title: typeof notice.title === "string" && notice.title.trim() ? notice.title : POPUP_FIXED_TITLE,
              message: typeof notice.content === "string" ? notice.content : "",
              fontSize: normalizeNoticeFontSize(notice.fontSize),
            }))
            .filter((notice) => !isHiddenForToday(notice.id));

          setVisibleNotices(pinnedNotices);
        } catch {
          setVisibleNotices([]);
        }
      };

      void loadPinnedNotices();
    }, INTRO_TOTAL_MS + 80);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pathname]);

  const isPopupOpen = pathname === "/" && visibleNotices.length > 0;

  useEffect(() => {
    const lockClassName = "site-popup-lock-active";
    if (isPopupOpen) {
      document.body.classList.add(lockClassName);
    } else {
      document.body.classList.remove(lockClassName);
    }
    return () => {
      document.body.classList.remove(lockClassName);
    };
  }, [isPopupOpen]);

  const closeNotice = (id: string) => {
    setVisibleNotices((current) => current.filter((notice) => notice.id !== id));
  };

  const hideFor24Hours = (id: string) => {
    window.localStorage.setItem(popupStorageKey(id), String(hideFor24HoursTimestamp()));
    closeNotice(id);
  };

  if (visibleNotices.length === 0) {
    return null;
  }

  if (pathname !== "/") {
    return null;
  }

  return (
    <div className="site-popup-layer" aria-live="polite">
      <div className="site-popup-stack">
        {visibleNotices.map((notice) => (
          <section key={notice.id} className="site-popup" role="dialog" aria-label={POPUP_FIXED_TITLE}>
            <header className="site-popup-head">
              <button
                type="button"
                className="site-popup-icon-close"
                onClick={() => closeNotice(notice.id)}
                aria-label={`${POPUP_FIXED_TITLE} 닫기`}
              >
                ×
              </button>
            </header>

            <div className="site-popup-body">
              <div className="site-popup-brand-wrap site-popup-brand-wrap-main">
                <span className="site-popup-eyebrow">SITE UPDATE</span>
                <span className="site-popup-brand site-popup-brand-main">{POPUP_FIXED_TITLE}</span>
              </div>
              <div className="site-popup-body-divider" aria-hidden="true" />
              <div className="site-popup-copy" style={{ fontSize: `${notice.fontSize}px` }}>
                {String(notice.message ?? "").split(/\r?\n/).map((line, index) => (
                  <p key={`${notice.id}-${index}`}>{line}</p>
                ))}
              </div>
            </div>

            <footer className="site-popup-foot">
              <button type="button" className="site-popup-foot-btn" onClick={() => hideFor24Hours(notice.id)}>
                24시간동안 보지 않기
              </button>
            </footer>
          </section>
        ))}
      </div>
    </div>
  );
}
