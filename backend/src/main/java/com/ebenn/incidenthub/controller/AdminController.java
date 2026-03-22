package com.ebenn.incidenthub.controller;

import com.ebenn.incidenthub.model.Role;
import com.ebenn.incidenthub.model.UserEntity;
import com.ebenn.incidenthub.repo.UserRepository;
import com.ebenn.incidenthub.service.AuditService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final AuditService auditService;

    public AdminController(UserRepository userRepository, AuditService auditService) {
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<Page<Map<String, Object>>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<UserEntity> users = userRepository.findAll(
                PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt")));
        Page<Map<String, Object>> sanitized = users.map(this::toSafeMap);
        return ResponseEntity.ok(sanitized);
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<?> changeRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String newRole = body.get("role");
        if (newRole == null || newRole.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Role is required"));
        }

        Role role;
        try {
            role = Role.valueOf(newRole.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role. Valid roles: ADMIN, OPERATOR, VIEWER"));
        }

        UserEntity user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        Role oldRole = user.getRole();
        user.setRole(role);
        userRepository.save(user);

        auditService.log("ROLE_CHANGE", "User", id,
                user.getEmail() + ": " + oldRole.name() + " → " + role.name());

        return ResponseEntity.ok(toSafeMap(user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        UserEntity user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        if (user.getRole() == Role.ADMIN) {
            long adminCount = userRepository.countByRole(Role.ADMIN);
            if (adminCount <= 1) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Cannot delete the last admin user"));
            }
        }

        auditService.log("USER_DELETED", "User", id, user.getEmail());
        userRepository.delete(user);

        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    private Map<String, Object> toSafeMap(UserEntity user) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("fullName", user.getFullName());
        map.put("email", user.getEmail());
        map.put("role", user.getRole().name());
        map.put("createdAt", user.getCreatedAt());
        return map;
    }
}
