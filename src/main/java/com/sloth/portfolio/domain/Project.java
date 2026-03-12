package com.sloth.portfolio.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

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
     * URL에 쓰는 식별자.
     */
    @Column(nullable = false, length = 160, unique = true)
    private String slug;

    /**
     * 짧은 설명
     */
    @Column(nullable = false, length = 300)
    private String summary;

    @Column(name = "project_period", length = 80)
    private String projectPeriod;

    /**
     * 상세 설명
     */
    @Lob
    @Column(nullable = false)
    private String contentMarkdown;

    /**
     * GitHub repositort URL
     */
    @Column(length = 300)
    private String githubUrl;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<ProjectAsset> assets = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Project() {
        // JPA용 기본 생성자
    }

    public Project(ProjectCategory category, String title, String slug, String summary, String projectPeriod, String contentMarkdown, String githubUrl) {
        this.category = require(category, "category");
        this.title = requireNonBlank(title, "title");
        this.slug = normalizeSlug(requireNonBlank(slug, "slug"));
        this.summary = requireNonBlank(summary, "summary");
        this.projectPeriod = normalizeProjectPeriod(projectPeriod);
        this.contentMarkdown = requireNonBlank(contentMarkdown, "contentMarkdown");
        this.githubUrl = normalizeOptional(githubUrl);
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

    public void update(ProjectCategory category, String title, String slug, String summary, String projectPeriod, String contentMarkdown, String githubUrl) {
        this.category = require(category, "category");
        this.title = requireNonBlank(title, "title");
        this.slug = normalizeSlug(requireNonBlank(slug, "slug"));
        this.summary = requireNonBlank(summary, "summary");
        this.projectPeriod = normalizeProjectPeriod(projectPeriod);
        this.contentMarkdown = requireNonBlank(contentMarkdown, "contentMarkdown");
        this.githubUrl = normalizeOptional(githubUrl);
    }

    // ===== getters (필요한 것만) =====
    public Long getId() { return id; }
    public ProjectCategory getCategory() { return category; }
    public String getTitle() { return title; }
    public String getSlug() { return slug; }
    public String getSummary() { return summary; }
    public String getProjectPeriod() { return projectPeriod; }
    public String getContentMarkdown() { return contentMarkdown; }
    public String getGithubUrl() { return githubUrl; }
    public List<ProjectAsset> getAssets() { return assets; }
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

    private static String normalizeOptional(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return raw.trim();
    }

    private static String normalizeProjectPeriod(String raw) {
        String value = normalizeOptional(raw);
        if (value == null) {
            return null;
        }
        if (value.length() > 80) {
            throw new IllegalArgumentException("projectPeriod length must be <= 80");
        }
        return value;
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
