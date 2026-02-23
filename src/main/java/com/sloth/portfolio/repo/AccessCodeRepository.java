package com.sloth.portfolio.repo;

import com.sloth.portfolio.domain.AccessCode;
import com.sloth.portfolio.domain.DeliveryChannel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface AccessCodeRepository extends JpaRepository<AccessCode, Long> {

    Optional<AccessCode> findTopByPhoneNumberAndChannelAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String phoneNumber,
            DeliveryChannel channel,
            Instant now
    );

    long countByPhoneNumberAndCreatedAtAfter(String phoneNumber, Instant createdAt);

    List<AccessCode> findTop20ByOrderByCreatedAtDesc();
}
