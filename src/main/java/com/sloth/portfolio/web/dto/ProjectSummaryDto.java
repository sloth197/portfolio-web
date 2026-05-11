package com.sloth.portfolio.web.dto;

import com.sloth.portfolio.domain.ProjectCategory;
import com.sloth.portfolio.repo.ProjectSummaryView;

import java.time.Instant;

public record ProjectSummaryDto(
        Long id,
        ProjectCategory category,
        String title,
        String slug,
        String summary,
        String projectPeriod,
        Instant createdAt,
        Instant updatedAt
) {
    public static ProjectSummaryDto from(ProjectSummaryView project) {
        return new ProjectSummaryDto(
                project.getId(),
                project.getCategory(),
                project.getTitle(),
                project.getSlug(),
                project.getSummary(),
                project.getProjectPeriod(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}
