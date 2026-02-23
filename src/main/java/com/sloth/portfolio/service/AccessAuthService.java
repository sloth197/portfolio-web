package com.sloth.portfolio.service;

import com.sloth.portfolio.domain.AccessCode;
import com.sloth.portfolio.domain.AuthAttemptLog;
import com.sloth.portfolio.domain.AuthSession;
import com.sloth.portfolio.domain.DeliveryChannel;
import com.sloth.portfolio.repo.AccessCodeRepository;
import com.sloth.portfolio.repo.AuthAttemptLogRepository;
import com.sloth.portfolio.repo.AuthSessionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

@Service
@Transactional
public class AccessAuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AccessCodeRepository accessCodeRepository;
    private final AuthSessionRepository authSessionRepository;
    private final AuthAttemptLogRepository authAttemptLogRepository;
    private final OtpMessageSender otpMessageSender;
    private final PasswordEncoder passwordEncoder;
    private final int sessionHours;
    private final int defaultCodeTtlMinutes;
    private final int defaultCodeMaxAttempts;
    private final int maxRequestsPerHour;

    public AccessAuthService(
            AccessCodeRepository accessCodeRepository,
            AuthSessionRepository authSessionRepository,
            AuthAttemptLogRepository authAttemptLogRepository,
            OtpMessageSender otpMessageSender,
            PasswordEncoder passwordEncoder,
            @Value("${app.auth.session-hours:12}") int sessionHours,
            @Value("${app.auth.code-ttl-minutes:5}") int defaultCodeTtlMinutes,
            @Value("${app.auth.code-max-attempts:5}") int defaultCodeMaxAttempts,
            @Value("${app.auth.max-requests-per-hour:10}") int maxRequestsPerHour
    ) {
        this.accessCodeRepository = accessCodeRepository;
        this.authSessionRepository = authSessionRepository;
        this.authAttemptLogRepository = authAttemptLogRepository;
        this.otpMessageSender = otpMessageSender;
        this.passwordEncoder = passwordEncoder;
        this.sessionHours = sessionHours;
        this.defaultCodeTtlMinutes = defaultCodeTtlMinutes;
        this.defaultCodeMaxAttempts = defaultCodeMaxAttempts;
        this.maxRequestsPerHour = maxRequestsPerHour;
    }

    public RequestCodeResult requestCode(String phoneNumber, DeliveryChannel channel, String ipAddress, String userAgent) {
        String normalizedPhone = normalizePhone(phoneNumber);
        DeliveryChannel normalizedChannel = requireChannel(channel);
        Instant now = Instant.now();

        long requestsInWindow = accessCodeRepository.countByPhoneNumberAndCreatedAtAfter(normalizedPhone, now.minusSeconds(3600));
        if (requestsInWindow >= maxRequestsPerHour) {
            logAttempt(null, normalizedPhone, normalizedChannel, false, "RATE_LIMITED", ipAddress, userAgent, now);
            throw new TooManyRequestsException("Too many code requests. Try again later.");
        }

        CreatedCode createdCode = createCode(
                normalizedPhone,
                normalizedChannel,
                clamp(defaultCodeTtlMinutes, 1, 60 * 24),
                clamp(defaultCodeMaxAttempts, 1, 20),
                now
        );

        otpMessageSender.send(normalizedPhone, createdCode.code(), normalizedChannel);
        logAttempt(
                createdCode.accessCode(),
                normalizedPhone,
                normalizedChannel,
                true,
                "CODE_SENT",
                ipAddress,
                userAgent,
                now
        );

        AccessCode accessCode = createdCode.accessCode();
        return new RequestCodeResult(maskPhoneNumber(normalizedPhone), normalizedChannel, accessCode.getExpiresAt(), accessCode.getMaxAttempts());
    }

    public IssueCodeResult issueCodeForAdmin(
            String phoneNumber,
            DeliveryChannel channel,
            Integer ttlMinutes,
            Integer maxAttempts,
            boolean send
    ) {
        String normalizedPhone = normalizePhone(phoneNumber);
        DeliveryChannel normalizedChannel = requireChannel(channel);
        int normalizedTtlMinutes = clamp(ttlMinutes == null ? defaultCodeTtlMinutes : ttlMinutes, 1, 60 * 24 * 14);
        int normalizedMaxAttempts = clamp(maxAttempts == null ? defaultCodeMaxAttempts : maxAttempts, 1, 20);

        CreatedCode createdCode = createCode(
                normalizedPhone,
                normalizedChannel,
                normalizedTtlMinutes,
                normalizedMaxAttempts,
                Instant.now()
        );
        if (send) {
            otpMessageSender.send(normalizedPhone, createdCode.code(), normalizedChannel);
        }

        AccessCode accessCode = createdCode.accessCode();
        return new IssueCodeResult(
                accessCode.getId(),
                accessCode.getPhoneNumber(),
                accessCode.getChannel(),
                createdCode.code(),
                accessCode.getExpiresAt(),
                accessCode.getMaxAttempts(),
                accessCode.getCreatedAt()
        );
    }

    public VerifyResult verifyCode(
            String phoneNumber,
            DeliveryChannel channel,
            String plainCode,
            String ipAddress,
            String userAgent
    ) {
        String normalizedPhone = normalizePhone(phoneNumber);
        DeliveryChannel normalizedChannel = requireChannel(channel);
        String candidate = normalizeCode(plainCode);
        Instant now = Instant.now();

        AccessCode accessCode = accessCodeRepository
                .findTopByPhoneNumberAndChannelAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(normalizedPhone, normalizedChannel, now)
                .orElseThrow(() -> {
                    logAttempt(null, normalizedPhone, normalizedChannel, false, "NO_ACTIVE_CODE", ipAddress, userAgent, now);
                    return new UnauthorizedException("No active access code");
                });

        if (!accessCode.isAvailable(now)) {
            logAttempt(accessCode, normalizedPhone, normalizedChannel, false, "CODE_NOT_AVAILABLE", ipAddress, userAgent, now);
            throw new UnauthorizedException("Code is expired or locked");
        }

        if (!passwordEncoder.matches(candidate, accessCode.getCodeHash())) {
            accessCode.registerFailure(now);
            logAttempt(accessCode, normalizedPhone, normalizedChannel, false, "INVALID_CODE", ipAddress, userAgent, now);
            throw new UnauthorizedException("Invalid code");
        }

        accessCode.markUsed(now);
        String sessionToken = generateSessionToken();
        Instant expiresAt = now.plusSeconds(sessionHours * 3600L);
        AuthSession authSession = new AuthSession(
                accessCode,
                sha256Hex(sessionToken),
                normalizeLimit(ipAddress, 64),
                normalizeLimit(userAgent, 400),
                expiresAt,
                now
        );
        authSessionRepository.save(authSession);
        logAttempt(accessCode, normalizedPhone, normalizedChannel, true, "SUCCESS", ipAddress, userAgent, now);
        return new VerifyResult(sessionToken, expiresAt);
    }

    @Transactional(readOnly = true)
    public SessionStatus getSessionStatus(String token) {
        if (token == null || token.isBlank()) {
            return new SessionStatus(false, null);
        }
        String tokenHash = sha256Hex(token);
        return authSessionRepository
                .findTopByTokenHashAndRevokedAtIsNullAndExpiresAtAfter(tokenHash, Instant.now())
                .map(session -> new SessionStatus(true, session.getExpiresAt()))
                .orElseGet(() -> new SessionStatus(false, null));
    }

    @Transactional(readOnly = true)
    public boolean isSessionValid(String token) {
        return getSessionStatus(token).authenticated();
    }

    public void revokeSession(String token) {
        if (token == null || token.isBlank()) {
            return;
        }
        String tokenHash = sha256Hex(token);
        authSessionRepository.findTopByTokenHashAndRevokedAtIsNull(tokenHash)
                .ifPresent(session -> session.revoke(Instant.now()));
    }

    @Transactional(readOnly = true)
    public List<AccessCodeSummary> listRecentCodes() {
        return accessCodeRepository.findTop20ByOrderByCreatedAtDesc()
                .stream()
                .map(code -> new AccessCodeSummary(
                        code.getId(),
                        code.getPhoneNumber(),
                        code.getChannel(),
                        code.isUsed(),
                        code.getAttemptCount(),
                        code.getMaxAttempts(),
                        code.getCreatedAt(),
                        code.getExpiresAt(),
                        code.getUsedAt()
                ))
                .toList();
    }

    private CreatedCode createCode(
            String phoneNumber,
            DeliveryChannel channel,
            int ttlMinutes,
            int maxAttempts,
            Instant now
    ) {
        String plainCode = generateNumericCode(6);
        AccessCode accessCode = new AccessCode(
                passwordEncoder.encode(plainCode),
                phoneNumber,
                channel,
                now.plusSeconds(ttlMinutes * 60L),
                maxAttempts,
                now
        );
        AccessCode saved = accessCodeRepository.save(accessCode);
        return new CreatedCode(saved, plainCode);
    }

    private void logAttempt(
            AccessCode accessCode,
            String phoneNumber,
            DeliveryChannel channel,
            boolean success,
            String reason,
            String ipAddress,
            String userAgent,
            Instant now
    ) {
        authAttemptLogRepository.save(
                new AuthAttemptLog(
                        accessCode,
                        phoneNumber,
                        channel,
                        success,
                        reason,
                        normalizeLimit(ipAddress, 64),
                        normalizeLimit(userAgent, 400),
                        now
                )
        );
    }

    private static String generateNumericCode(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(SECURE_RANDOM.nextInt(10));
        }
        return sb.toString();
    }

    private static String generateSessionToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private static String sha256Hex(String raw) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] digest = messageDigest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    private static String normalizeCode(String code) {
        if (code == null || code.isBlank()) {
            throw new UnauthorizedException("Code must not be blank");
        }
        return code.trim();
    }

    private static String normalizePhone(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new InvalidRequestException("phoneNumber must not be blank");
        }

        String raw = phoneNumber.trim();
        if (raw.startsWith("+")) {
            String digits = digitsOnly(raw.substring(1));
            validatePhoneDigits(digits);
            return "+" + digits;
        }

        String digits = digitsOnly(raw);
        if (digits.startsWith("00")) {
            String withoutPrefix = digits.substring(2);
            validatePhoneDigits(withoutPrefix);
            return "+" + withoutPrefix;
        }
        if (digits.startsWith("82")) {
            validatePhoneDigits(digits);
            return "+" + digits;
        }
        if (digits.startsWith("0")) {
            String localized = "82" + digits.substring(1);
            validatePhoneDigits(localized);
            return "+" + localized;
        }

        validatePhoneDigits(digits);
        return "+" + digits;
    }

    private static String digitsOnly(String value) {
        StringBuilder sb = new StringBuilder(value.length());
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (Character.isDigit(c)) {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private static void validatePhoneDigits(String digits) {
        if (digits.length() < 8 || digits.length() > 15) {
            throw new InvalidRequestException("Invalid phoneNumber format");
        }
    }

    private static String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 4) {
            return "***";
        }
        int show = Math.min(4, phoneNumber.length());
        String suffix = phoneNumber.substring(phoneNumber.length() - show);
        return "***" + suffix;
    }

    private static DeliveryChannel requireChannel(DeliveryChannel channel) {
        if (channel == null) {
            throw new InvalidRequestException("channel is required");
        }
        return channel;
    }

    private static int clamp(int value, int min, int max) {
        if (value < min) {
            return min;
        }
        if (value > max) {
            return max;
        }
        return value;
    }

    private static String normalizeLimit(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }

    private record CreatedCode(AccessCode accessCode, String code) {
    }

    public record RequestCodeResult(
            String maskedPhoneNumber,
            DeliveryChannel channel,
            Instant codeExpiresAt,
            int maxAttempts
    ) {
    }

    public record IssueCodeResult(
            Long id,
            String phoneNumber,
            DeliveryChannel channel,
            String code,
            Instant expiresAt,
            int maxAttempts,
            Instant createdAt
    ) {
    }

    public record VerifyResult(String sessionToken, Instant sessionExpiresAt) {
    }

    public record SessionStatus(boolean authenticated, Instant sessionExpiresAt) {
    }

    public record AccessCodeSummary(
            Long id,
            String phoneNumber,
            DeliveryChannel channel,
            boolean used,
            int attemptCount,
            int maxAttempts,
            Instant createdAt,
            Instant expiresAt,
            Instant usedAt
    ) {
    }

    public static class UnauthorizedException extends RuntimeException {
        public UnauthorizedException(String message) {
            super(message);
        }
    }

    public static class TooManyRequestsException extends RuntimeException {
        public TooManyRequestsException(String message) {
            super(message);
        }
    }

    public static class InvalidRequestException extends RuntimeException {
        public InvalidRequestException(String message) {
            super(message);
        }
    }
}
