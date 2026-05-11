package com.sloth.portfolio.web.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.Locale;
import java.util.regex.Pattern;

public final class GithubRepositoryUrlValidator implements ConstraintValidator<GithubRepositoryUrl, String> {

    private static final Pattern SAFE_SEGMENT = Pattern.compile("[A-Za-z0-9_.-]+");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true;
        }

        URI uri;
        try {
            uri = new URI(value.trim());
        } catch (URISyntaxException ex) {
            return false;
        }

        if (!"https".equalsIgnoreCase(uri.getScheme())) {
            return false;
        }

        String host = uri.getHost();
        if (host == null) {
            return false;
        }

        String normalizedHost = host.toLowerCase(Locale.ROOT);
        if (!"github.com".equals(normalizedHost) && !"www.github.com".equals(normalizedHost)) {
            return false;
        }

        String path = uri.getRawPath();
        if (path == null || path.isBlank()) {
            return false;
        }

        String[] segments = Arrays.stream(path.split("/"))
                .filter(segment -> !segment.isBlank())
                .toArray(String[]::new);
        if (segments.length < 2) {
            return false;
        }

        String owner = segments[0];
        String repo = segments[1].replaceFirst("(?i)\\.git$", "");
        return SAFE_SEGMENT.matcher(owner).matches() && SAFE_SEGMENT.matcher(repo).matches();
    }
}
