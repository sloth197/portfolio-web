package com.sloth.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "app.auth.enabled=true",
        "app.auth.public-gate-enabled=false"
})
class PublicApiGateConfigTests {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void healthEndpointIsAccessibleWhenPublicGateDisabled() {
        ResponseEntity<String> response = restTemplate.getForEntity("/api/public/health", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo("OK");
    }

    @Test
    void projectsEndpointIsNotBlockedByAuthWhenPublicGateDisabled() {
        ResponseEntity<String> response = restTemplate.getForEntity("/api/public/projects", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
