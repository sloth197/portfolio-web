"use client";

import { useEffect, useState, type CSSProperties } from "react";

type EntryPhase = "visible" | "fade";
type Rect = { left: number; top: number; right: number; bottom: number };
type GreetingPlacement = {
  text: string;
  x: number;
  y: number;
  delayMs: number;
};
const GALAXY_BAND_LAYERS = ["sm", "md", "lg"] as const;
type GalaxyBandLayer = (typeof GALAXY_BAND_LAYERS)[number];
type GalaxyStarLayer = GalaxyBandLayer | "ambient";
type RandomFn = () => number;
type GalaxyStar = {
  id: string;
  x: number;
  y: number;
  sizePx: number;
  opacity: number;
  blurPx: number;
  colorRgb: string;
  twinkleSec: number;
  delaySec: number;
};
type GalaxyStarsByLayer = Record<GalaxyStarLayer, GalaxyStar[]>;
type GalaxyStarStyle = CSSProperties & {
  "--star-delay": string;
  "--star-twinkle-duration": string;
};

const INTRO_TOTAL_MS = 4000;
const INTRO_FADE_MS = 640;
const MOBILE_BREAKPOINT = 760;
const LOADING_DOTS = [".", "..", "..."] as const;
const LOADING_DOT_INTERVAL_MS = 380;
const GALAXY_STAR_COLORS = ["234,244,255", "224,236,255", "244,250,255", "210,228,255"] as const;
const GALAXY_INITIAL_WIDTH = 1366;
const GALAXY_INITIAL_HEIGHT = 768;
const GALAXY_INITIAL_SEED = 9017;

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

const GALAXY_STAR_LAYER_CONFIG: Record<
  GalaxyBandLayer,
  {
    countDesktop: number;
    countMobile: number;
    sizeRange: [number, number];
    opacityRange: [number, number];
    blurRange: [number, number];
    twinkleSecRange: [number, number];
    xSpread: number;
    yCoreSpread: number;
    yOuterSpread: number;
    coreRatio: number;
  }
> = {
  sm: {
    countDesktop: 260,
    countMobile: 182,
    sizeRange: [0.675, 1.425],
    opacityRange: [0.52, 0.9],
    blurRange: [0.6, 1.5],
    twinkleSecRange: [2.1, 3.9],
    xSpread: 6.2,
    yCoreSpread: 3.1,
    yOuterSpread: 6.4,
    coreRatio: 0.9,
  },
  md: {
    countDesktop: 130,
    countMobile: 90,
    sizeRange: [1.53, 2.58],
    opacityRange: [0.56, 0.88],
    blurRange: [1.4, 2.8],
    twinkleSecRange: [3.2, 5.4],
    xSpread: 5.4,
    yCoreSpread: 2.6,
    yOuterSpread: 5.6,
    coreRatio: 0.87,
  },
  lg: {
    countDesktop: 44,
    countMobile: 30,
    sizeRange: [2.85, 4.35],
    opacityRange: [0.58, 0.94],
    blurRange: [2.4, 4.8],
    twinkleSecRange: [4.5, 7.1],
    xSpread: 4.2,
    yCoreSpread: 2.1,
    yOuterSpread: 4.6,
    coreRatio: 0.84,
  },
};

const GALAXY_AMBIENT_STAR_CONFIG = {
  countDesktop: 148,
  countMobile: 96,
  nearBandRatio: 0.76,
  nearBandXSpread: 23,
  nearBandYSpread: 42,
  sizeRange: [0.72, 1.92] as [number, number],
  opacityRange: [0.18, 0.48] as [number, number],
  blurRange: [0.6, 1.8] as [number, number],
  twinkleSecRange: [5.8, 10.6] as [number, number],
};

