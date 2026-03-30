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
const LOADING_DOTS = [".", "..", "..."] as const;
const LOADING_DOT_INTERVAL_MS = 380;

const GREETING_WORDS = [
  "안녕하세요", // 한국어
  "Hello", // 영어
  "こんにちは", // 일본어
  "你好", // 중국어
  "Bonjour", // 프랑스어
  "Hola", // 스페인어
  "Guten Tag", // 독일어
  "Ciao", // 이탈리아어
  "Ahoj", // 체코어
  "Γεια σας", // 그리스어
  "Merhaba", // 튀르키예어
  "Talofa", // 사모아어
  "Buongiorno", // 바티칸(이탈리아어 계열)
  "আসসালামু আলাইকুম", // 방글라어
  "مرحبًا", // 아랍어
] as const;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function isWideGlyph(char: string): boolean {
  const cp = char.codePointAt(0);
  if (!cp) {
    return false;
  }
  return (
    (cp >= 0x1100 && cp <= 0x11ff) || // Hangul Jamo
    (cp >= 0x2e80 && cp <= 0x9fff) || // CJK
    (cp >= 0xac00 && cp <= 0xd7af) || // Hangul syllables
    (cp >= 0x3040 && cp <= 0x30ff) || // Hiragana/Katakana
    (cp >= 0x0600 && cp <= 0x06ff) || // Arabic
    (cp >= 0x0900 && cp <= 0x097f) || // Devanagari
    (cp >= 0x0e00 && cp <= 0x0e7f) // Thai
  );
}

function estimateTextWidthPx(text: string, fontPx: number): number {
  let units = 0;
  for (const ch of text) {
    if (ch === " ") {
      units += 0.34;
    } else if (isWideGlyph(ch)) {
      units += 1;
    } else {
      units += 0.62;
    }
  }
  return units * fontPx;
}

function overlaps(a: Rect, b: Rect, gap: number): boolean {
  return !(a.right + gap < b.left || a.left - gap > b.right || a.bottom + gap < b.top || a.top - gap > b.bottom);
}

function createRandomLayout(words: readonly string[], viewportW: number, viewportH: number): GreetingPlacement[] {
  const width = Math.max(360, viewportW);
  const height = Math.max(620, viewportH);
  const mobile = width <= MOBILE_BREAKPOINT;

  const fontPx = mobile ? 16 : 36;
  const sidePadding = mobile ? 18 : 28;
  const verticalPadding = mobile ? 24 : 30;
  const gap = mobile ? 8 : 14;
  const maxAttemptsPerWord = 700;

  const placedRects: Rect[] = [];
  const placements: GreetingPlacement[] = [];

  words.forEach((text, index) => {
    const wordW = estimateTextWidthPx(text, fontPx) + (mobile ? 12 : 20);
    const wordH = fontPx * 1.18 + (mobile ? 6 : 10);

    const minX = sidePadding + wordW / 2;
    const maxX = width - sidePadding - wordW / 2;
    const minY = verticalPadding + wordH / 2;
    const maxY = height - verticalPadding - wordH / 2;

    if (minX >= maxX || minY >= maxY) {
      return;
    }

    let found: Rect | null = null;
    let foundX = 0;
    let foundY = 0;

    for (let attempt = 0; attempt < maxAttemptsPerWord; attempt++) {
      const x = randomBetween(minX, maxX);
      const y = randomBetween(minY, maxY);
      const rect: Rect = {
        left: x - wordW / 2,
        right: x + wordW / 2,
        top: y - wordH / 2,
        bottom: y + wordH / 2,
      };

      if (placedRects.some((item) => overlaps(rect, item, gap))) {
        continue;
      }

      found = rect;
      foundX = x;
      foundY = y;
      break;
    }

    if (!found) {
      return;
    }

    placedRects.push(found);
    placements.push({
      text,
      x: (foundX / width) * 100,
      y: (foundY / height) * 100,
      delayMs: 140 + index * 110,
    });
  });

  return placements;
}

export default function EntryTransition() {
  const [phase, setPhase] = useState<EntryPhase>("visible");
  const [mounted, setMounted] = useState(true);
  const [loadingDotIndex, setLoadingDotIndex] = useState(0);
  const [greetings, setGreetings] = useState<GreetingPlacement[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    return createRandomLayout(GREETING_WORDS, window.innerWidth, window.innerHeight);
  });

  useEffect(() => {
    const refreshLayout = () => {
      setGreetings(createRandomLayout(GREETING_WORDS, window.innerWidth, window.innerHeight));
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

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLoadingDotIndex((current) => (current + 1) % LOADING_DOTS.length);
    }, LOADING_DOT_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
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
        <p className="entry-transition-copy" aria-live="polite">
          <span>Loading</span>
          <span className="entry-transition-copy-dots" aria-hidden="true">
            {LOADING_DOTS[loadingDotIndex]}
          </span>
        </p>
        <div className="entry-transition-progress">
          <span className="entry-transition-progress-fill" />
        </div>
      </div>

      <div className="entry-transition-sheen" />
    </div>
  );
}
