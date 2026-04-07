"use client";

import { useState } from "react";
import Link from "next/link";
import { pickProjectPreviewMedia } from "@/lib/project-media";
import type { ProjectDto } from "@/lib/types";
import ProjectShowcaseMedia from "@/components/project-showcase-media";

type ProjectShowcaseCardProps = {
  href: string;
  index: number;
  periodText?: string | null;
  project: ProjectDto;
};

export default function ProjectShowcaseCard({
  href,
  index,
  periodText,
  project,
}: ProjectShowcaseCardProps) {
  const [isMediaHovered, setIsMediaHovered] = useState(false);
  const [playToken, setPlayToken] = useState(0);
  const previewMedia = pickProjectPreviewMedia(project);

  return (
    <article className="project-showcase-card">
      <div
        className={`project-showcase-shot shot-variant-${index % 6}`}
        onMouseEnter={() => {
          setIsMediaHovered(true);
          setPlayToken((prev) => prev + 1);
        }}
        onMouseLeave={() => setIsMediaHovered(false)}
      >
        {previewMedia ? (
          <>
            <ProjectShowcaseMedia
              key={previewMedia.url}
              src={previewMedia.url}
              alt={previewMedia.alt}
              isHovered={isMediaHovered}
              isGif={previewMedia.isGif}
              loading="lazy"
              playToken={playToken}
            />
            <span className="project-showcase-media-overlay" aria-hidden="true" />
          </>
        ) : null}
        <span className="project-showcase-slug">{project.slug}</span>
      </div>

      <div className="project-showcase-body">
        <h3 className="project-showcase-title">{project.title}</h3>
        <p className="project-showcase-summary">{project.summary}</p>

        {periodText?.trim() ? (
          <div className="project-tag-row">
            <span className="project-tag-pill">{periodText.trim()}</span>
          </div>
        ) : null}

        <Link href={href} className="btn project-showcase-link">
          view
        </Link>
      </div>
    </article>
  );
}
