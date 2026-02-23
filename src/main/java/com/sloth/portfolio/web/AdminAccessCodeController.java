package com.sloth.portfolio.web;

import com.sloth.portfolio.domain.DeliveryChannel;
import com.sloth.portfolio.service.AccessAuthService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/access-codes")
public class AdminAccessCodeController {

    private final AccessAuthService accessAuthService;

    public AdminAccessCodeController(AccessAuthService accessAuthService) {
        this.accessAuthService = accessAuthService;
    }

    @PostMapping
    public IssueCodeResponse issueCode(@RequestBody(required = false) IssueCodeRequest request) {
        String phoneNumber = request == null ? null : request.phoneNumber();
        DeliveryChannel channel = request == null || request.channel() == null ? DeliveryChannel.KAKAO : request.channel();
        boolean send = request == null || request.send() == null || request.send();
        AccessAuthService.IssueCodeResult result = accessAuthService.issueCodeForAdmin(
                phoneNumber,
                channel,
                request == null ? null : request.ttlMinutes(),
                request == null ? null : request.maxAttempts(),
                send
        );
        return new IssueCodeResponse(
                result.id(),
                result.phoneNumber(),
                result.channel(),
                result.code(),
                result.expiresAt(),
                result.maxAttempts(),
                result.createdAt()
        );
    }

    @GetMapping
    public List<AccessAuthService.AccessCodeSummary> listCodes() {
        return accessAuthService.listRecentCodes();
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(AccessAuthService.InvalidRequestException.class)
    public ErrorResponse handleBadRequest(AccessAuthService.InvalidRequestException e) {
        return new ErrorResponse("BAD_REQUEST", e.getMessage());
    }

    public record IssueCodeRequest(
            String phoneNumber,
            DeliveryChannel channel,
            Integer ttlMinutes,
            Integer maxAttempts,
            Boolean send
    ) {
    }

    public record IssueCodeResponse(
            Long id,
            String phoneNumber,
            DeliveryChannel channel,
            String code,
            java.time.Instant expiresAt,
            int maxAttempts,
            java.time.Instant createdAt
    ) {
    }

    public record ErrorResponse(String code, String message) {
    }
}
