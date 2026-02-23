package com.sloth.portfolio.repo;

import com.sloth.portfolio.domain.AuthAttemptLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthAttemptLogRepository extends JpaRepository<AuthAttemptLog, Long> {

}
