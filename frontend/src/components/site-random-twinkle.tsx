"use client";

import { useEffect, useState, type CSSProperties } from "react";

type TwinkleStar = {
  x: number;
  y: number;
  sizePx: number;
  color: string;
  minOpacity: number;
  maxOpacity: number;
  durationSec: number;
  delaySec: number;
  blurPx: number;
};

type StarStyle = CSSProperties & {
  "--twinkle-min": string;
  "--twinkle-max": string;
};

type StarColorOption = {
  color: [number, number, number];
  weight: number;
};

const STAR_COLORS: StarColorOption[] = [
  { color: [255, 255, 255], weight: 44 }, // neutral white
  { color: [232, 240, 255], weight: 18 }, // cool white
  { color: [206, 225, 255], weight: 12 }, // blue white
  { color: [255, 244, 222], weight: 12 }, // warm white
  { color: [255, 232, 196], weight: 8 },  // yellow-white
  { color: [188, 214, 255], weight: 4 },  // bluish
  { color: [255, 220, 172], weight: 2 },  // warmer star
];

function randomBetween(min: number, max: number): number {
  return min + (max - min) * Math.random();
}

function pickStarColor(alpha: number): string {
  const total = STAR_COLORS.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;

  for (const item of STAR_COLORS) {
    roll -= item.weight;
    if (roll <= 0) {
      const [r, g, b] = item.color;
      return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
    }
  }

  return `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
}

function buildStars(width: number, height: number): TwinkleStar[] {
  const area = Math.max(width * height, 1);
  const count = Math.max(234, Math.min(598, Math.round((area / 5200) * 1.3)));
  const stars: TwinkleStar[] = [];

  for (let i = 0; i < count; i += 1) {
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const tierRoll = Math.random();
    const large = tierRoll > 0.86;
    const huge = tierRoll > 0.97;
    const sizePx = huge ? randomBetween(3.1, 4.6) : large ? randomBetween(1.8, 3.2) : randomBetween(0.7, 1.8);
    const durationSec = randomBetween(1.15, 5.6);
    const delaySec = Math.random() * durationSec;
    const minOpacity = randomBetween(0.05, 0.22);
    const maxOpacity = huge ? randomBetween(0.84, 1) : randomBetween(0.62, 0.96);
    const blurPx = huge ? randomBetween(1.8, 3.4) : Math.random() > 0.68 ? randomBetween(0.9, 2.2) : 0;
    const alpha = huge ? randomBetween(0.88, 1) : randomBetween(0.7, 0.96);
    const color = pickStarColor(alpha);

    stars.push({
      x,
      y,
      sizePx,
      color,
      minOpacity,
      maxOpacity,
      durationSec,
      delaySec,
      blurPx,
    });
  }

  return stars;
}

export default function SiteRandomTwinkle() {
  const [stars, setStars] = useState<TwinkleStar[]>([]);

  useEffect(() => {
    const apply = () => {
      setStars(buildStars(window.innerWidth, window.innerHeight));
    };

    let resizeTimer = 0;
    const onResize = () => {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(apply, 140);
    };

    apply();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return (
    <div className="site-random-twinkle" aria-hidden="true">
      {stars.map((star, index) => {
        const style: StarStyle = {
          left: `${star.x}%`,
          top: `${star.y}%`,
          width: `${star.sizePx}px`,
          height: `${star.sizePx}px`,
          color: star.color,
          animationDuration: `${star.durationSec.toFixed(2)}s`,
          animationDelay: `-${star.delaySec.toFixed(2)}s`,
          filter: star.blurPx > 0 ? `drop-shadow(0 0 ${star.blurPx.toFixed(2)}px currentColor)` : undefined,
          "--twinkle-min": star.minOpacity.toFixed(2),
          "--twinkle-max": star.maxOpacity.toFixed(2),
        };

        return <span key={index} className="site-random-twinkle-star" style={style} />;
      })}
    </div>
  );
}
