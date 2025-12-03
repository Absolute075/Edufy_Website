package com.edufy.auth.repository;

import com.edufy.auth.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);
    Optional<UserEntity> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    List<UserEntity> findTop20ByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(String username, String email);
}
