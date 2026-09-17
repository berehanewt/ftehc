package com.ftehc.ftehc.config;

import com.ftehc.ftehc.users.Role;
import com.ftehc.ftehc.users.User;
import com.ftehc.ftehc.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
public class AdminSeedConfig {

    @Value("${APP_ADMIN_EMAIL:}")
    private String adminEmail;

    @Value("${APP_ADMIN_PASSWORD:}")
    private String adminPassword;

    @Bean
    CommandLineRunner seedAdminUser(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Skip seeding when credentials are not provided by environment.
            if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
                return;
            }

            if (!userRepository.existsByEmail(adminEmail)) {
                User admin = User.builder()
                        .email(adminEmail)
                        .passwordHash(passwordEncoder.encode(adminPassword))
                        .roles(Set.of(Role.ADMIN))
                        .active(true)
                        .createdAt(Instant.now())
                        .build();

                userRepository.save(admin);
            }
        };
    }
}