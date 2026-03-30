package com.sloth.portfolio.web;

import com.sloth.portfolio.domain.Notice;
import com.sloth.portfolio.service.NoticeCommandService;
import com.sloth.portfolio.web.dto.NoticeCreateRequest;
import com.sloth.portfolio.web.dto.NoticeDto;
import com.sloth.portfolio.web.dto.NoticeUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/notices")
public class AdminNoticeController {

    private final NoticeCommandService noticeCommandService;

    public AdminNoticeController(NoticeCommandService noticeCommandService) {
        this.noticeCommandService = noticeCommandService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public NoticeDto create(@Valid @RequestBody NoticeCreateRequest request) {
        Notice created = noticeCommandService.create(new Notice(request.title(), request.content(), request.pinned()));
        return NoticeDto.from(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public NoticeDto update(@PathVariable Long id, @Valid @RequestBody NoticeUpdateRequest request) {
        Notice updated = noticeCommandService.update(id, new Notice(request.title(), request.content(), request.pinned()));
        return NoticeDto.from(updated);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        noticeCommandService.delete(id);
    }

    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ExceptionHandler(NoticeCommandService.NotFoundException.class)
    public ErrorResponse handleNotFound(NoticeCommandService.NotFoundException e) {
        return new ErrorResponse("NOT_FOUND", e.getMessage());
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(IllegalArgumentException.class)
    public ErrorResponse handleInvalidInput(IllegalArgumentException e) {
        return new ErrorResponse("BAD_REQUEST", e.getMessage());
    }

    public record ErrorResponse(String code, String message) {
    }
}
