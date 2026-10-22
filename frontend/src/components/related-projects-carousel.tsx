"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProjectSummaryDto } from "@/lib/types";

type Props = { projects: ProjectSummaryDto[]; currentSlug: string };

export default function RelatedProjectsCarousel({ projects, currentSlug }: Props) {
  const [offset, setOffset] = useState(0);
  const maxOffset = Math.max(0, projects.length - 4);
  const visible = projects.slice(offset, offset + 4);

  return (
    <div className="related-projects-carousel">
      <button type="button" className="related-projects-arrow" onClick={() => setOffset(Math.max(0, offset - 1))} disabled={offset === 0} aria-label="Previous projects">←</button>
      <div className="project-detail-related-list">
        {visible.map((item) => (
          <Link key={item.id} href={`/projects/${item.slug}`} className={`project-detail-related-item ${item.slug === currentSlug ? "is-current" : ""}`}>
            <span className="badge">{item.category === "SOFTWARE" ? "C#" : "Java"}</span>
            <div className="project-detail-related-title">{item.title}</div>
            {item.projectPeriod ? <span className="project-tag-pill" style={{ width: "fit-content" }}>{item.projectPeriod}</span> : null}
            <p className="section-copy" style={{ margin: 0, fontSize: 13 }}>{item.summary}</p>
          </Link>
        ))}
      </div>
      <button type="button" className="related-projects-arrow" onClick={() => setOffset(Math.min(maxOffset, offset + 1))} disabled={offset === maxOffset} aria-label="Next projects">→</button>
    </div>
  );
}
