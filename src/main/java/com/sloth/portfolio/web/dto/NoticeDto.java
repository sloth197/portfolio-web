package com.sloth.portfolio.web.dto;

import com.sloth.portfolio.domain.Notice;

import java.time.Instant;

public record NoticeDto(
        Long id,
        String title,
        String content,
        boolean pinned,
        int fontSize,
        Instant createdAt,
        Instant updatedAt
) {
    public static NoticeDto from(Notice notice) {
        return new NoticeDto(
                notice.getId(),
                notice.getTitle(),
                notice.getContent(),
                notice.isPinned(),
                notice.getFontSize(),
                notice.getCreatedAt(),
                notice.getUpdatedAt()
        );
    }
}
