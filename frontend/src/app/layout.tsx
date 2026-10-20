import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import EntryTransition from "@/components/entry-transition";
import HardReloadTracker from "@/components/hard-reload-tracker";
import SiteNoticePopups from "@/components/site-notice-popups";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const DEFAULT_SITE_URL = "https://www.xhbt.dev";
const DEFAULT_SITE_DESCRIPTION = "Java, Spring 기반 프로젝트 포트폴리오";

function resolveMetadataBase(): URL {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredSiteUrl) {
    try {
      return new URL(configuredSiteUrl);
    } catch {
      // Fallback to default public domain when env value is invalid.
    }
  }
  return new URL(DEFAULT_SITE_URL);
}

const metadataBase = resolveMetadataBase();
const metadataBaseUrl = metadataBase.toString().replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "JWS Portfolio",
    template: "%s | JWS Portfolio",
  },
  description: DEFAULT_SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "JWS Portfolio",
    description: DEFAULT_SITE_DESCRIPTION,
    url: metadataBaseUrl,
    siteName: "JWS Portfolio",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "JWS Portfolio",
    description: DEFAULT_SITE_DESCRIPTION,
  },
};

const themeBootScript = `
(() => {
  try {
    // Light theme is disabled. Always use dark theme on boot.
    document.documentElement.dataset.theme = "dark";
    localStorage.setItem("portfolio-theme", "dark");
    localStorage.setItem("portfolio-theme-user-set", "1");
    sessionStorage.setItem("portfolio-theme-session-user-set", "1");

    const savedLanguage = localStorage.getItem("portfolio-language");
    if (savedLanguage === "en" || savedLanguage === "ko") {
      document.documentElement.lang = savedLanguage;
      document.documentElement.dataset.lang = savedLanguage;
    } else {
      document.documentElement.lang = "en";
      document.documentElement.dataset.lang = "en";
    }
  } catch {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.lang = "en";
    document.documentElement.dataset.lang = "en";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={`${jakarta.variable} ${plexMono.variable}`}>
        <HardReloadTracker />
        <EntryTransition />
        <SiteNoticePopups />
        <div className="site-shell">
          <header className="site-header editorial-header">
            <div className="site-header-inner editorial-header-inner">
              <Link className="editorial-brand" href="/#home">xhbt.dev</Link>
              <nav className="editorial-nav" aria-label="Primary navigation">
                <Link href="/#home">Home</Link>
                <Link href="/projects">Projects</Link>
                <Link href="/#about">About</Link>
                <Link href="/contact" className="editorial-contact-link">Let&apos;s Talk <span aria-hidden="true">→</span></Link>
              </nav>
            </div>
          </header>

          <main className="site-main">{children}</main>

          <footer className="site-footer">
            <div className="site-footer-inner">
              Property of The JWS. It is Mine<br />
              
            </div>
          </footer>

          {/* 테마 토글 버튼 주석 처리
          <div className="floating-theme-toggle">
            <ThemeToggle />
          </div>
          */}
        </div>
      </body>
    </html>
  );
}
