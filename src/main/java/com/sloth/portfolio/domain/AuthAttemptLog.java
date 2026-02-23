package com.sloth.portfolio.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
        name = "auth_attempt_logs",
        indexes = {
                @Index(name = "idx_auth_attempt_logs_created_at", columnList = "created_at"),
                @Index(name = "idx_auth_attempt_logs_success", columnList = "success"),
                @Index(name = "idx_auth_attempt_logs_reason", columnList = "reason")
        }
)
public class AuthAttemptLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "access_code_id")
    private AccessCode accessCode;

    @Column(nullable = false)
    private boolean success;

    @Column(nullable = false, length = 80)
    private String reason;

    @Column(name = "phone_number", length = 32)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private DeliveryChannel channel;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", length = 400)
    private String userAgent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AuthAttemptLog() {
    }

    public AuthAttemptLog(
            AccessCode accessCode,
            String phoneNumber,
            DeliveryChannel channel,
            boolean success,
            String reason,
            String ipAddress,
            String userAgent,
            Instant createdAt
    ) {
        this.accessCode = accessCode;
        this.phoneNumber = normalize(phoneNumber);
        this.channel = channel;
        this.success = success;
        this.reason = requireNonBlank(reason, "reason");
        this.ipAddress = normalize(ipAddress);
        this.userAgent = normalize(userAgent);
        this.createdAt = require(createdAt, "createdAt");
    }

    public Long getId() {
        return id;
    }

    public AccessCode getAccessCode() {
        return accessCode;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getReason() {
        return reason;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public DeliveryChannel getChannel() {
        return channel;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public Instant getCreatedAt() {
        return createdAt;
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
