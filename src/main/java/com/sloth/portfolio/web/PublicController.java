package com.sloth.portfolio.web;

import com.sloth.portfolio.domain.ProjectCategory;
import com.sloth.portfolio.service.ProjectQueryService;
import com.sloth.portfolio.web.dto.ProjectDto;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final ProjectQueryService projectQueryService;

    public PublicController(ProjectQueryService projectQueryService) {
        this.projectQueryService = projectQueryService;
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

    /**
     * 404 예외 매핑
     */
    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ExceptionHandler(ProjectQueryService.NotFoundException.class)
    public ErrorResponse handleNotFound(ProjectQueryService.NotFoundException e) {
        return new ErrorResponse("NOT_FOUND", e.getMessage());
    }

    public record ErrorResponse(String code, String message) {}
}