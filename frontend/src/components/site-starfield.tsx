"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type CSSProperties } from "react";

type AvoidRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

type LayerConfig = {
  seed: number;
  count: number;
  width: number;
  height: number;
  avoidRects: AvoidRect[];
  blueChance: number;
  alphaMin: number;
  alphaMax: number;
  blurChance: number;
  blurMin: number;
  blurMax: number;
};

type StarfieldStyles = {
  height: number;
  desktopSmallA: CSSProperties;
  desktopSmallB: CSSProperties;
  desktopLargeA: CSSProperties;
  desktopLargeB: CSSProperties;
  mobileSmallA: CSSProperties;
  mobileSmallB: CSSProperties;
  mobileLargeA: CSSProperties;
  mobileLargeB: CSSProperties;
};

const AVOID_SELECTORS = [
  ".site-header .brand-mark",
  ".site-header .nav-link",
  ".site-header .header-login-link",
  ".site-header .header-lang-toggle",
  ".site-main h1",
  ".site-main h2",
  ".site-main h3",
  ".site-main p",
  ".site-main .panel",
  ".site-main .badge",
  ".site-main .section-title",
  ".site-main .section-copy",
  ".site-main .about-neo-work-card",
  ".site-main .about-neo-tool-card",
  ".site-main .about-neo-interest-pill",
  ".site-main .project-card",
  ".site-main .projects-filter-bar",
  ".site-main .projects-track",
  ".site-main .projects-track-card",
  ".site-main .projects-track-viewport",
  ".site-main .home-merged-news",
  ".site-footer-inner",
].join(", ");

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBetween(random: () => number, min: number, max: number): number {
  return min + (max - min) * random();
}

function readContentHeight(pathname: string): number {
  const viewportHeight = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);

  if (pathname === "/") {
    const newsBanner = document.querySelector<HTMLElement>(".home-merged-news");
    if (newsBanner) {
      const newsBottom = newsBanner.getBoundingClientRect().bottom + window.scrollY;
      return Math.max(viewportHeight, Math.ceil(newsBottom + 20));
    }
  }

  const footer = document.querySelector<HTMLElement>(".site-footer");

  if (footer) {
    const footerBottom = footer.getBoundingClientRect().bottom + window.scrollY;
    return Math.max(viewportHeight, Math.ceil(footerBottom + 24));
  }

  const main = document.querySelector<HTMLElement>(".site-main");
  if (main) {
    const mainBottom = main.getBoundingClientRect().bottom + window.scrollY;
    return Math.max(viewportHeight, Math.ceil(mainBottom + 24));
  }

  return viewportHeight;
}

function readDocumentMetrics(pathname: string): { width: number; height: number } {
  const width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const height = readContentHeight(pathname);
  return { width, height };
}

function collectAvoidRects(): AvoidRect[] {
  const nodes = document.querySelectorAll<HTMLElement>(AVOID_SELECTORS);
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const rects: AvoidRect[] = [];

  nodes.forEach((node) => {
    const rect = node.getBoundingClientRect();
    if (rect.width < 6 || rect.height < 6) {
      return;
    }

    const pad = Math.max(4, Math.min(16, Math.min(rect.width, rect.height) * 0.1));

    rects.push({
      left: rect.left + scrollX - pad,
      right: rect.right + scrollX + pad,
      top: rect.top + scrollY - pad,
      bottom: rect.bottom + scrollY + pad,
    });
  });

  return rects;
}

function isInAvoidRects(x: number, y: number, rects: AvoidRect[]): boolean {
  for (let i = 0; i < rects.length; i += 1) {
    const rect = rects[i];
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return true;
    }
  }
  return false;
}

function getSafeStarPosition(random: () => number, width: number, height: number, avoidRects: AvoidRect[]): { x: number; y: number } {
  for (let attempt = 0; attempt < 64; attempt += 1) {
    const x = random() * width;
    const y = random() * height;
    if (!isInAvoidRects(x, y, avoidRects)) {
      return { x, y };
    }
  }

  const sideBand = Math.max(120, width * 0.14);
  const x = random() < 0.5 ? random() * sideBand : width - random() * sideBand;
  const y = random() * height;
  return { x, y };
}

function buildStarShadow(config: LayerConfig): string {
  const random = createSeededRandom(config.seed);
  const shadows: string[] = [];

  for (let i = 0; i < config.count; i += 1) {
    const { x, y } = getSafeStarPosition(random, config.width, config.height, config.avoidRects);
    const isBlue = random() < config.blueChance;
    const alpha = randomBetween(random, config.alphaMin, config.alphaMax);
    const blur = random() < config.blurChance ? randomBetween(random, config.blurMin, config.blurMax) : 0;

    const color = isBlue
      ? `rgba(182, 226, 255, ${alpha.toFixed(2)})`
      : `rgba(255, 255, 255, ${alpha.toFixed(2)})`;

    shadows.push(`${x.toFixed(2)}px ${y.toFixed(2)}px ${blur.toFixed(2)}px 0 ${color}`);
  }

  return shadows.join(", ");
}

function buildLayerStyle(config: LayerConfig): CSSProperties {
  return {
    boxShadow: buildStarShadow(config),
  };
}

