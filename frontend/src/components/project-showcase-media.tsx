"use client";

import { memo, useEffect, useMemo, useState } from "react";
import NextImage from "next/image";

type ProjectShowcaseMediaProps = {
  alt: string;
  isHovered: boolean;
  isGif: boolean;
  loading?: "eager" | "lazy";
  playToken?: number;
  src: string;
};

function appendQueryParam(url: string, key: string, value: string): string {
  const hashIndex = url.indexOf("#");
  const baseUrl = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}${hash}`;
}

function captureGifFirstFrame(gifUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    // Cross-origin GIFs must be CORS-enabled to allow canvas export.
    image.crossOrigin = "anonymous";

    image.onload = () => {
      try {
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        if (!width || !height) {
          resolve(null);
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          resolve(null);
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };

    image.onerror = () => resolve(null);
    image.src = gifUrl;
  });
}

function ProjectShowcaseMedia({
  alt,
  isHovered,
  isGif,
  loading = "lazy",
  playToken = 0,
  src,
}: ProjectShowcaseMediaProps) {
  const [posterSrc, setPosterSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!isGif) {
      return;
    }

    let isActive = true;

    void captureGifFirstFrame(src).then((frame) => {
      if (!isActive) {
        return;
      }
      setPosterSrc(frame);
    });

    return () => {
      isActive = false;
    };
  }, [isGif, src]);

  const animatedSrc = useMemo(() => {
    if (!isGif) {
      return src;
    }
    const token = playToken > 0 ? playToken : 1;
    return appendQueryParam(src, "gif-play", String(token));
  }, [isGif, playToken, src]);

  const currentSrc = isGif ? (isHovered ? animatedSrc : (posterSrc ?? src)) : src;

  if (!isGif) {
    return <NextImage className="project-showcase-media" src={currentSrc} alt={alt} fill sizes="(max-width: 640px) 112px, 220px" />;
  }

  // GIFs need a normal image element so the animated source can be restarted on hover.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="project-showcase-media" src={currentSrc} alt={alt} loading={loading} />;
}

export default memo(ProjectShowcaseMedia);
