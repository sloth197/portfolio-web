package com.sloth.portfolio.web.dto;

import com.sloth.portfolio.domain.ProjectCategory;
import com.sloth.portfolio.repo.ProjectSummaryView;

import java.time.Instant;
import java.util.List;

public record ProjectSummaryDto(
        Long id,
        ProjectCategory category,
        String title,
        String slug,
        String summary,
        String projectPeriod,
        List<ProjectAssetDto> assets,
        Instant createdAt,
        Instant updatedAt
) {
    public static ProjectSummaryDto from(ProjectSummaryView project) {
        return from(project, List.of());
    }

    public static ProjectSummaryDto from(ProjectSummaryView project, List<ProjectAssetDto> assets) {
        return new ProjectSummaryDto(
                project.getId(),
                project.getCategory(),
                project.getTitle(),
                project.getSlug(),
                project.getSummary(),
                project.getProjectPeriod(),
                assets == null ? List.of() : List.copyOf(assets),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}
