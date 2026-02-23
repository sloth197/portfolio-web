package com.sloth.portfolio.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
        name = "projects",
        indexes = {
                @Index(name = "idx_projects_category", columnList = "category"),
                @Index(name = "idx_projects_created_at", columnList = "created_at", unique = false),
                @Index(name = "uk_projects_slug", columnList = "slug", unique = true)
        }
)
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ProjectCategory category;

    @Column(nullable = false, length = 120)
    private String title;

    /**
     * URL에 쓰는 식별자. 예: "nrf-low-latency-link"
     */
    @Column(nullable = false, length = 160, unique = true)
    private String slug;

    /**
     * 리스트에 보여줄 짧은 설명(한두 줄).
     */
    @Column(nullable = false, length = 300)
    private String summary;

    /**
     * 상세 설명(마크다운). 길어질 수 있어 TEXT.
     */
    @Lob
    @Column(nullable = false)
    private String contentMarkdown;

    /**
     * GitHub repo 주소(선택). 예: https://github.com/sloth197/Low_Letency_Firmware
     */
    @Column(length = 300)
    private String githubUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Project() {
        // JPA용 기본 생성자
    }

    public Project(ProjectCategory category, String title, String slug, String summary, String contentMarkdown, String githubUrl) {
        this.category = require(category, "category");
        this.title = requireNonBlank(title, "title");
        this.slug = normalizeSlug(requireNonBlank(slug, "slug"));
        this.summary = requireNonBlank(summary, "summary");
        this.contentMarkdown = requireNonBlank(contentMarkdown, "contentMarkdown");
        this.githubUrl = (githubUrl == null || githubUrl.isBlank()) ? null : githubUrl.trim();
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public void update(ProjectCategory category, String title, String slug, String summary, String contentMarkdown, String githubUrl) {
        this.category = require(category, "category");
        this.title = requireNonBlank(title, "title");
        this.slug = normalizeSlug(requireNonBlank(slug, "slug"));
        this.summary = requireNonBlank(summary, "summary");
        this.contentMarkdown = requireNonBlank(contentMarkdown, "contentMarkdown");
        this.githubUrl = (githubUrl == null || githubUrl.isBlank()) ? null : githubUrl.trim();
    }

    // ===== getters (필요한 것만) =====
    public Long getId() { return id; }
    public ProjectCategory getCategory() { return category; }
    public String getTitle() { return title; }
    public String getSlug() { return slug; }
    public String getSummary() { return summary; }
    public String getContentMarkdown() { return contentMarkdown; }
    public String getGithubUrl() { return githubUrl; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    // ===== validation helpers =====
    private static <T> T require(T v, String field) {
        if (v == null) throw new IllegalArgumentException(field + " must not be null");
        return v;
    }

    private static String requireNonBlank(String v, String field) {
        if (v == null || v.isBlank()) throw new IllegalArgumentException(field + " must not be blank");
        return v.trim();
    }

    private static String normalizeSlug(String raw) {
        // 대충 URL-safe하게: 소문자, 공백->-, 허용: a-z 0-9 -
        String s = raw.trim().toLowerCase();
        s = s.replaceAll("\\s+", "-");
        s = s.replaceAll("[^a-z0-9\\-]", "");
        s = s.replaceAll("\\-+", "-");
        s = s.replaceAll("(^\\-)|(\\-$)", "");
        if (s.isBlank()) throw new IllegalArgumentException("slug becomes empty after normalization");
        return s;
    }
}