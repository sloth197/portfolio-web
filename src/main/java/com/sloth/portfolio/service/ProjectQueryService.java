package com.sloth.portfolio.service;

import com.sloth.portfolio.domain.Project;
import com.sloth.portfolio.domain.ProjectAsset;
import com.sloth.portfolio.domain.ProjectAssetType;
import com.sloth.portfolio.domain.ProjectCategory;
import com.sloth.portfolio.repo.ProjectAssetRepository;
import com.sloth.portfolio.repo.ProjectRepository;
import com.sloth.portfolio.repo.ProjectSummaryView;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class ProjectQueryService {

    private final ProjectRepository projectRepository;
    private final ProjectAssetRepository projectAssetRepository;

    public ProjectQueryService(ProjectRepository projectRepository, ProjectAssetRepository projectAssetRepository) {
        this.projectRepository = projectRepository;
        this.projectAssetRepository = projectAssetRepository;
    }

    public List<Project> listAll(ProjectCategory category) {
        if (category == null) {
            return projectRepository.findAllByOrderByCreatedAtDesc();
        }
        return projectRepository.findByCategoryOrderByCreatedAtDesc(category);
    }

    public List<ProjectSummaryView> listSummaries(ProjectCategory category) {
        if (category == null) {
            return projectRepository.findProjectedByOrderByCreatedAtDesc();
        }
        return projectRepository.findProjectedByCategoryOrderByCreatedAtDesc(category);
    }

    public Map<Long, ProjectAsset> listPreviewImageAssets(List<Long> projectIds) {
        if (projectIds == null || projectIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, ProjectAsset> previewAssets = new LinkedHashMap<>();
        projectAssetRepository.findByProjectIdInOrderByProjectIdAscCreatedAtAsc(projectIds).stream()
                .filter(ProjectQueryService::isImageAsset)
                .forEach(asset -> previewAssets.putIfAbsent(asset.getProject().getId(), asset));
        return previewAssets;
    }

    public Project getBySlug(String slug) {
        return projectRepository.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Project not found: slug=" + slug));
    }

    private static boolean isImageAsset(ProjectAsset asset) {
        if (asset.getAssetType() == ProjectAssetType.IMAGE) {
            return true;
        }
        String contentType = asset.getContentType();
        if (contentType != null && contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            return true;
        }
        return hasImageExtension(asset.getOriginalName()) || hasImageExtension(asset.getStoredName());
    }

    private static boolean hasImageExtension(String value) {
        if (value == null) {
            return false;
        }
        String lower = value.toLowerCase(Locale.ROOT);
        return lower.endsWith(".png")
                || lower.endsWith(".jpg")
                || lower.endsWith(".jpeg")
                || lower.endsWith(".gif")
                || lower.endsWith(".webp")
                || lower.endsWith(".svg")
                || lower.endsWith(".avif");
    }

    // --- 내부 전용 예외 (404로 매핑할 예정) ---
    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String message) { super(message); }
    }
}
