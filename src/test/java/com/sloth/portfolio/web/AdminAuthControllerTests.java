package com.sloth.portfolio.web;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class AdminAuthControllerTests {

    @Test
    void resolveClientAddressIgnoresForwardedHeaders() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.10");
        request.addHeader("X-Forwarded-For", "198.51.100.1");
        request.addHeader("X-Real-IP", "198.51.100.2");

        assertThat(AdminAuthController.resolveClientAddress(request)).isEqualTo("203.0.113.10");
    }

    @Test
    void resolveClientAddressFallsBackToUnknownWhenRemoteAddressIsMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(null);

        assertThat(AdminAuthController.resolveClientAddress(request)).isEqualTo("unknown");
    }
}
