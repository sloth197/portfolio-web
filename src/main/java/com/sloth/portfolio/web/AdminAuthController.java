package com.sloth.portfolio.web;

import com.sloth.portfolio.service.AdminLoginThrottleService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Locale;

@RestController
@RequestMapping("/api/admin/auth")
@Validated
public class AdminAuthController {

    private final AuthenticationManager authenticationManager;
    private final AdminLoginThrottleService loginThrottleService;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();
    private final int sessionHours;

    public AdminAuthController(
            AuthenticationManager authenticationManager,
            AdminLoginThrottleService loginThrottleService,
            @Value("${app.admin.session-hours:12}") int sessionHours
    ) {
        this.authenticationManager = authenticationManager;
        this.loginThrottleService = loginThrottleService;
        this.sessionHours = Math.max(1, sessionHours);
    }

    @PostMapping("/login")
    public LoginResponse login(
            @RequestBody LoginRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse
    ) {
        if (request == null) {
            throw new UnauthorizedException("Invalid credentials");
        }

        Instant now = Instant.now();
        String throttleKey = resolveClientAddress(servletRequest);
        AdminLoginThrottleService.ThrottleStatus throttleStatus = loginThrottleService.check(throttleKey, now);
        if (!throttleStatus.allowed()) {
            throw new TooManyRequestsException("Too many login attempts. Try again later.");
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username().trim(), request.password())
            );
        } catch (BadCredentialsException ex) {
            loginThrottleService.recordFailure(throttleKey, now);
            throw new UnauthorizedException("Invalid credentials");
        } catch (AuthenticationException ex) {
            loginThrottleService.recordFailure(throttleKey, now);
            throw new UnauthorizedException("Invalid credentials");
        }

        loginThrottleService.clear(throttleKey);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, servletRequest, servletResponse);

        HttpSession session = servletRequest.getSession(false);
        if (session != null) {
            session.setMaxInactiveInterval(sessionHours * 3600);
        }

        String role = resolveRole(authentication);
        boolean canManageProjects = "ADMIN".equals(role);
        return new LoginResponse(true, role, canManageProjects);
    }

    @GetMapping("/session")
    public SessionStatusResponse session(Authentication authentication) {
        if (!isAuthenticated(authentication)) {
            return new SessionStatusResponse(false, null, false);
        }
        String role = resolveRole(authentication);
        return new SessionStatusResponse(true, role, "ADMIN".equals(role));
    }

    @PostMapping("/logout")
    public LogoutResponse logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return new LogoutResponse(true);
    }

    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    @ExceptionHandler(UnauthorizedException.class)
    public ErrorResponse handleUnauthorized(UnauthorizedException e) {
        return new ErrorResponse("UNAUTHORIZED", e.getMessage());
    }

    @ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
    @ExceptionHandler(TooManyRequestsException.class)
    public ErrorResponse handleTooManyRequests(TooManyRequestsException e) {
        return new ErrorResponse("TOO_MANY_REQUESTS", e.getMessage());
    }

    private static boolean isAuthenticated(Authentication authentication) {
        if (authentication == null) {
            return false;
        }
        if (authentication instanceof AnonymousAuthenticationToken) {
            return false;
        }
        return authentication.isAuthenticated();
    }

    private static String resolveRole(Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        return isAdmin ? "ADMIN" : "CRM";
    }

    private static String resolveClientAddress(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim().toLowerCase(Locale.ROOT);
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim().toLowerCase(Locale.ROOT);
        }
        String remote = request.getRemoteAddr();
        return remote == null || remote.isBlank() ? "unknown" : remote.trim().toLowerCase(Locale.ROOT);
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {
    }

    public record LoginResponse(boolean authenticated, String role, boolean canManageProjects) {
    }

    public record SessionStatusResponse(boolean authenticated, String role, boolean canManageProjects) {
    }

    public record LogoutResponse(boolean success) {
    }

    public record ErrorResponse(String code, String message) {
    }

    static final class UnauthorizedException extends RuntimeException {
        UnauthorizedException(String message) {
            super(message);
        }
    }

    static final class TooManyRequestsException extends RuntimeException {
        TooManyRequestsException(String message) {
            super(message);
        }
    }
}
