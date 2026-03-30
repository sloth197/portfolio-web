package com.sloth.portfolio.web;

import com.sloth.portfolio.service.NoticeQueryService;
import com.sloth.portfolio.web.dto.NoticeDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/notices")
public class PublicNoticeController {

    private final NoticeQueryService noticeQueryService;

    public PublicNoticeController(NoticeQueryService noticeQueryService) {
        this.noticeQueryService = noticeQueryService;
    }

    @GetMapping
    public List<NoticeDto> listNotices() {
        return noticeQueryService.listAll().stream()
                .map(NoticeDto::from)
                .toList();
    }
}
