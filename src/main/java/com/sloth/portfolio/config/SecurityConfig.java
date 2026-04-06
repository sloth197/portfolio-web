package com.sloth.portfolio.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.SecurityFilterChain;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, AdminOriginValidationFilter adminOriginValidationFilter) throws Exception {
        return http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/", "/index.html", "/favicon.ico", "/css/**", "/js/**", "/images/**").permitAll()
                        .requestMatchers("/api/admin/auth/login", "/api/admin/auth/session", "/api/admin/auth/logout").permitAll()
                        .requestMatchers("/api/admin/projects/ping").hasAnyRole("ADMIN", "CRM")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().permitAll()
                )
                .addFilterBefore(adminOriginValidationFilter, AuthorizationFilter.class)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .build();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    UserDetailsService userDetailsService(
            @Value("${app.admin.username:}") String username,
            @Value("${app.admin.password:}") String password,
            @Value("${app.crm.username:}") String crmUsername,
            @Value("${app.crm.password:}") String crmPassword,
            @Value("${app.admin.password-min-length:8}") int passwordMinLength
    ) {
        int normalizedPasswordMinLength = Math.max(1, passwordMinLength);
        validateConfiguredCredential("ADMIN", username, password, normalizedPasswordMinLength);
        UserDetails admin = User.builder()
                .username(username.trim())
                .password(passwordEncoder().encode(password))
                .roles("ADMIN")
                .build();

        List<UserDetails> users = new ArrayList<>();
        users.add(admin);

        boolean crmConfigured = crmUsername != null && !crmUsername.isBlank()
                && crmPassword != null && !crmPassword.isBlank();
        if (crmConfigured) {
            if (crmUsername.equals(username)) {
                throw new IllegalStateException("APP_CRM_USERNAME must be different from APP_ADMIN_USERNAME");
            }
            validateConfiguredCredential("CRM", crmUsername, crmPassword, normalizedPasswordMinLength);

            UserDetails crm = User.builder()
                    .username(crmUsername.trim())
                    .password(passwordEncoder().encode(crmPassword))
                    .roles("CRM")
                    .build();
            users.add(crm);
        }

        return new InMemoryUserDetailsManager(users);
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private static void validateConfiguredCredential(String accountType, String username, String password, int minPasswordLength) {
        String normalizedUsername = username == null ? "" : username.trim();
        String normalizedPassword = password == null ? "" : password.trim();
        if (normalizedUsername.isBlank() || normalizedPassword.isBlank()) {
            throw new IllegalStateException(accountType + " credentials must be configured via environment variables.");
        }
        if (normalizedPassword.length() < minPasswordLength) {
            log.warn("{} password length ({}) is below configured minimum ({}). Continuing for backward compatibility.",
                    accountType, normalizedPassword.length(), minPasswordLength);
        }
        String usernameLower = normalizedUsername.toLowerCase(Locale.ROOT);
        String passwordLower = normalizedPassword.toLowerCase(Locale.ROOT);
        if ("admin".equals(usernameLower) && "change-me-before-prod".equals(passwordLower)) {
            throw new IllegalStateException("Weak default admin credentials are not allowed.");
        }
    }
}
