package com.sloth.portfolio.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class PublicApiAuthConfig implements WebMvcConfigurer {

    private final PublicApiAuthInterceptor publicApiAuthInterceptor;
    private final boolean publicGateEnabled;

    public PublicApiAuthConfig(
            PublicApiAuthInterceptor publicApiAuthInterceptor,
            @Value("${app.auth.public-gate-enabled:false}") boolean publicGateEnabled
    ) {
        this.publicApiAuthInterceptor = publicApiAuthInterceptor;
        this.publicGateEnabled = publicGateEnabled;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        if (!publicGateEnabled) {
            return;
        }
        registry.addInterceptor(publicApiAuthInterceptor)
                .addPathPatterns("/api/public/**");
    }
}
