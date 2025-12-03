package com.edufy.user.controller.internal;

import com.edufy.user.domain.model.PaymentMethod;
import com.edufy.user.domain.repository.PaymentMethodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user/internal")
@RequiredArgsConstructor
public class PaymentMethodInternalController {

    private final PaymentMethodRepository paymentMethodRepository;

    public static class OsonPaymentMethodRequest {
        public String username;
        public String provider;      // usually "OSON"
        public String externalToken; // token/id from OSON for this card
        public String cardBrand;     // UZCARD, HUMO, VISA, MASTERCARD
        public String lastDigits;    // last 2-4 digits only
        public Integer expiryMonth;  // 1-12
        public Integer expiryYear;   // e.g. 2027
        public Boolean makeDefault;  // optional, default true if no default yet
    }

    @PostMapping("/payment-methods/oson")
    public ResponseEntity<?> upsertOsonPaymentMethod(@RequestBody OsonPaymentMethodRequest body) {
        if (body == null || body.username == null || body.username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "username required"));
        }
        if (body.externalToken == null || body.externalToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "externalToken required"));
        }
        String username = body.username.trim();
        String provider = (body.provider == null || body.provider.isBlank()) ? "OSON" : body.provider.trim();

        List<PaymentMethod> existingForUser = paymentMethodRepository.findByUsername(username);

        PaymentMethod target = null;
        for (PaymentMethod pm : existingForUser) {
            if (pm.getExternalToken().equals(body.externalToken)) {
                target = pm;
                break;
            }
        }

        boolean hasDefault = false;
        for (PaymentMethod pm : existingForUser) {
            if (pm.isDefault()) {
                hasDefault = true;
                break;
            }
        }

        boolean makeDefault = body.makeDefault != null ? body.makeDefault : !hasDefault;

        if (target == null) {
            target = PaymentMethod.builder()
                    .username(username)
                    .provider(provider)
                    .externalToken(body.externalToken.trim())
                    .cardBrand(body.cardBrand != null ? body.cardBrand.trim() : "")
                    .lastDigits(body.lastDigits != null ? body.lastDigits.trim() : "")
                    .expiryMonth(body.expiryMonth)
                    .expiryYear(body.expiryYear)
                    .isDefault(makeDefault)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
        } else {
            target.setProvider(provider);
            if (body.cardBrand != null) target.setCardBrand(body.cardBrand.trim());
            if (body.lastDigits != null) target.setLastDigits(body.lastDigits.trim());
            if (body.expiryMonth != null) target.setExpiryMonth(body.expiryMonth);
            if (body.expiryYear != null) target.setExpiryYear(body.expiryYear);
            target.setUpdatedAt(LocalDateTime.now());
            target.setDefault(makeDefault);
        }

        if (makeDefault) {
            for (PaymentMethod pm : existingForUser) {
                if (!pm.getId().equals(target.getId()) && pm.isDefault()) {
                    pm.setDefault(false);
                    paymentMethodRepository.save(pm);
                }
            }
        }

        PaymentMethod saved = paymentMethodRepository.save(target);

        return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "username", saved.getUsername(),
                "provider", saved.getProvider(),
                "cardBrand", saved.getCardBrand(),
                "lastDigits", saved.getLastDigits(),
                "expiryMonth", saved.getExpiryMonth(),
                "expiryYear", saved.getExpiryYear(),
                "isDefault", saved.isDefault()
        ));
    }
}
