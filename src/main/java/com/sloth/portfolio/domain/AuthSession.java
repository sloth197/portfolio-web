package com.sloth.portfolio.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(
        name = "auth_sessions",
        indexes = {
                @Index(name = "uk_auth_sessions_token_hash", columnList = "token_hash", unique = true),
                @Index(name = "idx_auth_sessions_expires_at", columnList = "expires_at"),
                @Index(name = "idx_auth_sessions_revoked_at", columnList = "revoked_at")
        }
)
public class AuthSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "access_code_id", nullable = false)
    private AccessCode accessCode;

    @Column(name = "token_hash", nullable = false, length = 64, unique = true)
    private String tokenHash;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", length = 400)
    private String userAgent;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    protected AuthSession() {
    }

    public AuthSession(
            AccessCode accessCode,
            String tokenHash,
            String ipAddress,
            String userAgent,
            Instant expiresAt,
            Instant createdAt
    ) {
        this.accessCode = require(accessCode, "accessCode");
        this.tokenHash = requireNonBlank(tokenHash, "tokenHash");
        this.ipAddress = normalize(ipAddress);
        this.userAgent = normalize(userAgent);
        this.expiresAt = require(expiresAt, "expiresAt");
        this.createdAt = require(createdAt, "createdAt");
    }

    public boolean isActive(Instant now) {
        return revokedAt == null && expiresAt.isAfter(now);
    }

    public void revoke(Instant now) {
        this.revokedAt = now;
    }

    public Long getId() {
        return id;
    }

    public AccessCode getAccessCode() {
        return accessCode;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    private static <T> T require(T value, String field) {
        if (value == null) {
            throw new IllegalArgumentException(field + " must not be null");
        }
        return value;
    }

    private static String requireNonBlank(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return value.trim();
    }

    private static String normalize(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
