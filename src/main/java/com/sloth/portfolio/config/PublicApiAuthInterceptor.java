package com.sloth.portfolio.config;

import com.sloth.portfolio.service.AccessAuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

@Component
public class PublicApiAuthInterceptor implements HandlerInterceptor {

    private final AccessAuthService accessAuthService;
    private final String cookieName;
    private final boolean authEnabled;

    public PublicApiAuthInterceptor(
            AccessAuthService accessAuthService,
            @Value("${app.auth.cookie-name:PORTFOLIO_SESSION}") String cookieName,
            @Value("${app.auth.enabled:true}") boolean authEnabled
    ) {
        this.accessAuthService = accessAuthService;
        this.cookieName = cookieName;
        this.authEnabled = authEnabled;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (!authEnabled) {
            return true;
        }

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String uri = request.getRequestURI();
        String normalizedUri = normalizeUri(uri);
        if (!uri.startsWith("/api/public/")) {
            return true;
        }

        if (normalizedUri.startsWith("/api/public/auth")
                || normalizedUri.startsWith("/api/public/notices")
                || "/api/public/health".equals(normalizedUri)) {
            return true;
        }

        String token = readCookie(request, cookieName);
        if (token == null || !accessAuthService.isSessionValid(token)) {
            writeUnauthorized(response);
            return false;
        }

        return true;
    }

    private static String normalizeUri(String uri) {
        if (uri == null || uri.isBlank() || "/".equals(uri)) {
            return "/";
        }
        if (uri.endsWith("/")) {
            return uri.substring(0, uri.length() - 1);
        }
        return uri;
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

    private static void writeUnauthorized(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"code\":\"UNAUTHORIZED\",\"message\":\"Authentication code is required\"}");
    }
}
