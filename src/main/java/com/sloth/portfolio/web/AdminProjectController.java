package com.sloth.portfolio.web;

import com.sloth.portfolio.domain.Project;
import com.sloth.portfolio.service.ProjectCommandService;
import com.sloth.portfolio.web.dto.ProjectCreateRequest;
import com.sloth.portfolio.web.dto.ProjectDto;
import com.sloth.portfolio.web.dto.ProjectUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/projects")
public class AdminProjectController {

    private final ProjectCommandService projectCommandService;

    public AdminProjectController(ProjectCommandService projectCommandService) {
        this.projectCommandService = projectCommandService;
    }

    @GetMapping("/ping")
    public PingResponse ping() {
        return new PingResponse(true);
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
    public ProjectDto update(@PathVariable Long id, @Valid @RequestBody ProjectUpdateRequest request) {
        Project updated = projectCommandService.update(id, new Project(
                request.category(),
                request.title(),
                request.slug(),
                request.summary(),
                request.contentMarkdown(),
                request.githubUrl()
        ));
        return ProjectDto.from(updated);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        projectCommandService.delete(id);
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

    public record ErrorResponse(String code, String message) {
    }

    public record PingResponse(boolean ok) {
    }
}
