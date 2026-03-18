"use client";

import { useEffect, useMemo, useState } from "react";
import type { HomeNewsItem } from "@/lib/tech-news";
import { useSiteLanguage } from "@/components/i18n-text";

type HomeItNewsStripProps = {
  items: HomeNewsItem[];
};

function formatDateLabel(publishedAt: string, language: "ko" | "en"): string {
  if (!publishedAt) {
    return "";
  }

  const parsed = new Date(publishedAt);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "ko-KR", {
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

function pickWindow(items: HomeNewsItem[], start: number, size: number): HomeNewsItem[] {
  const out: HomeNewsItem[] = [];
  for (let i = 0; i < size; i += 1) {
    out.push(items[(start + i) % items.length]);
  }
  return out;
}

export default function HomeItNewsStrip({ items }: HomeItNewsStripProps) {
  const language = useSiteLanguage();
  const [index, setIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => setCardsPerView(media.matches ? 1 : 3);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const visibleCount = Math.min(items.length, cardsPerView);
  const current = items[index];
  const previewItems = useMemo(() => pickWindow(items, index, visibleCount), [items, index, visibleCount]);

  function movePrev() {
    setIndex((prev) => (prev - 1 + items.length) % items.length);
  }

  function moveNext() {
    setIndex((prev) => (prev + 1) % items.length);
  }

  const badgeLabel = language === "en" ? "Yozm IT" : "\uC694\uC998IT";
  const prevNewsLabel = language === "en" ? "Previous news" : "\uC774\uC804 \uB274\uC2A4";
  const nextNewsLabel = language === "en" ? "Next news" : "\uB2E4\uC74C \uB274\uC2A4";
  const prevCardLabel = language === "en" ? "Previous news card" : "\uC774\uC804 \uB274\uC2A4 \uCE74\uB4DC";
  const nextCardLabel = language === "en" ? "Next news card" : "\uB2E4\uC74C \uB274\uC2A4 \uCE74\uB4DC";

  if (items.length === 0) {
    return (
      <section className="panel" style={{ padding: 12, display: "grid", gap: 4 }}>
        <span className="badge">{badgeLabel}</span>
        <p className="section-copy" style={{ fontSize: 13 }}>
          {language === "en" ? "Unable to load news." : "\uB274\uC2A4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."}
        </p>
      </section>
    );
  }

  return (
    <section style={{ display: "grid", gap: 10 }}>
      <div className="panel" style={{ padding: "10px 12px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span className="badge" style={{ padding: "5px 10px" }}>
            {badgeLabel}
          </span>

          <a
            href={current.url}
            target="_blank"
            rel="noreferrer"
            title={current.title}
            style={{
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            {current.title}
          </a>

          <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={movePrev}
              aria-label={prevNewsLabel}
              style={{ minWidth: 30, height: 30, padding: 0, borderRadius: 999 }}
            >
              {"<"}
            </button>
            <span className="section-copy" style={{ fontSize: 12, minWidth: 38, textAlign: "center" }}>
              {index + 1}/{items.length}
            </span>
            <button
              type="button"
              className="btn-ghost"
              onClick={moveNext}
              aria-label={nextNewsLabel}
              style={{ minWidth: 30, height: 30, padding: 0, borderRadius: 999 }}
            >
              {">"}
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "32px 1fr 32px",
          gap: 10,
          alignItems: "stretch",
        }}
      >
        <button
          type="button"
          className="btn-ghost"
          onClick={movePrev}
          aria-label={prevCardLabel}
          style={{ width: 32, padding: 0, borderRadius: 12 }}
        >
          {"<"}
        </button>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${visibleCount}, minmax(0, 1fr))`,
            gap: 10,
          }}
        >
          {previewItems.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="panel project-card"
              style={{ padding: 12, display: "grid", gap: 8, minHeight: 90 }}
            >
              <div className="section-copy" style={{ fontSize: 12 }}>
                {badgeLabel}
                {formatDateLabel(item.publishedAt, language) ? ` · ${formatDateLabel(item.publishedAt, language)}` : ""}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  lineHeight: 1.45,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.title}
              </div>
              <div
                className="section-copy"
                style={{
                  fontSize: 12,
                  lineHeight: 1.45,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.summary}
              </div>
            </a>
          ))}
        </div>

        <button
          type="button"
          className="btn-ghost"
          onClick={moveNext}
          aria-label={nextCardLabel}
          style={{ width: 32, padding: 0, borderRadius: 12 }}
        >
          {">"}
        </button>
      </div>
    </section>
  );
}
