import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import AdminCrmBanner from "@/components/admin-crm-banner";
import EntryTransition from "@/components/entry-transition";
import HeaderAuthButton from "@/components/header-auth-button";
import LanguageToggle from "@/components/language-toggle";
import SiteNavLinks from "@/components/site-nav-links";
import SiteNoticePopups from "@/components/site-notice-popups";
import SiteRandomTwinkle from "@/components/site-random-twinkle";
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

export const metadata: Metadata = {
  title: "JWS Portfolio",
  description: "Firmware and software portfolio",
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
        <SiteRandomTwinkle />
        <EntryTransition />
        <SiteNoticePopups />
        <div className="site-shell">
          <header className="site-header">
            <div className="site-header-inner">
              <Link className="brand-mark" href="/">
                JWS
              </Link>
              <nav className="site-nav">
                <SiteNavLinks />
                <AdminCrmBanner />
              </nav>
              <div className="site-header-actions">
                <HeaderAuthButton />
                <LanguageToggle />
              </div>
            </div>
          </header>

          <main className="site-main">{children}</main>

          <footer className="site-footer">
            <div className="site-footer-inner">
              Copyright 2026 JWS. All rights reserved.
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
