import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";
const configuredApiOrigin = (() => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!raw) return "https://portfolio-api-y5yr.onrender.com";

  try {
    return new URL(raw).origin;
  } catch {
    return "https://portfolio-api-y5yr.onrender.com";
  }
})();

const developmentOrigins = isDevelopment
  ? " http://localhost:* http://127.0.0.1:* ws: wss:"
  : "";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `img-src 'self' data: blob: ${configuredApiOrigin} https://github.com https://raw.githubusercontent.com https://*.githubusercontent.com${developmentOrigins}`,
  "font-src 'self' data:",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${configuredApiOrigin}${developmentOrigins}`,
  "worker-src 'self' blob:",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Embedder-Policy",
    value: "credentialless",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.onrender.com" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
