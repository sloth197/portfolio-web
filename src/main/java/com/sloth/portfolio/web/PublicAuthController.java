package com.sloth.portfolio.web;

import com.sloth.portfolio.domain.DeliveryChannel;
import com.sloth.portfolio.service.AccessAuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;

@RestController
@RequestMapping("/api/public/auth")
public class PublicAuthController {

    private final AccessAuthService accessAuthService;
    private final String cookieName;
    private final boolean cookieSecure;
    private final String sameSite;

    public PublicAuthController(
            AccessAuthService accessAuthService,
            @Value("${app.auth.cookie-name:PORTFOLIO_SESSION}") String cookieName,
            @Value("${app.auth.cookie-secure:false}") boolean cookieSecure,
            @Value("${app.auth.cookie-same-site:Lax}") String sameSite
    ) {
        this.accessAuthService = accessAuthService;
        this.cookieName = cookieName;
        this.cookieSecure = cookieSecure;
        this.sameSite = sameSite;
    }

    @PostMapping("/request-code")
    public RequestCodeResponse requestCode(@RequestBody RequestCodeRequest request, HttpServletRequest servletRequest) {
        if (request == null) {
            throw new AccessAuthService.InvalidRequestException("Request body is required");
        }
        AccessAuthService.RequestCodeResult result = accessAuthService.requestCode(
                request.phoneNumber(),
                resolveChannel(request.channel()),
                servletRequest.getRemoteAddr(),
                servletRequest.getHeader("User-Agent")
        );
        return new RequestCodeResponse(true, result.maskedPhoneNumber(), result.channel().name(), result.codeExpiresAt(), result.maxAttempts());
    }

    @PostMapping("/verify-code")
    public VerifyCodeResponse verifyCode(
            @RequestBody VerifyCodeRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse
    ) {
        if (request == null) {
            throw new AccessAuthService.InvalidRequestException("Request body is required");
        }
        AccessAuthService.VerifyResult result = accessAuthService.verifyCode(
                request.phoneNumber(),
                resolveChannel(request.channel()),
                request.code(),
                servletRequest.getRemoteAddr(),
                servletRequest.getHeader("User-Agent")
        );

        long maxAgeSeconds = Math.max(0, Duration.between(Instant.now(), result.sessionExpiresAt()).getSeconds());
        ResponseCookie responseCookie = ResponseCookie.from(cookieName, result.sessionToken())
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .sameSite(sameSite)
                .maxAge(maxAgeSeconds)
                .build();
        servletResponse.addHeader("Set-Cookie", responseCookie.toString());
        return new VerifyCodeResponse(true, result.sessionExpiresAt());
    }

    @GetMapping("/session")
    public SessionStatusResponse session(HttpServletRequest servletRequest) {
        String token = readCookie(servletRequest, cookieName);
        AccessAuthService.SessionStatus status = accessAuthService.getSessionStatus(token);
        return new SessionStatusResponse(status.authenticated(), status.sessionExpiresAt());
    }

    @PostMapping("/logout")
    public LogoutResponse logout(HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        String token = readCookie(servletRequest, cookieName);
        accessAuthService.revokeSession(token);
        ResponseCookie cleared = ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .sameSite(sameSite)
                .maxAge(0)
                .build();
        servletResponse.addHeader("Set-Cookie", cleared.toString());
        return new LogoutResponse(true);
    }

    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    @ExceptionHandler(AccessAuthService.UnauthorizedException.class)
    public ErrorResponse handleUnauthorized(AccessAuthService.UnauthorizedException e) {
        return new ErrorResponse("UNAUTHORIZED", e.getMessage());
    }

    @ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
    @ExceptionHandler(AccessAuthService.TooManyRequestsException.class)
    public ErrorResponse handleRateLimited(AccessAuthService.TooManyRequestsException e) {
        return new ErrorResponse("TOO_MANY_REQUESTS", e.getMessage());
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(AccessAuthService.InvalidRequestException.class)
    public ErrorResponse handleInvalidRequest(AccessAuthService.InvalidRequestException e) {
        return new ErrorResponse("BAD_REQUEST", e.getMessage());
    }

    private static String readCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private static DeliveryChannel resolveChannel(DeliveryChannel channel) {
        return channel == null ? DeliveryChannel.KAKAO : channel;
    }

    public record RequestCodeRequest(String phoneNumber, DeliveryChannel channel) {
    }

    public record RequestCodeResponse(
            boolean sent,
            String maskedPhoneNumber,
            String channel,
            Instant codeExpiresAt,
            int maxAttempts
    ) {
    }

    public record VerifyCodeRequest(String phoneNumber, String code, DeliveryChannel channel) {
    }

    public record VerifyCodeResponse(boolean authenticated, Instant sessionExpiresAt) {
    }

    public record SessionStatusResponse(boolean authenticated, Instant sessionExpiresAt) {
    }

    public record LogoutResponse(boolean success) {
    }

    public record ErrorResponse(String code, String message) {
    }
}