function createSeededRandom(seed: number): RandomFn {
  let state = seed >>> 0;
  if (state === 0) {
    state = 1;
  }
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function randomBetween(min: number, max: number, randomFn: RandomFn = Math.random): number {
  return min + randomFn() * (max - min);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function bellCurveRandomFrom(randomFn: RandomFn): number {
  return (randomFn() + randomFn() + randomFn()) / 3;
}

function smoothstep01(value: number): number {
  const x = clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
}

function milkyWayCenterY(t: number): number {
  const eased = smoothstep01(Math.pow(t, 0.9));
  const base = 86 - 60 * eased;
  const middleWeight = Math.exp(-Math.pow((t - 0.54) / 0.2, 2));
  const curveBoost = 1.2;
  const softMiddleBend = Math.sin((t - 0.5) * Math.PI * 2) * 4.8 * curveBoost * middleWeight;
  const globalArc = Math.sin((t - 0.16) * Math.PI) * 2.6 * curveBoost;
  return base + globalArc + softMiddleBend;
}

function milkyWayHalfBand(t: number): number {
  const centerWeight = 1 - Math.abs(t * 2 - 1);
  const bendWeight = Math.exp(-Math.pow((t - 0.54) / 0.24, 2));
  return 4.1 + centerWeight * 6.3 + bendWeight * 2.1;
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

function createGalaxyStars(viewportW: number, viewportH: number, seed: number): GalaxyStarsByLayer {
  const width = Math.max(360, viewportW);
  const _height = Math.max(620, viewportH);
  const mobile = width <= MOBILE_BREAKPOINT;
  void _height;
  const random = createSeededRandom(seed);

  const byLayer: GalaxyStarsByLayer = { ambient: [], sm: [], md: [], lg: [] };

  GALAXY_BAND_LAYERS.forEach((layer) => {
    const config = GALAXY_STAR_LAYER_CONFIG[layer];
    const count = mobile ? config.countMobile : config.countDesktop;

    for (let i = 0; i < count; i += 1) {
      const t = random();
      const lineX = 4 + 92 * t;
      const lineY = milkyWayCenterY(t);
      const bandHalf = milkyWayHalfBand(t);

      const inCore = random() < config.coreRatio;
      const ySpread = inCore ? config.yCoreSpread : config.yOuterSpread;
      const yJitter = (bellCurveRandomFrom(random) - 0.5) * ySpread;
      const xJitter = (random() - 0.5) * config.xSpread;

      const x = clamp(lineX + xJitter, 2, 98);
      const y = clamp(lineY + (random() - 0.5) * (bandHalf * 2) + yJitter, 4, 96);

      byLayer[layer].push({
        id: `${layer}-${i}`,
        x,
        y,
        sizePx: randomBetween(config.sizeRange[0], config.sizeRange[1], random),
        opacity: randomBetween(config.opacityRange[0], config.opacityRange[1], random),
        blurPx: randomBetween(config.blurRange[0], config.blurRange[1], random),
        colorRgb: GALAXY_STAR_COLORS[Math.floor(random() * GALAXY_STAR_COLORS.length)],
        twinkleSec: randomBetween(config.twinkleSecRange[0], config.twinkleSecRange[1], random),
        delaySec: randomBetween(0.2, 9.2, random),
      });
    }
  });

  const ambientCount = mobile ? GALAXY_AMBIENT_STAR_CONFIG.countMobile : GALAXY_AMBIENT_STAR_CONFIG.countDesktop;
  for (let i = 0; i < ambientCount; i += 1) {
    const nearBand = random() < GALAXY_AMBIENT_STAR_CONFIG.nearBandRatio;
    let x: number;
    let y: number;

    if (nearBand) {
      const t = random();
      const lineX = 4 + 92 * t;
      const lineY = milkyWayCenterY(t);
      const bandHalf = milkyWayHalfBand(t);
      const xJitter = (random() - 0.5) * GALAXY_AMBIENT_STAR_CONFIG.nearBandXSpread;
      const yJitter =
        (bellCurveRandomFrom(random) - 0.5) * (GALAXY_AMBIENT_STAR_CONFIG.nearBandYSpread + bandHalf * 2.8);
      x = clamp(lineX + xJitter, 2, 98);
      y = clamp(lineY + yJitter, 3, 97);
    } else {
      x = randomBetween(2, 98, random);
      y = randomBetween(4, 96, random);
    }

    byLayer.ambient.push({
      id: `ambient-${i}`,
      x,
      y,
      sizePx: randomBetween(GALAXY_AMBIENT_STAR_CONFIG.sizeRange[0], GALAXY_AMBIENT_STAR_CONFIG.sizeRange[1], random),
      opacity: randomBetween(
        GALAXY_AMBIENT_STAR_CONFIG.opacityRange[0],
        GALAXY_AMBIENT_STAR_CONFIG.opacityRange[1],
        random,
      ),
      blurPx: randomBetween(GALAXY_AMBIENT_STAR_CONFIG.blurRange[0], GALAXY_AMBIENT_STAR_CONFIG.blurRange[1], random),
      colorRgb: GALAXY_STAR_COLORS[Math.floor(random() * GALAXY_STAR_COLORS.length)],
      twinkleSec: randomBetween(
        GALAXY_AMBIENT_STAR_CONFIG.twinkleSecRange[0],
        GALAXY_AMBIENT_STAR_CONFIG.twinkleSecRange[1],
        random,
      ),
      delaySec: randomBetween(0.2, 11.2, random),
    });
  }

  return byLayer;
}

export default function EntryTransition() {
  const [phase, setPhase] = useState<EntryPhase>("visible");
  const [mounted, setMounted] = useState(true);
  const [loadingDotIndex, setLoadingDotIndex] = useState(0);
  const [greetings, setGreetings] = useState<GreetingPlacement[]>([]);
  const [galaxyStars, setGalaxyStars] = useState<GalaxyStarsByLayer>(() =>
    createGalaxyStars(GALAXY_INITIAL_WIDTH, GALAXY_INITIAL_HEIGHT, GALAXY_INITIAL_SEED),
  );

  useEffect(() => {
    const refreshLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setGreetings(createRandomLayout(GREETING_WORDS, width, height));
      const seed = Math.floor(width * 31 + height * 17 + GALAXY_INITIAL_SEED);
      setGalaxyStars(createGalaxyStars(width, height, seed));
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
      <div className="entry-transition-galaxy" aria-hidden="true">
        {(["ambient", ...GALAXY_BAND_LAYERS] as const).map((layer) => (
          <div key={layer} className={`entry-transition-galaxy-stars entry-transition-galaxy-stars--${layer}`}>
            {galaxyStars[layer].map((star) => {
              const style: GalaxyStarStyle = {
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.sizePx.toFixed(2)}px`,
                height: `${star.sizePx.toFixed(2)}px`,
                opacity: star.opacity,
                backgroundColor: `rgb(${star.colorRgb})`,
                boxShadow:
                  layer === "sm"
                    ? undefined
                    : layer === "ambient"
                      ? `0 0 ${star.blurPx.toFixed(2)}px rgba(${star.colorRgb}, 0.3)`
                      : `0 0 ${star.blurPx.toFixed(2)}px rgba(${star.colorRgb}, 0.58)`,
                "--star-delay": `-${star.delaySec.toFixed(2)}s`,
                "--star-twinkle-duration": `${star.twinkleSec.toFixed(2)}s`,
              };

              return <span key={star.id} className="entry-transition-galaxy-star" style={style} />;
            })}
          </div>
        ))}
        <span className="entry-transition-galaxy-band" />
        <span className="entry-transition-galaxy-sweep" />
      </div>

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
