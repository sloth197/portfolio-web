package com.sloth.portfolio.web.dto;

import com.sloth.portfolio.domain.ProjectCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProjectUpdateRequest(
        @NotNull ProjectCategory category,
        @NotBlank @Size(max = 120) String title,
        @NotBlank @Size(max = 160) String slug,
        @NotBlank @Size(max = 300) String summary,
        @NotBlank String contentMarkdown,
        @Size(max = 300) String githubUrl
) {}