package com.sloth.portfolio.repo;

import com.sloth.portfolio.domain.ProjectCategory;

import java.time.Instant;

public interface ProjectSummaryView {
    Long getId();
    ProjectCategory getCategory();
    String getTitle();
    String getSlug();
    String getSummary();
    String getProjectPeriod();
    Instant getCreatedAt();
    Instant getUpdatedAt();
}
