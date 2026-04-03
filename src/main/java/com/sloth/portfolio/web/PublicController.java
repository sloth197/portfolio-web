package com.sloth.portfolio.web;

import com.sloth.portfolio.domain.ProjectCategory;
import com.sloth.portfolio.service.ProjectAssetService;
import com.sloth.portfolio.service.ProjectQueryService;
import com.sloth.portfolio.web.dto.ProjectDto;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;
import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final ProjectQueryService projectQueryService;
    private final ProjectAssetService projectAssetService;

    public PublicController(ProjectQueryService projectQueryService, ProjectAssetService projectAssetService) {
        this.projectQueryService = projectQueryService;
        this.projectAssetService = projectAssetService;
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }

    /**
     * 전체 프로젝트 조회
     * - /api/public/projects
     * - /api/public/projects?category=FIRMWARE
     * - /api/public/projects?category=SOFTWARE
     */
    @GetMapping("/projects")
    public List<ProjectDto> listProjects(@RequestParam(required = false) ProjectCategory category) {
        return projectQueryService.listAll(category).stream()
                .map(ProjectDto::from)
                .toList();
    }

    /**
     * slug로 프로젝트 상세 조회
     * - /api/public/projects/{slug}
     */
    @GetMapping("/projects/{slug}")
    public ProjectDto getProject(@PathVariable String slug) {
        return ProjectDto.from(projectQueryService.getBySlug(slug));
    }

    @GetMapping("/assets/{assetId}")
    public ResponseEntity<Resource> getAsset(@PathVariable Long assetId) {
        ProjectAssetService.AssetFile assetFile = projectAssetService.loadAsset(assetId);
        String contentType = resolveAssetContentType(assetFile.contentType(), assetFile.originalName());
        return buildAssetResponse(assetFile, contentType);
    }

    @GetMapping("/assets/file/{storedName:.+}")
    public ResponseEntity<Resource> getAssetByStoredName(@PathVariable String storedName) {
        ProjectAssetService.AssetFile assetFile = projectAssetService.loadAssetByStoredName(storedName);
        String contentType = resolveAssetContentType(assetFile.contentType(), assetFile.originalName());
        return buildAssetResponse(assetFile, contentType);
    }

    private static ResponseEntity<Resource> buildAssetResponse(ProjectAssetService.AssetFile assetFile, String contentType) {
        MediaType mediaType;
        try {
            mediaType = (contentType == null || contentType.isBlank())
                    ? MediaType.APPLICATION_OCTET_STREAM
                    : MediaType.parseMediaType(contentType);
        } catch (Exception ignored) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType);
        try {
            headers.setContentLength(assetFile.resource().contentLength());
        } catch (Exception ignored) {
            // Content-Length may be unavailable for some resources.
        }
        String filename = (assetFile.originalName() == null ? "asset" : assetFile.originalName()).replace("\"", "");
        String dispositionValue = (assetFile.inline() ? "inline" : "attachment") + "; filename=\"" + filename + "\"";
        headers.set(HttpHeaders.CONTENT_DISPOSITION, dispositionValue);

        return new ResponseEntity<>(assetFile.resource(), headers, HttpStatus.OK);
    }

    /**
     * 404 예외 매핑
     */
    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ExceptionHandler(ProjectQueryService.NotFoundException.class)
    public ErrorResponse handleNotFound(ProjectQueryService.NotFoundException e) {
        return new ErrorResponse("NOT_FOUND", e.getMessage());
    }

    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ExceptionHandler(ProjectAssetService.NotFoundException.class)
    public ErrorResponse handleAssetNotFound(ProjectAssetService.NotFoundException e) {
        return new ErrorResponse("NOT_FOUND", e.getMessage());
    }

    public record ErrorResponse(String code, String message) {}

    private static String resolveAssetContentType(String contentType, String originalName) {
        if (contentType != null && !contentType.isBlank()) {
            return contentType.trim();
        }
        String normalizedName = originalName == null ? "" : originalName.toLowerCase(Locale.ROOT);
        int dot = normalizedName.lastIndexOf('.');
        if (dot < 0 || dot == normalizedName.length() - 1) {
            return null;
        }
        return switch (normalizedName.substring(dot)) {
            case ".gif" -> "image/gif";
            case ".png" -> "image/png";
            case ".jpg", ".jpeg" -> "image/jpeg";
            case ".webp" -> "image/webp";
            case ".avif" -> "image/avif";
            case ".svg" -> "image/svg+xml";
            default -> null;
        };
    }
}
