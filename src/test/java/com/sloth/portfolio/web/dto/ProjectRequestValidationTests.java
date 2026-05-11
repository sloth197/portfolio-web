package com.sloth.portfolio.web.dto;

import com.sloth.portfolio.domain.ProjectCategory;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ProjectRequestValidationTests {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void projectCreateRequestAcceptsGithubRepositoryUrls() {
        ProjectCreateRequest request = createRequest("https://github.com/sloth197/crm");

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void projectCreateRequestRejectsUnsafeGithubUrls() {
        ProjectCreateRequest request = createRequest("javascript:alert(1)");

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("githubUrl");
    }

    @Test
    void projectCreateRequestRejectsGithubLookalikeHosts() {
        ProjectCreateRequest request = createRequest("https://github.com.evil.test/sloth197/crm");

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("githubUrl");
    }

    @Test
    void projectCreateRequestRejectsOversizedMarkdown() {
        ProjectCreateRequest request = new ProjectCreateRequest(
                ProjectCategory.SOFTWARE,
                "CRM",
                "CRM project",
                "2026.03-2026.04",
                "x".repeat(20_001),
                "https://github.com/sloth197/crm"
        );

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("contentMarkdown");
    }

    private static ProjectCreateRequest createRequest(String githubUrl) {
        return new ProjectCreateRequest(
                ProjectCategory.SOFTWARE,
                "CRM",
                "CRM project",
                "2026.03-2026.04",
                "## Details",
                githubUrl
        );
    }
}