function buildStarfieldStyles(width: number, height: number, avoidRects: AvoidRect[]): StarfieldStyles {
  const isMobile = width <= 920;

  return {
    height,
    desktopSmallA: buildLayerStyle({
      seed: 20260330,
      count: 920,
      width,
      height,
      avoidRects,
      blueChance: 0.2,
      alphaMin: 0.32,
      alphaMax: 0.92,
      blurChance: 0.13,
      blurMin: 0.25,
      blurMax: 0.9,
    }),
    desktopSmallB: buildLayerStyle({
      seed: 20260334,
      count: 700,
      width,
      height,
      avoidRects,
      blueChance: 0.2,
      alphaMin: 0.28,
      alphaMax: 0.84,
      blurChance: 0.13,
      blurMin: 0.25,
      blurMax: 0.84,
    }),
    desktopLargeA: buildLayerStyle({
      seed: 20260331,
      count: 220,
      width,
      height,
      avoidRects,
      blueChance: 0.34,
      alphaMin: 0.58,
      alphaMax: 1,
      blurChance: 0.46,
      blurMin: 0.6,
      blurMax: 1.8,
    }),
    desktopLargeB: buildLayerStyle({
      seed: 20260335,
      count: 160,
      width,
      height,
      avoidRects,
      blueChance: 0.34,
      alphaMin: 0.52,
      alphaMax: 1,
      blurChance: 0.42,
      blurMin: 0.5,
      blurMax: 1.6,
    }),
    mobileSmallA: buildLayerStyle({
      seed: 20260332,
      count: isMobile ? 420 : 340,
      width,
      height,
      avoidRects,
      blueChance: 0.2,
      alphaMin: 0.36,
      alphaMax: 0.9,
      blurChance: 0.12,
      blurMin: 0.3,
      blurMax: 0.9,
    }),
    mobileSmallB: buildLayerStyle({
      seed: 20260336,
      count: isMobile ? 280 : 220,
      width,
      height,
      avoidRects,
      blueChance: 0.2,
      alphaMin: 0.3,
      alphaMax: 0.84,
      blurChance: 0.12,
      blurMin: 0.25,
      blurMax: 0.8,
    }),
    mobileLargeA: buildLayerStyle({
      seed: 20260333,
      count: isMobile ? 120 : 90,
      width,
      height,
      avoidRects,
      blueChance: 0.34,
      alphaMin: 0.58,
      alphaMax: 1,
      blurChance: 0.46,
      blurMin: 0.6,
      blurMax: 1.8,
    }),
    mobileLargeB: buildLayerStyle({
      seed: 20260337,
      count: isMobile ? 90 : 70,
      width,
      height,
      avoidRects,
      blueChance: 0.34,
      alphaMin: 0.52,
      alphaMax: 1,
      blurChance: 0.42,
      blurMin: 0.5,
      blurMax: 1.6,
    }),
  };
}

export default function SiteStarfield() {
  const pathname = usePathname();
  const [styles, setStyles] = useState<StarfieldStyles | null>(null);

  const rebuild = useCallback(() => {
    const { width, height } = readDocumentMetrics(pathname);
    const avoidRects = collectAvoidRects();
    setStyles(buildStarfieldStyles(width, height, avoidRects));
  }, [pathname]);

  useEffect(() => {
    let raf = 0;
    let timer = 0;

    const scheduleRebuild = (delayMs = 0) => {
      if (timer) {
        window.clearTimeout(timer);
      }

      timer = window.setTimeout(() => {
        if (raf) {
          window.cancelAnimationFrame(raf);
        }

        raf = window.requestAnimationFrame(() => {
          rebuild();
        });
      }, delayMs);
    };

    const onResize = () => {
      scheduleRebuild(140);
    };

    const onCustomEvent: EventListener = () => {
      scheduleRebuild(40);
    };

    scheduleRebuild();
    const delayed = window.setTimeout(() => scheduleRebuild(), 260);
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);
    window.addEventListener("portfolio-language-change", onCustomEvent);
    window.addEventListener("portfolio-theme-change", onCustomEvent);

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
      if (raf) {
        window.cancelAnimationFrame(raf);
      }
      window.clearTimeout(delayed);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onResize);
      window.removeEventListener("portfolio-language-change", onCustomEvent);
      window.removeEventListener("portfolio-theme-change", onCustomEvent);
    };
  }, [rebuild]);

  return (
    <div className="site-starfield" aria-hidden="true" style={styles ? { height: `${styles.height}px` } : undefined}>
      <span className="site-starfield-layer site-starfield-layer--small-a site-starfield-layer--desktop" style={styles?.desktopSmallA} />
      <span className="site-starfield-layer site-starfield-layer--small-b site-starfield-layer--desktop" style={styles?.desktopSmallB} />
      <span className="site-starfield-layer site-starfield-layer--large-a site-starfield-layer--desktop" style={styles?.desktopLargeA} />
      <span className="site-starfield-layer site-starfield-layer--large-b site-starfield-layer--desktop" style={styles?.desktopLargeB} />

      <span className="site-starfield-layer site-starfield-layer--small-a site-starfield-layer--mobile" style={styles?.mobileSmallA} />
      <span className="site-starfield-layer site-starfield-layer--small-b site-starfield-layer--mobile" style={styles?.mobileSmallB} />
      <span className="site-starfield-layer site-starfield-layer--large-a site-starfield-layer--mobile" style={styles?.mobileLargeA} />
      <span className="site-starfield-layer site-starfield-layer--large-b site-starfield-layer--mobile" style={styles?.mobileLargeB} />
    </div>
  );
}
