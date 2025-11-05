package com.edufy.user.domain.repository;

import com.edufy.user.domain.model.LoginAudit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginAuditRepository extends JpaRepository<LoginAudit, Long> {
}
