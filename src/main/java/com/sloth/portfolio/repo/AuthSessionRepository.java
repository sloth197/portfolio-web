package com.sloth.portfolio.repo;

import com.sloth.portfolio.domain.AuthSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> {

    Optional<AuthSession> findTopByTokenHashAndRevokedAtIsNullAndExpiresAtAfter(String tokenHash, Instant now);

    Optional<AuthSession> findTopByTokenHashAndRevokedAtIsNull(String tokenHash);
}
