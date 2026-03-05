package com.sloth.portfolio.web.dto;

import com.sloth.portfolio.domain.ProjectAsset;
import com.sloth.portfolio.domain.ProjectAssetType;

import java.time.Instant;

public record ProjectAssetDto(
        Long id,
        ProjectAssetType assetType,
        String originalName,
        String contentType,
        long fileSize,
        String url,
        Instant createdAt
) {
    public static ProjectAssetDto from(ProjectAsset asset) {
        return new ProjectAssetDto(
                asset.getId(),
                asset.getAssetType(),
                asset.getOriginalName(),
                asset.getContentType(),
                asset.getFileSize(),
                "/api/public/assets/" + asset.getId(),
                asset.getCreatedAt()
        );
    }
}
