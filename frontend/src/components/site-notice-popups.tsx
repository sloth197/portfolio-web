"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type PopupNotice = {
  id: string;
  title: string;
  message: string;
};

type NoticeDto = {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

const INTRO_TOTAL_MS = 4000;
const POPUP_STORAGE_PREFIX = "xhbt-popup-hide-until:";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const THEME_CHANGE_EVENT = "portfolio-theme-change";
const NOTICE_BRAND_ICON_DARK_URL = "/warning-dark.png";
const NOTICE_BRAND_ICON_LIGHT_URL = "/warning-light.png";
const POPUP_FIXED_TITLE = "NOTICE";

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

function todayEndTimestamp(): number {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

export default function SiteNoticePopups() {
  const pathname = usePathname();
  const [visibleNotices, setVisibleNotices] = useState<PopupNotice[]>([]);
  const [showBrandIcon, setShowBrandIcon] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const readTheme = () => (document.documentElement.dataset.theme === "light" ? "light" : "dark");
    const syncTheme = () => setTheme(readTheme());

    syncTheme();
    window.addEventListener(THEME_CHANGE_EVENT, syncTheme);
    window.addEventListener("storage", syncTheme);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    const timer = window.setTimeout(() => {
      const loadPinnedNotices = async () => {
        if (!API_BASE) {
          setVisibleNotices([]);
          return;
        }

        try {
          const response = await fetch(`${API_BASE}/api/public/notices`, {
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
              title: notice.title,
              message: notice.content,
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

  const hideForToday = (id: string) => {
    window.localStorage.setItem(popupStorageKey(id), String(todayEndTimestamp()));
    closeNotice(id);
  };

  if (visibleNotices.length === 0) {
    return null;
  }

  if (pathname !== "/") {
    return null;
  }

  const noticeBrandIconSrc = theme === "light" ? NOTICE_BRAND_ICON_LIGHT_URL : NOTICE_BRAND_ICON_DARK_URL;

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
              <span className="site-popup-brand-wrap site-popup-brand-wrap-main" aria-hidden="true">
                {showBrandIcon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={noticeBrandIconSrc}
                    alt=""
                    aria-hidden="true"
                    className="site-popup-brand-icon site-popup-brand-icon-main"
                    onError={() => setShowBrandIcon(false)}
                  />
                ) : null}
                <span className="site-popup-brand site-popup-brand-main">{POPUP_FIXED_TITLE}</span>
              </span>
              <div className="site-popup-body-divider" aria-hidden="true" />
              <div className="site-popup-copy">
                {notice.message.split(/\r?\n/).map((line, index) => (
                  <p key={`${notice.id}-${index}`}>{line}</p>
                ))}
              </div>
            </div>

            <footer className="site-popup-foot">
              <button type="button" className="site-popup-foot-btn" onClick={() => hideForToday(notice.id)}>
                오늘 하루 안보기
              </button>
              <button type="button" className="site-popup-foot-btn" onClick={() => closeNotice(notice.id)}>
                닫기
              </button>
            </footer>
          </section>
        ))}
      </div>
    </div>
  );
}
