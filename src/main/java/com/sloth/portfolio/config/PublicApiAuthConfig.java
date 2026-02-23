package com.sloth.portfolio.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class PublicApiAuthConfig implements WebMvcConfigurer {

    private final PublicApiAuthInterceptor publicApiAuthInterceptor;

    public PublicApiAuthConfig(PublicApiAuthInterceptor publicApiAuthInterceptor) {
        this.publicApiAuthInterceptor = publicApiAuthInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(publicApiAuthInterceptor)
                .addPathPatterns("/api/public/**");
    }
}
