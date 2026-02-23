package com.sloth.portfolio.service;

import com.sloth.portfolio.domain.DeliveryChannel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;

@Component
public class ConfiguredOtpMessageSender implements OtpMessageSender {

    private static final Logger log = LoggerFactory.getLogger(ConfiguredOtpMessageSender.class);

    private final RestClient restClient;
    private final String kakaoWebhookUrl;
    private final String passWebhookUrl;

    public ConfiguredOtpMessageSender(
            @Value("${app.auth.kakao-webhook-url:}") String kakaoWebhookUrl,
            @Value("${app.auth.pass-webhook-url:}") String passWebhookUrl
    ) {
        this.restClient = RestClient.create();
        this.kakaoWebhookUrl = normalize(kakaoWebhookUrl);
        this.passWebhookUrl = normalize(passWebhookUrl);
    }

    @Override
    public void send(String phoneNumber, String code, DeliveryChannel channel) {
        String targetUrl = resolveTarget(channel);
        if (targetUrl == null) {
            // Local/dev fallback: expose OTP in server logs when no provider is configured.
            log.info("OTP mock send [{}] phone={} code={}", channel, phoneNumber, code);
            return;
        }

        OtpSendRequest payload = new OtpSendRequest(channel.name(), phoneNumber, code, Instant.now());
        restClient.post()
                .uri(targetUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .toBodilessEntity();
    }

    private String resolveTarget(DeliveryChannel channel) {
        return switch (channel) {
            case KAKAO -> kakaoWebhookUrl;
            case PASS -> passWebhookUrl;
        };
    }

    private static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    public record OtpSendRequest(String channel, String phoneNumber, String code, Instant createdAt) {
    }
}
