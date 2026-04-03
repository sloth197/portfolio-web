package com.sloth.portfolio.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@Component
public class AdminOriginValidationFilter extends OncePerRequestFilter {

    private static final Set<String> MUTATING_METHODS = Set.of(
            HttpMethod.POST.name(),
            HttpMethod.PUT.name(),
            HttpMethod.PATCH.name(),
            HttpMethod.DELETE.name()
    );

    private final Set<String> allowedOrigins;

    public AdminOriginValidationFilter(
            @Value("${app.cors.allowed-origins:http://localhost:3000,https://xhbt.dev,https://www.xhbt.dev}") String allowedOrigins
    ) {
        this.allowedOrigins = new HashSet<>();
        Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .map(AdminOriginValidationFilter::normalizeOrigin)
                .forEach(this.allowedOrigins::add);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null || !path.startsWith("/api/admin/")) {
            return true;
        }
        String method = request.getMethod();
        return method == null || !MUTATING_METHODS.contains(method.toUpperCase(Locale.ROOT));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String origin = request.getHeader("Origin");
        if (origin == null || origin.isBlank()) {
            String referer = request.getHeader("Referer");
            if (referer == null || referer.isBlank()) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"code\":\"MISSING_ORIGIN\",\"message\":\"Origin or Referer header is required\"}");
                return;
            }
            String refererOrigin = normalizeOrigin(referer);
            if (!allowedOrigins.contains(refererOrigin)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"code\":\"INVALID_REFERER\",\"message\":\"Referer is not allowed\"}");
                return;
            }
            filterChain.doFilter(request, response);
            return;
        }

        String normalizedOrigin = normalizeOrigin(origin);
        if (!allowedOrigins.contains(normalizedOrigin)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":\"INVALID_ORIGIN\",\"message\":\"Origin is not allowed\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static String normalizeOrigin(String origin) {
        try {
            URI parsed = URI.create(origin.trim());
            String scheme = parsed.getScheme() == null ? "" : parsed.getScheme().toLowerCase(Locale.ROOT);
            String host = parsed.getHost() == null ? "" : parsed.getHost().toLowerCase(Locale.ROOT);
            int port = parsed.getPort();
            String normalized = scheme + "://" + host;
            if (port >= 0) {
                normalized += ":" + port;
            }
            return normalized;
        } catch (Exception ignored) {
            return origin.trim().toLowerCase(Locale.ROOT);
        }
    }
}
