package com.sloth.portfolio.web.dto;

import com.sloth.portfolio.domain.Project;
import com.sloth.portfolio.domain.ProjectCategory;

import java.time.Instant;
import java.util.List;

public record ProjectDto(
        Long id,
        ProjectCategory category,
        String title,
        String slug,
        String summary,
        String contentMarkdown,
        String githubUrl,
        List<ProjectAssetDto> assets,
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
                p.getAssets().stream().map(ProjectAssetDto::from).toList(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
