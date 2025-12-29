package com.edufy.user.domain.repository;

import com.edufy.user.domain.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Optional<Subscription> findByUsername(String username);

    List<Subscription> findTop200ByPlanIgnoreCaseAndActiveUntilAfterOrderByActiveUntilDesc(String plan, LocalDateTime activeUntil);
}
