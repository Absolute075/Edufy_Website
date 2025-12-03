package com.edufy.user.domain.repository;

import com.edufy.user.domain.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByUsernameOrderByCreatedAtDesc(String username);

    Optional<Payment> findByTransactionId(String transactionId);

    Optional<Payment> findByBillId(Long billId);
}
