package com.sloth.portfolio.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record NoticeUpdateRequest(
        @NotBlank @Size(max = 5000) String content,
        boolean pinned,
        @Min(12) @Max(48) Integer fontSize
) {
}
