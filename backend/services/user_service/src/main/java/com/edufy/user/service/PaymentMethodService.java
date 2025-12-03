package com.edufy.user.service;

import com.edufy.user.domain.model.PaymentMethod;
import com.edufy.user.domain.repository.PaymentMethodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentMethodService {

    private final PaymentMethodRepository paymentMethodRepository;

    public List<PaymentMethod> getMethodsForUser(String username) {
        if (username == null || username.isBlank()) {
            return List.of();
        }
        return paymentMethodRepository.findByUsernameOrderByCreatedAtDesc(username);
    }

    public PaymentMethod setDefault(String username, Long id) {
        if (username == null || username.isBlank() || id == null) {
            return null;
        }
        paymentMethodRepository.findByUsernameAndIsDefaultTrue(username).ifPresent(pm -> {
            if (!pm.getId().equals(id)) {
                pm.setDefault(false);
                paymentMethodRepository.save(pm);
            }
        });

        return paymentMethodRepository.findByIdAndUsername(id, username)
                .map(pm -> {
                    pm.setDefault(true);
                    return paymentMethodRepository.save(pm);
                })
                .orElse(null);
    }

    public boolean deleteForUser(String username, Long id) {
        if (username == null || username.isBlank() || id == null) {
            return false;
        }
        return paymentMethodRepository.findByIdAndUsername(id, username)
                .map(pm -> {
                    paymentMethodRepository.delete(pm);
                    return true;
                })
                .orElse(false);
    }
}
