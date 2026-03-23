"use client";

import { useEffect, useState } from "react";

type EntryPhase = "visible" | "fade";
type Rect = { left: number; top: number; right: number; bottom: number };
type GreetingPlacement = {
  text: string;
  x: number;
  y: number;
  delayMs: number;
};

const INTRO_TOTAL_MS = 4000;
const INTRO_FADE_MS = 640;
const MOBILE_BREAKPOINT = 760;

// Add/remove languages here. Positions are now randomized on each load.
const GREETING_WORDS = [
  "안녕하세요",
  "Hello",
  "こんにちは",
  "你好",
  "Bonjour",
  "Hola",
  "Hallo",
  "Ciao",
  "Olá",
  "Привет",
  "مرحبا",
  "नमस्ते",
  "Merhaba",
  "Xin chào",
  "สวัสดี",
] as const;

function isWideGlyph(char: string): boolean {
  const codePoint = char.codePointAt(0);
  if (!codePoint) {
    return false;
  }

  return (
    (codePoint >= 0x1100 && codePoint <= 0x11ff) || // Hangul Jamo
    (codePoint >= 0x2e80 && codePoint <= 0x9fff) || // CJK
    (codePoint >= 0xac00 && codePoint <= 0xd7af) || // Hangul syllables
    (codePoint >= 0x3040 && codePoint <= 0x30ff) || // Hiragana / Katakana
    (codePoint >= 0x0600 && codePoint <= 0x06ff) || // Arabic
    (codePoint >= 0x0900 && codePoint <= 0x097f) || // Devanagari
    (codePoint >= 0x0e00 && codePoint <= 0x0e7f) // Thai
  );
}

function estimateTextWidth(text: string, fontPx: number): number {
  let units = 0;
  for (const char of text) {
    if (char === " ") {
      units += 0.34;
    } else if (isWideGlyph(char)) {
      units += 1;
    } else {
      units += 0.6;
    }
  }
  return units * fontPx;
}

