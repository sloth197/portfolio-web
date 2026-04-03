package com.sloth.portfolio.repo;

import com.sloth.portfolio.domain.ProjectAsset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectAssetRepository extends JpaRepository<ProjectAsset, Long> {

    List<ProjectAsset> findByProjectIdOrderByCreatedAtAsc(Long projectId);

    Optional<ProjectAsset> findByIdAndProjectId(Long id, Long projectId);

    Optional<ProjectAsset> findByStoredName(String storedName);
}
