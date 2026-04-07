"use client";

import { useEffect, useMemo, useState } from "react";

type ProjectShowcaseMediaProps = {
  alt: string;
  isGif: boolean;
  loading?: "eager" | "lazy";
  src: string;
};

const GIF_PLACEHOLDER = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

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

export default function ProjectShowcaseMedia({
  alt,
  isGif,
  loading = "lazy",
  src,
}: ProjectShowcaseMediaProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [posterSrc, setPosterSrc] = useState<string | null>(null);
  const [playVersion, setPlayVersion] = useState(0);

  useEffect(() => {
    if (!isGif) {
      return;
    }

    let isActive = true;

    void captureGifFirstFrame(src).then((frame) => {
      if (!isActive) {
        return;
      }
      setPosterSrc(frame ?? src);
    });

    return () => {
      isActive = false;
    };
  }, [isGif, src]);

  const animatedSrc = useMemo(() => {
    if (!isGif) {
      return src;
    }
    if (playVersion === 0) {
      return src;
    }
    return appendQueryParam(src, "gif-play", String(playVersion));
  }, [isGif, playVersion, src]);

  const currentSrc = isGif
    ? (isPlaying ? animatedSrc : (posterSrc ?? GIF_PLACEHOLDER))
    : src;

  const handlePointerEnter = () => {
    if (!isGif) {
      return;
    }
    setPlayVersion((prev) => prev + 1);
    setIsPlaying(true);
  };

  const handlePointerLeave = () => {
    if (!isGif) {
      return;
    }
    setIsPlaying(false);
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="project-showcase-media"
      src={currentSrc}
      alt={alt}
      loading={loading}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    />
  );
}
