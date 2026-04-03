package com.sloth.portfolio.config;

import com.sloth.portfolio.domain.Project;
import com.sloth.portfolio.domain.ProjectAsset;
import com.sloth.portfolio.repo.ProjectAssetRepository;
import com.sloth.portfolio.repo.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@ConditionalOnProperty(
        prefix = "app.migration.rewrite-legacy-asset-links",
        name = "enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class LegacyProjectAssetLinkMigrationRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LegacyProjectAssetLinkMigrationRunner.class);
    private static final Pattern LEGACY_ASSET_LINK_PATTERN =
            Pattern.compile("/api/public/assets/(\\d+)(?=$|[/?#)\\]}'\"\\s.,;:])");

    private final ProjectRepository projectRepository;
    private final ProjectAssetRepository projectAssetRepository;

    public LegacyProjectAssetLinkMigrationRunner(
            ProjectRepository projectRepository,
            ProjectAssetRepository projectAssetRepository
    ) {
        this.projectRepository = projectRepository;
        this.projectAssetRepository = projectAssetRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Project> projects = projectRepository.findAll();
        if (projects.isEmpty()) {
            return;
        }

        Set<Long> referencedAssetIds = collectReferencedLegacyAssetIds(projects);
        if (referencedAssetIds.isEmpty()) {
            log.info("Legacy project markdown link migration skipped: no legacy asset links found.");
            return;
        }

        Map<Long, String> assetIdToStoredName = loadAssetStoredNameMap(referencedAssetIds);
        MigrationStats stats = rewriteProjects(projects, assetIdToStoredName);

        if (stats.updatedProjects == 0 && stats.missingAssetIds.isEmpty()) {
            log.info("Legacy project markdown link migration finished: no changes needed.");
            return;
        }

        if (stats.updatedProjects > 0) {
            log.info(
                    "Legacy project markdown link migration updated {} project(s), replaced {} link(s).",
                    stats.updatedProjects,
                    stats.replacedLinks
            );
        }

        if (!stats.missingAssetIds.isEmpty()) {
            log.warn(
                    "Legacy project markdown link migration could not resolve asset id(s): {}",
                    stats.missingAssetIds
            );
        }
    }

    private static Set<Long> collectReferencedLegacyAssetIds(List<Project> projects) {
        Set<Long> ids = new HashSet<>();
        for (Project project : projects) {
            Matcher matcher = LEGACY_ASSET_LINK_PATTERN.matcher(project.getContentMarkdown());
            while (matcher.find()) {
                ids.add(Long.parseLong(matcher.group(1)));
            }
        }
        return ids;
    }

    private Map<Long, String> loadAssetStoredNameMap(Set<Long> ids) {
        List<ProjectAsset> assets = new ArrayList<>();
        projectAssetRepository.findAllById(ids).forEach(assets::add);

        Map<Long, String> map = new HashMap<>();
        for (ProjectAsset asset : assets) {
            map.put(asset.getId(), asset.getStoredName());
        }
        return map;
    }

    private MigrationStats rewriteProjects(List<Project> projects, Map<Long, String> assetIdToStoredName) {
        int updatedProjects = 0;
        int replacedLinks = 0;
        Set<Long> missingAssetIds = new TreeSet<>();

        for (Project project : projects) {
            RewriteResult result = rewriteLegacyLinks(project.getContentMarkdown(), assetIdToStoredName);
            replacedLinks += result.replacedLinks();
            missingAssetIds.addAll(result.missingAssetIds());

            if (result.replacedLinks() == 0) {
                continue;
            }

            project.update(
                    project.getCategory(),
                    project.getTitle(),
                    project.getSlug(),
                    project.getSummary(),
                    project.getProjectPeriod(),
                    result.rewrittenMarkdown(),
                    project.getGithubUrl()
            );
            updatedProjects++;
        }

        return new MigrationStats(updatedProjects, replacedLinks, missingAssetIds);
    }

    private RewriteResult rewriteLegacyLinks(String markdown, Map<Long, String> assetIdToStoredName) {
        Matcher matcher = LEGACY_ASSET_LINK_PATTERN.matcher(markdown);
        StringBuffer buffer = new StringBuffer();
        int replacedLinks = 0;
        Set<Long> missingAssetIds = new TreeSet<>();

        while (matcher.find()) {
            Long assetId = Long.parseLong(matcher.group(1));
            String storedName = assetIdToStoredName.get(assetId);

            String replacement;
            if (storedName == null) {
                replacement = matcher.group(0);
                missingAssetIds.add(assetId);
            } else {
                replacement = "/api/public/assets/file/" + storedName;
                replacedLinks++;
            }

            matcher.appendReplacement(buffer, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(buffer);

        return new RewriteResult(buffer.toString(), replacedLinks, missingAssetIds);
    }

    private record RewriteResult(String rewrittenMarkdown, int replacedLinks, Set<Long> missingAssetIds) {
    }

    private record MigrationStats(int updatedProjects, int replacedLinks, Set<Long> missingAssetIds) {
    }
}
