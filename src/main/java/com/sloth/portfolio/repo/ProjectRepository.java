package com.sloth.portfolio.repo;

import com.sloth.portfolio.domain.Project;
import com.sloth.portfolio.domain.ProjectCategory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    @EntityGraph(attributePaths = "assets")
    Optional<Project> findBySlug(String slug);

    boolean existsBySlug(String slug);

    @EntityGraph(attributePaths = "assets")
    List<Project> findByCategoryOrderByCreatedAtDesc(ProjectCategory category);

    @EntityGraph(attributePaths = "assets")
    List<Project> findAllByOrderByCreatedAtDesc();
}
