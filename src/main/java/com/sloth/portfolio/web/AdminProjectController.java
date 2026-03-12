package com.sloth.portfolio.web;

import com.sloth.portfolio.domain.Project;
import com.sloth.portfolio.domain.ProjectAsset;
import com.sloth.portfolio.service.ProjectAssetService;
import com.sloth.portfolio.service.ProjectCommandService;
import com.sloth.portfolio.web.dto.ProjectAssetDto;
import com.sloth.portfolio.web.dto.ProjectCreateRequest;
import com.sloth.portfolio.web.dto.ProjectDto;
import com.sloth.portfolio.web.dto.ProjectUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/projects")
public class AdminProjectController {

    private final ProjectCommandService projectCommandService;
    private final ProjectAssetService projectAssetService;

    public AdminProjectController(ProjectCommandService projectCommandService, ProjectAssetService projectAssetService) {
        this.projectCommandService = projectCommandService;
        this.projectAssetService = projectAssetService;
    }

    @GetMapping("/ping")
    public PingResponse ping(Authentication authentication) {
        boolean canManageProjects = authentication != null
                && authentication.getAuthorities().stream().anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        String role = canManageProjects ? "ADMIN" : "CRM";
        return new PingResponse(true, role, canManageProjects);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectDto create(@Valid @RequestBody ProjectCreateRequest request) {
        Project created = projectCommandService.create(new Project(
                request.category(),
                request.title(),
                request.slug(),
                request.summary(),
                request.contentMarkdown(),
                request.githubUrl()
        ));
        return ProjectDto.from(created);
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void update(@PathVariable Long id, @Valid @RequestBody ProjectUpdateRequest request) {
        projectCommandService.update(id, new Project(
                request.category(),
                request.title(),
                request.slug(),
                request.summary(),
                request.contentMarkdown(),
                request.githubUrl()
        ));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        projectCommandService.delete(id);
    }

    @PostMapping(value = "/{id}/assets", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectAssetDto uploadAsset(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
        ProjectAsset created = projectAssetService.upload(id, file);
        return ProjectAssetDto.from(created);
    }

    @DeleteMapping("/{projectId}/assets/{assetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAsset(@PathVariable Long projectId, @PathVariable Long assetId) {
        projectAssetService.deleteAsset(projectId, assetId);
    }

    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ExceptionHandler(ProjectCommandService.NotFoundException.class)
    public ErrorResponse handleNotFound(ProjectCommandService.NotFoundException e) {
        return new ErrorResponse("NOT_FOUND", e.getMessage());
    }

    @ResponseStatus(HttpStatus.CONFLICT)
    @ExceptionHandler(ProjectCommandService.ConflictException.class)
    public ErrorResponse handleConflict(ProjectCommandService.ConflictException e) {
        return new ErrorResponse("CONFLICT", e.getMessage());
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(IllegalArgumentException.class)
    public ErrorResponse handleInvalidInput(IllegalArgumentException e) {
        return new ErrorResponse("BAD_REQUEST", e.getMessage());
    }

    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ExceptionHandler(ProjectAssetService.NotFoundException.class)
    public ErrorResponse handleAssetNotFound(ProjectAssetService.NotFoundException e) {
        return new ErrorResponse("NOT_FOUND", e.getMessage());
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(ProjectAssetService.InvalidFileException.class)
    public ErrorResponse handleInvalidFile(ProjectAssetService.InvalidFileException e) {
        return new ErrorResponse("BAD_REQUEST", e.getMessage());
    }

    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ExceptionHandler(ProjectAssetService.StorageException.class)
    public ErrorResponse handleStorageError(ProjectAssetService.StorageException e) {
        return new ErrorResponse("STORAGE_ERROR", e.getMessage());
    }

    public record ErrorResponse(String code, String message) {
    }

    public record PingResponse(boolean ok, String role, boolean canManageProjects) {
    }
}
