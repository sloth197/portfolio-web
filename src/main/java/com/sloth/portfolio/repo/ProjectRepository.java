package com.sloth.portfolio.repo;

import com.sloth.portfolio.domain.Project;
import com.sloth.portfolio.domain.ProjectCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    Optional<Project> findBySlug(String slug);

    boolean existsBySlug(String slug);

    List<Project> findByCategoryOrderByCreatedAtDesc(ProjectCategory category);

    List<Project> findAllByOrderByCreatedAtDesc();
}