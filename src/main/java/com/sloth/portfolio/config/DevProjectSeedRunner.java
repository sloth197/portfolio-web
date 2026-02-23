package com.sloth.portfolio.config;

import com.sloth.portfolio.domain.Project;
import com.sloth.portfolio.domain.ProjectCategory;
import com.sloth.portfolio.repo.ProjectRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("dev")
public class DevProjectSeedRunner {

    @Bean
    CommandLineRunner seedProjects(ProjectRepository projectRepository) {
        return args -> {
            seedIfMissing(
                    projectRepository,
                    new Project(
                            ProjectCategory.FIRMWARE,
                            "Low Latency Firmware",
                            "low-latency-firmware",
                            "Real-time firmware optimization for deterministic communication.",
                            """
                            ## Overview

                            Firmware project focused on reducing end-to-end latency.

                            - Optimized ISR and DMA path
                            - Reduced jitter under sustained load
                            - Added reproducible benchmark scripts
                            """,
                            "https://github.com/sloth197/low-latency-firmware"
                    )
            );

            seedIfMissing(
                    projectRepository,
                    new Project(
                            ProjectCategory.SOFTWARE,
                            "Portfolio Web",
                            "portfolio-web",
                            "Full-stack portfolio web application using Spring Boot and Next.js.",
                            """
                            ## Overview

                            Web portfolio project with backend API and frontend UI.

                            - Public projects API
                            - Admin-ready security baseline
                            - Markdown-based project detail content
                            """,
                            "https://github.com/sloth197/portfolio-web"
                    )
            );
        };
    }

    private void seedIfMissing(ProjectRepository projectRepository, Project project) {
        if (!projectRepository.existsBySlug(project.getSlug())) {
            projectRepository.save(project);
        }
    }
}
