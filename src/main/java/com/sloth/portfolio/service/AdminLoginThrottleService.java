package com.sloth.portfolio.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AdminLoginThrottleService {

    private static final int MAX_TRACKED_ENTRIES = 10_000;

    private final int maxAttempts;
    private final Duration windowDuration;
    private final Duration lockDuration;
    private final Map<String, AttemptState> states = new ConcurrentHashMap<>();

    public AdminLoginThrottleService(
            @Value("${app.admin.login-max-attempts:5}") int maxAttempts,
            @Value("${app.admin.login-window-seconds:300}") int windowSeconds,
            @Value("${app.admin.login-lock-seconds:900}") int lockSeconds
    ) {
        this.maxAttempts = Math.max(1, maxAttempts);
        this.windowDuration = Duration.ofSeconds(Math.max(30, windowSeconds));
        this.lockDuration = Duration.ofSeconds(Math.max(30, lockSeconds));
    }

    public ThrottleStatus check(String key, Instant now) {
        cleanupIfNeeded(now);
        AttemptState state = states.computeIfAbsent(normalizeKey(key), ignored -> new AttemptState());
        synchronized (state) {
            if (state.lockedUntil != null && now.isBefore(state.lockedUntil)) {
                return new ThrottleStatus(false, state.lockedUntil);
            }
            if (state.lockedUntil != null && !now.isBefore(state.lockedUntil)) {
                state.lockedUntil = null;
                state.failedCount = 0;
                state.windowStartedAt = null;
            }
            if (state.windowStartedAt != null && now.isAfter(state.windowStartedAt.plus(windowDuration))) {
                state.failedCount = 0;
                state.windowStartedAt = null;
            }
            return new ThrottleStatus(true, null);
        }
    }

    public void recordFailure(String key, Instant now) {
        AttemptState state = states.computeIfAbsent(normalizeKey(key), ignored -> new AttemptState());
        synchronized (state) {
            if (state.windowStartedAt == null || now.isAfter(state.windowStartedAt.plus(windowDuration))) {
                state.windowStartedAt = now;
                state.failedCount = 0;
            }
            state.failedCount += 1;
            if (state.failedCount >= maxAttempts) {
                state.lockedUntil = now.plus(lockDuration);
                state.failedCount = 0;
                state.windowStartedAt = null;
            }
        }
    }

    public void clear(String key) {
        states.remove(normalizeKey(key));
    }

    private void cleanupIfNeeded(Instant now) {
        if (states.size() <= MAX_TRACKED_ENTRIES) {
            return;
        }
        states.entrySet().removeIf(entry -> {
            AttemptState state = entry.getValue();
            synchronized (state) {
                if (state.lockedUntil != null) {
                    return now.isAfter(state.lockedUntil.plusSeconds(60));
                }
                if (state.windowStartedAt != null) {
                    return now.isAfter(state.windowStartedAt.plus(windowDuration).plusSeconds(60));
                }
                return true;
            }
        });
    }

    private static String normalizeKey(String key) {
        if (key == null || key.isBlank()) {
            return "unknown";
        }
        return key.trim();
    }

    private static final class AttemptState {
        private int failedCount;
        private Instant windowStartedAt;
        private Instant lockedUntil;
    }

    public record ThrottleStatus(boolean allowed, Instant lockedUntil) {
    }
}
