package com.edufy.user.controller.internal;

import com.edufy.user.domain.model.Payment;
import com.edufy.user.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/user/internal")
@RequiredArgsConstructor
public class PaymentInternalController {

    private final PaymentService paymentService;

    public static class OsonInitRequest {
        public String username;
        public String plan;
        public String period;
        public boolean autoRenewal;
        public String transactionId;
        public Long billId;
        public double amount;
        public String currency;
        public String email;
        public String phone;
    }

    @PostMapping("/payments/oson-init")
    public ResponseEntity<?> osonInit(@RequestBody OsonInitRequest body) {
        if (body == null || body.transactionId == null || body.transactionId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "transactionId required"));
        }
        Payment p = paymentService.recordOsonInit(
                body.username,
                body.plan,
                body.period,
                body.autoRenewal,
                body.transactionId,
                body.billId,
                body.amount,
                body.currency,
                body.email,
                body.phone
        );
        if (p == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "could not record payment"));
        }
        return ResponseEntity.ok(Map.of(
                "id", p.getId(),
                "transactionId", p.getTransactionId(),
                "status", p.getStatus()
        ));
    }

    public static class OsonNotifyRequest {
        public String transactionId;
        public Long billId;
        public String status;
        public String failureReason;
    }

    @PostMapping("/payments/oson-notify")
    public ResponseEntity<?> osonNotify(@RequestBody OsonNotifyRequest body) {
        if ((body.transactionId == null || body.transactionId.isBlank()) && body.billId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "transactionId or billId required"));
        }
        Payment p = paymentService.handleOsonStatus(
                body.transactionId,
                body.billId,
                body.status,
                body.failureReason
        );
        if (p == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "payment not found"));
        }
        return ResponseEntity.ok(Map.of(
                "id", p.getId(),
                "transactionId", p.getTransactionId(),
                "status", p.getStatus()
        ));
    }
}
