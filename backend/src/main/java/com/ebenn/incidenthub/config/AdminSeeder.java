package com.ebenn.incidenthub.config;

import com.ebenn.incidenthub.model.Role;
import com.ebenn.incidenthub.model.UserEntity;
import com.ebenn.incidenthub.repo.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;

    public AdminSeeder(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       @Value("${app.bootstrap.admin-email:}") String adminEmail,
                       @Value("${app.bootstrap.admin-password:}") String adminPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(String... args) {
        if (userRepository.countByRole(Role.ADMIN) > 0) {
            return;
        }

        if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            log.info("Bootstrap admin skipped because local admin credentials are not configured.");
            return;
        }

        UserEntity admin = userRepository.findByEmail(adminEmail).orElse(null);
        if (admin != null) {
            admin.setRole(Role.ADMIN);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            userRepository.save(admin);
            log.info("Existing user promoted to ADMIN: {}", adminEmail);
        } else {
            admin = UserEntity.builder()
                    .fullName("System Admin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
            log.info("Bootstrap admin created: {}", adminEmail);
        }
    }
}
