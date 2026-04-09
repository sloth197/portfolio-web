package com.sloth.portfolio;

import com.sloth.portfolio.domain.Notice;
import com.sloth.portfolio.service.NoticeCommandService;
import com.sloth.portfolio.service.NoticeQueryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class NoticeCommandServiceTests {

    @Autowired
    private NoticeCommandService noticeCommandService;

    @Autowired
    private NoticeQueryService noticeQueryService;

    @Test
    void creatingPinnedNoticeUnpinsPreviousPinnedNotice() {
        Notice firstPinned = noticeCommandService.create(new Notice("First pinned", true, 18));
        Notice secondPinned = noticeCommandService.create(new Notice("Second pinned", true, 18));

        assertThat(noticeQueryService.getById(firstPinned.getId()).isPinned()).isFalse();
        assertThat(noticeQueryService.getById(secondPinned.getId()).isPinned()).isTrue();
    }

    @Test
    void updatingNoticeToPinnedUnpinsExistingPinnedNotice() {
        Notice pinned = noticeCommandService.create(new Notice("Pinned notice", true, 18));
        Notice candidate = noticeCommandService.create(new Notice("Candidate notice", false, 18));

        noticeCommandService.update(candidate.getId(), new Notice("Candidate notice updated", true, 18));

        assertThat(noticeQueryService.getById(pinned.getId()).isPinned()).isFalse();
        assertThat(noticeQueryService.getById(candidate.getId()).isPinned()).isTrue();
    }
}
