package com.sloth.portfolio.web.dto;

import com.sloth.portfolio.domain.ProjectCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProjectUpdateRequest(
        @NotNull ProjectCategory category,
        @NotBlank @Size(max = 120) String title,
        @NotBlank @Size(max = 300) String summary,
        @Size(max = 80) String projectPeriod,
        @NotBlank String contentMarkdown,
        @Size(max = 300) String githubUrl
) {}
