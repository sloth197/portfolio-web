package com.sloth.portfolio.service;

import com.sloth.portfolio.domain.Project;
import com.sloth.portfolio.repo.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProjectCommandService {

    private final ProjectRepository projectRepository;

    public ProjectCommandService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public Project create(Project project) {
        if (projectRepository.existsBySlug(project.getSlug())) {
            throw new ConflictException("Slug already exists: " + project.getSlug());
        }
        return projectRepository.save(project);
    }

    public Project update(Long id, Project newValue) {
        Project existing = projectRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Project not found: id=" + id));

        // slug가 바뀌는 경우만 중복 체크
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
        return existing; // 영속 상태라 flush 시 반영됨
    }

    public void delete(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new NotFoundException("Project not found: id=" + id);
        }
        projectRepository.deleteById(id);
    }

    // --- 예외들 ---
    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String message) { super(message); }
    }

    public static class ConflictException extends RuntimeException {
        public ConflictException(String message) { super(message); }
    }
}