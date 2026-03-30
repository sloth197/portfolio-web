package com.sloth.portfolio.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NoticeCreateRequest(
        @NotBlank @Size(max = 140) String title,
        @NotBlank @Size(max = 5000) String content,
        boolean pinned
) {
}
