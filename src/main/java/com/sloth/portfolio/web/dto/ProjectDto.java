package com.sloth.portfolio.web.dto;

import com.sloth.portfolio.domain.Project;
import com.sloth.portfolio.domain.ProjectCategory;

import java.time.Instant;

public record ProjectDto(
        Long id,
        ProjectCategory category,
        String title,
        String slug,
        String summary,
        String contentMarkdown,
        String githubUrl,
        Instant createdAt,
        Instant updatedAt
) {
    public static ProjectDto from(Project p) {
        return new ProjectDto(
                p.getId(),
                p.getCategory(),
                p.getTitle(),
                p.getSlug(),
                p.getSummary(),
                p.getContentMarkdown(),
                p.getGithubUrl(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}