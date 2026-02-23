package com.sloth.portfolio.service;

import com.sloth.portfolio.domain.Project;
import com.sloth.portfolio.domain.ProjectCategory;
import com.sloth.portfolio.repo.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ProjectQueryService {

    private final ProjectRepository projectRepository;

    public ProjectQueryService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public List<Project> listAll(ProjectCategory category) {
        if (category == null) {
            return projectRepository.findAllByOrderByCreatedAtDesc();
        }
        return projectRepository.findByCategoryOrderByCreatedAtDesc(category);
    }

    public Project getBySlug(String slug) {
        return projectRepository.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Project not found: slug=" + slug));
    }

    // --- 내부 전용 예외 (404로 매핑할 예정) ---
    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String message) { super(message); }
    }
}