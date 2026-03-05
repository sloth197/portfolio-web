package com.sloth.portfolio.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(
        name = "project_assets",
        indexes = {
                @Index(name = "idx_project_assets_project_id", columnList = "project_id"),
                @Index(name = "uk_project_assets_stored_name", columnList = "stored_name", unique = true)
        }
)
public class ProjectAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type", nullable = false, length = 16)
    private ProjectAssetType assetType;

    @Column(name = "original_name", nullable = false, length = 260)
    private String originalName;

    @Column(name = "stored_name", nullable = false, length = 140, unique = true)
    private String storedName;

    @Column(name = "content_type", length = 160)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private long fileSize;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ProjectAsset() {
        // JPA default constructor
    }

    public ProjectAsset(
            Project project,
            ProjectAssetType assetType,
            String originalName,
            String storedName,
            String contentType,
            long fileSize
    ) {
        this.project = require(project, "project");
        this.assetType = require(assetType, "assetType");
        this.originalName = requireNonBlank(originalName, "originalName");
        this.storedName = requireNonBlank(storedName, "storedName");
        this.contentType = (contentType == null || contentType.isBlank()) ? null : contentType.trim();
        this.fileSize = requireNonNegative(fileSize, "fileSize");
    }

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Project getProject() {
        return project;
    }

    public ProjectAssetType getAssetType() {
        return assetType;
    }

    public String getOriginalName() {
        return originalName;
    }

    public String getStoredName() {
        return storedName;
    }

    public String getContentType() {
        return contentType;
    }

    public long getFileSize() {
        return fileSize;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    private static <T> T require(T v, String field) {
        if (v == null) {
            throw new IllegalArgumentException(field + " must not be null");
        }
        return v;
    }

    private static String requireNonBlank(String v, String field) {
        if (v == null || v.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return v.trim();
    }

    private static long requireNonNegative(long value, String field) {
        if (value < 0) {
            throw new IllegalArgumentException(field + " must be non-negative");
        }
        return value;
    }
}
