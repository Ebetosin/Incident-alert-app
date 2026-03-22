package com.ebenn.incidenthub.repo;

import com.ebenn.incidenthub.model.Role;
import com.ebenn.incidenthub.model.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRole(Role role);
}
