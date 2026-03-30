package com.sloth.portfolio.service;

import com.sloth.portfolio.domain.Notice;
import com.sloth.portfolio.repo.NoticeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NoticeCommandService {

    private final NoticeRepository noticeRepository;

    public NoticeCommandService(NoticeRepository noticeRepository) {
        this.noticeRepository = noticeRepository;
    }

    public Notice create(Notice notice) {
        return noticeRepository.save(notice);
    }

    public Notice update(Long id, Notice newValue) {
        Notice existing = noticeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Notice not found: id=" + id));
        existing.update(newValue.getTitle(), newValue.getContent(), newValue.isPinned());
        return existing;
    }

    public void delete(Long id) {
        if (!noticeRepository.existsById(id)) {
            throw new NotFoundException("Notice not found: id=" + id);
        }
        noticeRepository.deleteById(id);
    }

    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String message) {
            super(message);
        }
    }
}
