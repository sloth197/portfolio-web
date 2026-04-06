package com.sloth.portfolio.service;

import com.sloth.portfolio.domain.Project;
import com.sloth.portfolio.domain.ProjectAsset;
import com.sloth.portfolio.domain.ProjectAssetType;
import com.sloth.portfolio.repo.ProjectAssetRepository;
import com.sloth.portfolio.repo.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class ProjectAssetService {

    private static final Logger log = LoggerFactory.getLogger(ProjectAssetService.class);
    private static final Duration STORAGE_REQUEST_TIMEOUT = Duration.ofSeconds(60);

    private final ProjectRepository projectRepository;
    private final ProjectAssetRepository projectAssetRepository;
    private final UploadProvider uploadProvider;
    private final Path uploadRoot;
    private final HttpClient httpClient;
    private final String supabaseObjectBaseUrl;
    private final String supabaseServiceRoleKey;

    private enum UploadProvider {
        LOCAL,
        SUPABASE
    }

    public ProjectAssetService(
            ProjectRepository projectRepository,
            ProjectAssetRepository projectAssetRepository,
            @Value("${app.upload.provider:auto}") String uploadProvider,
            @Value("${app.upload.dir:uploads}") String uploadDir,
            @Value("${app.upload.supabase.url:}") String supabaseUrl,
            @Value("${app.upload.supabase.bucket:}") String supabaseBucket,
            @Value("${app.upload.supabase.service-role-key:}") String supabaseServiceRoleKey
    ) {
        this.projectRepository = projectRepository;
        this.projectAssetRepository = projectAssetRepository;
        this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
        this.httpClient = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NORMAL).build();
        this.supabaseServiceRoleKey = normalizeBlankToNull(supabaseServiceRoleKey);
        this.uploadProvider = resolveUploadProvider(uploadProvider, supabaseUrl, supabaseBucket, this.supabaseServiceRoleKey);
        this.supabaseObjectBaseUrl = this.uploadProvider == UploadProvider.SUPABASE
                ? buildSupabaseObjectBaseUrl(supabaseUrl, supabaseBucket)
                : null;

        if (this.uploadProvider == UploadProvider.LOCAL) {
            ensureUploadDirExists();
            log.info("Project asset storage provider: LOCAL (dir={})", this.uploadRoot);
        } else {
            log.info("Project asset storage provider: SUPABASE (bucket={})", normalizeBlankToNull(supabaseBucket));
        }
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

        if (uploadProvider == UploadProvider.SUPABASE) {
            uploadToSupabase(storedName, file, contentType, originalName);
        } else {
            uploadToLocal(storedName, file, originalName);
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
        deleteStoredAssetQuietly(asset.getStoredName());
        projectAssetRepository.delete(asset);
    }

    public void deleteAllByProjectId(Long projectId) {
        List<ProjectAsset> assets = projectAssetRepository.findByProjectIdOrderByCreatedAtAsc(projectId);
        for (ProjectAsset asset : assets) {
            deleteStoredAssetQuietly(asset.getStoredName());
        }
        projectAssetRepository.deleteAll(assets);
    }

    private UploadProvider resolveUploadProvider(
            String configuredProvider,
            String supabaseUrl,
            String supabaseBucket,
            String serviceRoleKey
    ) {
        String normalizedProvider = normalizeBlankToNull(configuredProvider);
        String providerValue = normalizedProvider == null ? "auto" : normalizedProvider.toLowerCase(Locale.ROOT);
        boolean supabaseConfigComplete = isSupabaseConfigComplete(supabaseUrl, supabaseBucket, serviceRoleKey);

        return switch (providerValue) {
            case "auto" -> supabaseConfigComplete ? UploadProvider.SUPABASE : UploadProvider.LOCAL;
            case "local" -> UploadProvider.LOCAL;
            case "supabase" -> {
                if (!supabaseConfigComplete) {
                    throw new IllegalStateException(
                            "APP_UPLOAD_PROVIDER is 'supabase' but Supabase Storage config is incomplete. "
                                    + "Required: APP_UPLOAD_SUPABASE_URL, APP_UPLOAD_SUPABASE_BUCKET, APP_UPLOAD_SUPABASE_SERVICE_ROLE_KEY"
                    );
                }
                yield UploadProvider.SUPABASE;
            }
            default -> throw new IllegalStateException("Unsupported app.upload.provider value: " + configuredProvider);
        };
    }

    private static boolean isSupabaseConfigComplete(String supabaseUrl, String supabaseBucket, String serviceRoleKey) {
        return normalizeBlankToNull(supabaseUrl) != null
                && normalizeBlankToNull(supabaseBucket) != null
                && normalizeBlankToNull(serviceRoleKey) != null;
    }

    private static String buildSupabaseObjectBaseUrl(String supabaseUrl, String supabaseBucket) {
        String normalizedUrl = normalizeBlankToNull(supabaseUrl);
        String normalizedBucket = normalizeBlankToNull(supabaseBucket);
        if (normalizedUrl == null || normalizedBucket == null) {
            throw new IllegalStateException("Supabase Storage URL/Bucket is not configured");
        }
        String baseUrlWithoutTrailingSlash = normalizedUrl.replaceAll("/+$", "");
        return baseUrlWithoutTrailingSlash + "/storage/v1/object/" + encodePathSegment(normalizedBucket);
    }

    private void uploadToLocal(String storedName, MultipartFile file, String originalName) {
        Path target = resolveSafePath(storedName);
        try {
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new StorageException("Failed to store file: " + originalName, e);
        }
    }

    private void uploadToSupabase(String storedName, MultipartFile file, String contentType, String originalName) {
        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            throw new StorageException("Failed to read file bytes: " + originalName, e);
        }

        String objectUrl = buildSupabaseObjectUrl(storedName);
        HttpRequest request = supabaseRequestBuilder(objectUrl)
                .header("Content-Type", contentType == null ? "application/octet-stream" : contentType)
                .header("x-upsert", "true")
                .POST(HttpRequest.BodyPublishers.ofByteArray(fileBytes))
                .build();

        HttpResponse<String> response = sendForText(request, "upload");
        if (!isSuccessStatus(response.statusCode())) {
            throw new StorageException(
                    "Failed to upload file to Supabase Storage: status=" + response.statusCode() + ", body=" + abbreviateBody(response.body()),
                    null
            );
        }
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
        if (uploadProvider == UploadProvider.SUPABASE) {
            return loadAssetFromSupabase(storedName, inline, originalName, contentType);
        }

        Path path = resolveSafePath(storedName);
        if (!Files.exists(path)) {
            throw new NotFoundException("Asset file not found: storedName=" + storedName);
        }
        Resource resource = new FileSystemResource(path.toFile());
        return new AssetFile(resource, originalName, contentType, inline);
    }

    private AssetFile loadAssetFromSupabase(String storedName, boolean inline, String originalName, String contentType) {
        String objectUrl = buildSupabaseObjectUrl(storedName);
        HttpRequest request = supabaseRequestBuilder(objectUrl)
                .GET()
                .build();

        HttpResponse<byte[]> response = sendForBytes(request, "download");
        if (response.statusCode() == 404) {
            throw new NotFoundException("Asset file not found: storedName=" + storedName);
        }
        if (!isSuccessStatus(response.statusCode())) {
            throw new StorageException("Failed to download asset from Supabase Storage: status=" + response.statusCode(), null);
        }

        String resolvedContentType = normalizeBlankToNull(contentType);
        if (resolvedContentType == null) {
            resolvedContentType = response.headers().firstValue("Content-Type").orElse(null);
        }

        Resource resource = new ByteArrayResource(response.body());
        return new AssetFile(resource, originalName, resolvedContentType, inline);
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

    private void deleteStoredAssetQuietly(String storedName) {
        if (uploadProvider == UploadProvider.SUPABASE) {
            deleteSupabaseObjectQuietly(storedName);
            return;
        }

        try {
            Files.deleteIfExists(resolveSafePath(storedName));
        } catch (IOException ignored) {
            // Keep DB cleanup even if file deletion fails.
        }
    }

    private void deleteSupabaseObjectQuietly(String storedName) {
        if (normalizeBlankToNull(storedName) == null) {
            return;
        }

        try {
            HttpRequest request = supabaseRequestBuilder(buildSupabaseObjectUrl(storedName))
                    .DELETE()
                    .build();
            HttpResponse<String> response = sendForText(request, "delete");
            if (isSuccessStatus(response.statusCode()) || response.statusCode() == 404) {
                return;
            }
            log.warn("Supabase delete returned non-success status for {}: {}", storedName, response.statusCode());
        } catch (StorageException e) {
            log.warn("Supabase delete failed for {}: {}", storedName, e.getMessage());
        }
    }

    private String buildSupabaseObjectUrl(String storedName) {
        String normalizedStoredName = normalizeStoredName(storedName);
        if (supabaseObjectBaseUrl == null) {
            throw new StorageException("Supabase object base URL is not initialized", null);
        }
        return supabaseObjectBaseUrl + "/" + encodePathSegment(normalizedStoredName);
    }

    private HttpRequest.Builder supabaseRequestBuilder(String url) {
        if (supabaseServiceRoleKey == null) {
            throw new StorageException("Supabase service role key is not configured", null);
        }

        return HttpRequest.newBuilder(URI.create(url))
                .timeout(STORAGE_REQUEST_TIMEOUT)
                .header("Authorization", "Bearer " + supabaseServiceRoleKey)
                .header("apikey", supabaseServiceRoleKey);
    }

    private HttpResponse<String> sendForText(HttpRequest request, String action) {
        try {
            return httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        } catch (IOException e) {
            throw new StorageException("Supabase request failed during " + action, e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new StorageException("Supabase request interrupted during " + action, e);
        }
    }

    private HttpResponse<byte[]> sendForBytes(HttpRequest request, String action) {
        try {
            return httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
        } catch (IOException e) {
            throw new StorageException("Supabase request failed during " + action, e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new StorageException("Supabase request interrupted during " + action, e);
        }
    }

    private static boolean isSuccessStatus(int statusCode) {
        return statusCode >= 200 && statusCode < 300;
    }

    private static String encodePathSegment(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private static String normalizeBlankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String abbreviateBody(String body) {
        if (body == null || body.isBlank()) {
            return "";
        }
        String compact = body.replaceAll("\\s+", " ").trim();
        if (compact.length() <= 220) {
            return compact;
        }
        return compact.substring(0, 220) + "...";
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
