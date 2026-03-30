package com.sloth.portfolio.service;

import com.sloth.portfolio.domain.Notice;
import com.sloth.portfolio.repo.NoticeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class NoticeQueryService {

    private final NoticeRepository noticeRepository;

    public NoticeQueryService(NoticeRepository noticeRepository) {
        this.noticeRepository = noticeRepository;
    }

    public List<Notice> listAll() {
        return noticeRepository.findAllSortedForNoticePage();
    }

    public Notice getById(Long id) {
        return noticeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Notice not found: id=" + id));
    }

    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String message) {
            super(message);
        }
    }
}
