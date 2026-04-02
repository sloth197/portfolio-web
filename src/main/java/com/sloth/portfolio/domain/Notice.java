package com.sloth.portfolio.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(
        name = "notices",
        indexes = {
                @Index(name = "idx_notices_created_at", columnList = "created_at")
        }
)
public class Notice {

    private static final String DEFAULT_TITLE = "공지";
    private static final int DEFAULT_FONT_SIZE = 18;
    private static final int MIN_FONT_SIZE = 12;
    private static final int MAX_FONT_SIZE = 48;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 140)
    private String title;

    @Lob
    @Column(nullable = false)
    private String content;

    @Column(name = "is_pinned")
    private Boolean pinned;

    @Column(name = "font_size")
    private Integer fontSize;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Notice() {
        // JPA
    }

    public Notice(String content, boolean pinned, Integer fontSize) {
        this.title = DEFAULT_TITLE;
        this.content = requireNonBlank(content, "content", 5000);
        this.pinned = pinned;
        this.fontSize = normalizeFontSize(fontSize);
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.pinned == null) {
            this.pinned = false;
        }
        this.fontSize = normalizeFontSize(this.fontSize);
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public void update(String content, boolean pinned, Integer fontSize) {
        this.content = requireNonBlank(content, "content", 5000);
        this.pinned = pinned;
        this.fontSize = normalizeFontSize(fontSize);
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public boolean isPinned() {
        return Boolean.TRUE.equals(pinned);
    }

    public int getFontSize() {
        return normalizeFontSize(fontSize);
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    private static String requireNonBlank(String value, String field, int maxLength) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        String trimmed = value.trim();
        if (trimmed.length() > maxLength) {
            throw new IllegalArgumentException(field + " length must be <= " + maxLength);
        }
        return trimmed;
    }

    private static int normalizeFontSize(Integer value) {
        if (value == null) {
            return DEFAULT_FONT_SIZE;
        }
        if (value < MIN_FONT_SIZE || value > MAX_FONT_SIZE) {
            throw new IllegalArgumentException("fontSize must be between " + MIN_FONT_SIZE + " and " + MAX_FONT_SIZE);
        }
        return value;
    }
}
