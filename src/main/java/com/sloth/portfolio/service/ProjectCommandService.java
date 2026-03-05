package com.sloth.portfolio.service;

import com.sloth.portfolio.domain.Project;
import com.sloth.portfolio.repo.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProjectCommandService {

    private final ProjectRepository projectRepository;
    private final ProjectAssetService projectAssetService;

    public ProjectCommandService(ProjectRepository projectRepository, ProjectAssetService projectAssetService) {
        this.projectRepository = projectRepository;
        this.projectAssetService = projectAssetService;
    }

    public Project create(Project project) {
        if (projectRepository.existsBySlug(project.getSlug())) {
            throw new ConflictException("Slug already exists: " + project.getSlug());
        }

        Project saved = projectRepository.save(project);
        // Prevent LazyInitializationException during DTO mapping in controller.
        saved.getAssets().size();
        return saved;
    }

    public Project update(Long id, Project newValue) {
        Project existing = projectRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Project not found: id=" + id));

        if (!existing.getSlug().equals(newValue.getSlug())
                && projectRepository.existsBySlug(newValue.getSlug())) {
            throw new ConflictException("Slug already exists: " + newValue.getSlug());
        }

        existing.update(
                newValue.getCategory(),
                newValue.getTitle(),
                newValue.getSlug(),
                newValue.getSummary(),
                newValue.getContentMarkdown(),
                newValue.getGithubUrl()
        );

        // Prevent LazyInitializationException during DTO mapping in controller.
        existing.getAssets().size();
        return existing;
    }

    public void delete(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new NotFoundException("Project not found: id=" + id);
        }
        projectAssetService.deleteAllByProjectId(id);
        projectRepository.deleteById(id);
    }

    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String message) {
            super(message);
        }
    }

    public static class ConflictException extends RuntimeException {
        public ConflictException(String message) {
            super(message);
        }
    }
}
