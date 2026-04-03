package com.sloth.portfolio.service;

import com.sloth.portfolio.domain.Project;
import com.sloth.portfolio.domain.ProjectAsset;
import com.sloth.portfolio.domain.ProjectAssetType;
import com.sloth.portfolio.repo.ProjectAssetRepository;
import com.sloth.portfolio.repo.ProjectRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class ProjectAssetService {

    private final ProjectRepository projectRepository;
    private final ProjectAssetRepository projectAssetRepository;
    private final Path uploadRoot;

    public ProjectAssetService(
            ProjectRepository projectRepository,
            ProjectAssetRepository projectAssetRepository,
            @Value("${app.upload.dir:uploads}") String uploadDir
    ) {
        this.projectRepository = projectRepository;
        this.projectAssetRepository = projectAssetRepository;
        this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
        ensureUploadDirExists();
    }

    public ProjectAsset upload(Long projectId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("File must not be empty");
        }

        @SuppressWarnings("null")
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Project not found: id=" + projectId));

        String originalName = sanitizeFileName(file.getOriginalFilename());
        String extension = extractExtension(originalName);
        String contentType = resolveContentType(file.getContentType(), extension);
        String storedName = projectId + "-" + UUID.randomUUID() + extension;
        Path target = resolveSafePath(storedName);

        try {
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new StorageException("Failed to store file: " + originalName, e);
        }

        ProjectAssetType type = detectType(contentType, extension);
        ProjectAsset asset = new ProjectAsset(
                project,
                type,
                originalName,
                storedName,
                contentType,
                file.getSize()
        );
        return projectAssetRepository.save(asset);
    }

    @Transactional(readOnly = true)
    public AssetFile loadAsset(Long assetId) {
        ProjectAsset asset = projectAssetRepository.findById(assetId)
                .orElseThrow(() -> new NotFoundException("Asset not found: id=" + assetId));

        return loadAssetByStoredNameInternal(
                asset.getStoredName(),
                asset.getAssetType() == ProjectAssetType.IMAGE,
                asset.getOriginalName(),
                asset.getContentType()
        );
    }

    @Transactional(readOnly = true)
    public AssetFile loadAssetByStoredName(String storedName) {
        String normalizedStoredName = normalizeStoredName(storedName);

        ProjectAsset asset = projectAssetRepository.findByStoredName(normalizedStoredName).orElse(null);
        boolean inline = asset != null
                ? asset.getAssetType() == ProjectAssetType.IMAGE
                : isImageByExtension(normalizedStoredName);
        String originalName = asset != null ? asset.getOriginalName() : normalizedStoredName;
        String contentType = asset != null ? asset.getContentType() : null;

        return loadAssetByStoredNameInternal(normalizedStoredName, inline, originalName, contentType);
    }

    public void deleteAsset(Long projectId, Long assetId) {
        ProjectAsset asset = projectAssetRepository.findByIdAndProjectId(assetId, projectId)
                .orElseThrow(() -> new NotFoundException("Asset not found: id=" + assetId + ", projectId=" + projectId));
        deleteStoredFileQuietly(asset.getStoredName());
        projectAssetRepository.delete(asset);
    }

    public void deleteAllByProjectId(Long projectId) {
        List<ProjectAsset> assets = projectAssetRepository.findByProjectIdOrderByCreatedAtAsc(projectId);
        for (ProjectAsset asset : assets) {
            deleteStoredFileQuietly(asset.getStoredName());
        }
        projectAssetRepository.deleteAll(assets);
    }

    private void ensureUploadDirExists() {
        try {
            Files.createDirectories(uploadRoot);
        } catch (IOException e) {
            throw new StorageException("Failed to create upload directory: " + uploadRoot, e);
        }
    }

    private Path resolveSafePath(String storedName) {
        Path resolved = uploadRoot.resolve(storedName).normalize();
        if (!resolved.startsWith(uploadRoot)) {
            throw new InvalidFileException("Invalid file path");
        }
        return resolved;
    }

    private AssetFile loadAssetByStoredNameInternal(
            String storedName,
            boolean inline,
            String originalName,
            String contentType
    ) {
        Path path = resolveSafePath(storedName);
        if (!Files.exists(path)) {
            throw new NotFoundException("Asset file not found: storedName=" + storedName);
        }
        Resource resource = new FileSystemResource(path.toFile());
        return new AssetFile(resource, originalName, contentType, inline);
    }

    private static String normalizeStoredName(String storedName) {
        if (storedName == null || storedName.isBlank()) {
            throw new NotFoundException("Asset not found: storedName is blank");
        }
        return storedName.trim();
    }

    private static String sanitizeFileName(String rawName) {
        String fallback = "file";
        if (rawName == null || rawName.isBlank()) {
            return fallback;
        }
        String cleaned = rawName.replace("\\", "/");
        int lastSlash = cleaned.lastIndexOf('/');
        if (lastSlash >= 0) {
            cleaned = cleaned.substring(lastSlash + 1);
        }
        cleaned = cleaned.replaceAll("[\\r\\n\\t]", "_");
        cleaned = cleaned.trim();
        return cleaned.isBlank() ? fallback : cleaned;
    }

    private static String extractExtension(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return "";
        }
        String ext = fileName.substring(dot).toLowerCase(Locale.ROOT);
        return ext.length() > 20 ? "" : ext;
    }

    private static String resolveContentType(String contentType, String extension) {
        if (contentType != null && !contentType.isBlank()) {
            return contentType.trim();
        }
        return switch (extension) {
            case ".gif" -> "image/gif";
            case ".png" -> "image/png";
            case ".jpg", ".jpeg" -> "image/jpeg";
            case ".webp" -> "image/webp";
            case ".svg" -> "image/svg+xml";
            case ".pdf" -> "application/pdf";
            case ".md" -> "text/markdown; charset=UTF-8";
            case ".txt" -> "text/plain; charset=UTF-8";
            case ".doc", ".docx" -> "application/msword";
            case ".ppt", ".pptx" -> "application/vnd.ms-powerpoint";
            case ".xls", ".xlsx" -> "application/vnd.ms-excel";
            default -> null;
        };
    }

    private static ProjectAssetType detectType(String contentType, String extension) {
        if (contentType != null && contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            return ProjectAssetType.IMAGE;
        }
        if (isImageByExtension(extension)) {
            return ProjectAssetType.IMAGE;
        }
        return ProjectAssetType.FILE;
    }

    private static boolean isImageByExtension(String value) {
        String lower = value.toLowerCase(Locale.ROOT);
        return lower.endsWith(".gif")
                || lower.endsWith(".png")
                || lower.endsWith(".jpg")
                || lower.endsWith(".jpeg")
                || lower.endsWith(".webp")
                || lower.endsWith(".svg")
                || lower.endsWith(".avif");
    }

    private void deleteStoredFileQuietly(String storedName) {
        try {
            Files.deleteIfExists(resolveSafePath(storedName));
        } catch (IOException ignored) {
            // Keep DB cleanup even if file deletion fails.
        }
    }

    public record AssetFile(Resource resource, String originalName, String contentType, boolean inline) {
    }

    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String message) {
            super(message);
        }
    }

    public static class InvalidFileException extends RuntimeException {
        public InvalidFileException(String message) {
            super(message);
        }
    }

    public static class StorageException extends RuntimeException {
        public StorageException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