function rectanglesOverlap(a: Rect, b: Rect, gap: number): boolean {
  return !(a.right + gap < b.left || a.left - gap > b.right || a.bottom + gap < b.top || a.top - gap > b.bottom);
}

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function buildGreetingLayout(words: readonly string[], viewportWidth: number, viewportHeight: number): GreetingPlacement[] {
  const width = Math.max(360, viewportWidth);
  const height = Math.max(600, viewportHeight);
  const isMobile = width <= MOBILE_BREAKPOINT;

  const fontPx = isMobile ? 16 : 37;
  const horizontalPadding = isMobile ? 20 : 36;
  const verticalPadding = isMobile ? 28 : 34;
  const wordGap = isMobile ? 10 : 16;
  const stepX = isMobile ? 18 : 24;
  const stepY = isMobile ? 16 : 22;

  // Keep a protected center area so greeting words don't collide with title/progress.
  const centerHalfWidth = Math.min(width * (isMobile ? 0.35 : 0.32), isMobile ? 165 : 360);
  const centerHalfHeight = Math.min(height * (isMobile ? 0.22 : 0.24), isMobile ? 120 : 190);
  const protectedRect: Rect = {
    left: width / 2 - centerHalfWidth,
    right: width / 2 + centerHalfWidth,
    top: height / 2 - centerHalfHeight,
    bottom: height / 2 + centerHalfHeight,
  };

  const placedRects: Rect[] = [];
  const placements: GreetingPlacement[] = [];

  words.forEach((text, index) => {
    const wordWidth = estimateTextWidth(text, fontPx) + (isMobile ? 12 : 18);
    const wordHeight = fontPx * 1.22 + (isMobile ? 6 : 10);

    const minX = horizontalPadding + wordWidth / 2;
    const maxX = width - horizontalPadding - wordWidth / 2;
    const minY = verticalPadding + wordHeight / 2;
    const maxY = height - verticalPadding - wordHeight / 2;

    if (minX >= maxX || minY >= maxY) {
      placements.push({
        text,
        x: 50,
        y: 50,
        delayMs: 140 + index * 110,
      });
      return;
    }

    const candidates: Array<{ x: number; y: number }> = [];
    for (let y = minY; y <= maxY; y += stepY) {
      for (let x = minX; x <= maxX; x += stepX) {
        candidates.push({ x, y });
      }
    }
    shuffle(candidates);

    let chosenRect: Rect | null = null;
    let chosenPoint: { x: number; y: number } | null = null;

    for (const candidate of candidates) {
      const rect: Rect = {
        left: candidate.x - wordWidth / 2,
        right: candidate.x + wordWidth / 2,
        top: candidate.y - wordHeight / 2,
        bottom: candidate.y + wordHeight / 2,
      };

      if (rectanglesOverlap(rect, protectedRect, 10)) {
        continue;
      }

      if (placedRects.some((item) => rectanglesOverlap(rect, item, wordGap))) {
        continue;
      }

      chosenRect = rect;
      chosenPoint = candidate;
      break;
    }

    // Strict fallback: keep random attempts, but never allow overlap.
    if (!chosenRect || !chosenPoint) {
      for (let attempt = 0; attempt < 420; attempt++) {
        const candidate = {
          x: minX + Math.random() * (maxX - minX),
          y: minY + Math.random() * (maxY - minY),
        };
        const rect: Rect = {
          left: candidate.x - wordWidth / 2,
          right: candidate.x + wordWidth / 2,
          top: candidate.y - wordHeight / 2,
          bottom: candidate.y + wordHeight / 2,
        };

        if (rectanglesOverlap(rect, protectedRect, 10)) {
          continue;
        }

        if (placedRects.some((item) => rectanglesOverlap(rect, item, wordGap))) {
          continue;
        }

        chosenRect = rect;
        chosenPoint = candidate;
        break;
      }
    }

    if (!chosenRect || !chosenPoint) {
      return;
    }

    placedRects.push(chosenRect);
    placements.push({
      text,
      x: (chosenPoint.x / width) * 100,
      y: (chosenPoint.y / height) * 100,
      delayMs: 140 + index * 110,
    });
  });

  return placements;
}

export default function EntryTransition() {
  const [phase, setPhase] = useState<EntryPhase>("visible");
  const [mounted, setMounted] = useState(true);
  const [greetings, setGreetings] = useState<GreetingPlacement[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    return buildGreetingLayout(GREETING_WORDS, window.innerWidth, window.innerHeight);
  });

  useEffect(() => {
    const refreshLayout = () => {
      setGreetings(buildGreetingLayout(GREETING_WORDS, window.innerWidth, window.innerHeight));
    };

    refreshLayout();
    window.addEventListener("resize", refreshLayout);
    return () => {
      window.removeEventListener("resize", refreshLayout);
    };
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fadeStartDelay = prefersReducedMotion ? 90 : INTRO_TOTAL_MS - INTRO_FADE_MS;
    const unmountDelay = prefersReducedMotion ? 300 : INTRO_TOTAL_MS;

    const fadeTimer = window.setTimeout(() => {
      setPhase("fade");
    }, fadeStartDelay);

    const unmountTimer = window.setTimeout(() => {
      setMounted(false);
    }, unmountDelay);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(unmountTimer);
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className={`entry-transition ${phase === "fade" ? "is-fade" : ""}`} aria-hidden="true">
      <div className="entry-transition-greetings">
        {greetings.map((item, index) => (
          <span
            key={`${item.text}-${index}`}
            className="entry-transition-word"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              animationDelay: `${item.delayMs}ms`,
            }}
          >
            {item.text}
          </span>
        ))}
      </div>

      <div className="entry-transition-center">
        <div className="entry-transition-brand">안녕하세요</div>
        <p className="entry-transition-copy">포트폴리오를 준비하고 있어요...</p>
        <div className="entry-transition-progress">
          <span className="entry-transition-progress-fill" />
        </div>
      </div>

      <div className="entry-transition-sheen" />
    </div>
  );
}
