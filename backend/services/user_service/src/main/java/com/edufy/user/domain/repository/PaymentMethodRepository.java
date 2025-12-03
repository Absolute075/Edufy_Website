package com.edufy.user.domain.repository;

import com.edufy.user.domain.model.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {

    List<PaymentMethod> findByUsernameOrderByCreatedAtDesc(String username);

    Optional<PaymentMethod> findByIdAndUsername(Long id, String username);

    List<PaymentMethod> findByUsername(String username);

    Optional<PaymentMethod> findByUsernameAndIsDefaultTrue(String username);
}
