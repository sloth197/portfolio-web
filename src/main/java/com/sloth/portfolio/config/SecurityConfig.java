package com.sloth.portfolio.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/", "/index.html", "/favicon.ico", "/css/**", "/js/**", "/images/**").permitAll()
                        .requestMatchers("/api/admin/projects/ping").hasAnyRole("ADMIN", "CRM")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().permitAll()
                )
                .formLogin(Customizer.withDefaults())
                .httpBasic(Customizer.withDefaults())
                .logout(Customizer.withDefaults())
                .build();
    }

    @Bean
    UserDetailsService userDetailsService(
            @Value("${app.admin.username}") String username,
            @Value("${app.admin.password}") String password,
            @Value("${app.crm.username:}") String crmUsername,
            @Value("${app.crm.password:}") String crmPassword
    ) {
        UserDetails admin = User.builder()
                .username(username)
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

            UserDetails crm = User.builder()
                    .username(crmUsername)
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
}
