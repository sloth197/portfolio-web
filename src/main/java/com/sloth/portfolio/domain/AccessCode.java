package com.sloth.portfolio.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(
        name = "access_codes",
        indexes = {
                @Index(name = "idx_access_codes_created_at", columnList = "created_at"),
                @Index(name = "idx_access_codes_expires_at", columnList = "expires_at"),
                @Index(name = "idx_access_codes_used", columnList = "used"),
                @Index(name = "idx_access_codes_phone_channel", columnList = "phone_number,channel")
        }
)
public class AccessCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code_hash", nullable = false, length = 100)
    private String codeHash;

    @Column(name = "phone_number", length = 32)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private DeliveryChannel channel;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "max_attempts", nullable = false)
    private int maxAttempts;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount;

    @Column(nullable = false)
    private boolean used;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "used_at")
    private Instant usedAt;

    protected AccessCode() {
    }

    public AccessCode(
            String codeHash,
            String phoneNumber,
            DeliveryChannel channel,
            Instant expiresAt,
            int maxAttempts,
            Instant createdAt
    ) {
        this.codeHash = requireNonBlank(codeHash, "codeHash");
        this.phoneNumber = requireNonBlank(phoneNumber, "phoneNumber");
        this.channel = require(channel, "channel");
        this.expiresAt = require(expiresAt, "expiresAt");
        this.maxAttempts = positive(maxAttempts, "maxAttempts");
        this.attemptCount = 0;
        this.used = false;
        this.createdAt = require(createdAt, "createdAt");
    }

    public boolean isAvailable(Instant now) {
        return !used && expiresAt.isAfter(now) && attemptCount < maxAttempts;
    }

    public void registerFailure(Instant now) {
        this.attemptCount += 1;
        if (this.attemptCount >= this.maxAttempts) {
            this.used = true;
            this.usedAt = now;
        }
    }

    public void markUsed(Instant now) {
        this.used = true;
        this.usedAt = now;
    }

    public Long getId() {
        return id;
    }

    public String getCodeHash() {
        return codeHash;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public DeliveryChannel getChannel() {
        return channel;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public int getAttemptCount() {
        return attemptCount;
    }

    public boolean isUsed() {
        return used;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUsedAt() {
        return usedAt;
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

    private static int positive(int value, String field) {
        if (value <= 0) {
            throw new IllegalArgumentException(field + " must be > 0");
        }
        return value;
    }
}
