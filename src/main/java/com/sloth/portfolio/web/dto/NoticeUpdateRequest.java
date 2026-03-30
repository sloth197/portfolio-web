package com.sloth.portfolio.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NoticeUpdateRequest(
        @NotBlank @Size(max = 140) String title,
        @NotBlank @Size(max = 5000) String content,
        boolean pinned
) {
}
