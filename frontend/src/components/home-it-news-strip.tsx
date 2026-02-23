"use client";

import { useState } from "react";
import type { HomeNewsItem } from "@/lib/tech-news";

type HomeItNewsStripProps = {
  items: HomeNewsItem[];
};

function formatDateLabel(publishedAt: string): string {
  if (!publishedAt) {
    return "";
  }

  const parsed = new Date(publishedAt);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

export default function HomeItNewsStrip({ items }: HomeItNewsStripProps) {
  const [index, setIndex] = useState(0);

  if (items.length === 0) {
    return (
      <section className="panel" style={{ padding: 12, display: "grid", gap: 4 }}>
        <span className="badge">요즘IT</span>
        <p className="section-copy" style={{ fontSize: 13 }}>
          뉴스를 불러오지 못했습니다.
        </p>
      </section>
    );
  }

  const current = items[index];

  function movePrev() {
    setIndex((prev) => (prev - 1 + items.length) % items.length);
  }

  function moveNext() {
    setIndex((prev) => (prev + 1) % items.length);
  }

  return (
    <section className="panel" style={{ padding: 12 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: 10,
          alignItems: "center",
        }}
      >
        <span className="badge" style={{ padding: "5px 9px" }}>
          요즘IT
        </span>

        <a
          href={current.url}
          target="_blank"
          rel="noreferrer"
          style={{
            minWidth: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            fontSize: 14,
            fontWeight: 700,
          }}
          title={current.title}
        >
          {formatDateLabel(current.publishedAt) ? `[${formatDateLabel(current.publishedAt)}] ` : ""}
          {current.title}
        </a>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            className="btn-ghost"
            aria-label="이전 뉴스"
            onClick={movePrev}
            style={{ minWidth: 32, height: 32, padding: 0 }}
          >
            {"<"}
          </button>
          <span className="section-copy" style={{ fontSize: 12, minWidth: 36, textAlign: "center" }}>
            {index + 1}/{items.length}
          </span>
          <button
            type="button"
            className="btn-ghost"
            aria-label="다음 뉴스"
            onClick={moveNext}
            style={{ minWidth: 32, height: 32, padding: 0 }}
          >
            {">"}
          </button>
        </div>
      </div>
    </section>
  );
}
