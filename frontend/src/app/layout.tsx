import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import AdminCrmBanner from "@/components/admin-crm-banner";
import HeaderAuthButton from "@/components/header-auth-button";
import I18nText from "@/components/i18n-text";
import LanguageToggle from "@/components/language-toggle";
import ThemeToggle from "@/components/theme-toggle";
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
    const saved = localStorage.getItem("portfolio-theme");
    document.documentElement.dataset.theme = saved === "dark" ? "dark" : "light";

    const savedLanguage = localStorage.getItem("portfolio-language");
    if (savedLanguage === "en" || savedLanguage === "ko") {
      document.documentElement.lang = savedLanguage;
      document.documentElement.dataset.lang = savedLanguage;
    } else {
      document.documentElement.lang = "ko";
      document.documentElement.dataset.lang = "ko";
    }
  } catch {
    document.documentElement.dataset.theme = "light";
    document.documentElement.lang = "ko";
    document.documentElement.dataset.lang = "ko";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={`${jakarta.variable} ${plexMono.variable}`}>
        <div className="site-shell">
          <header className="site-header">
            <div className="site-header-inner">
              <Link className="brand-mark" href="/">
                JWS Portfolio
              </Link>
              <nav className="site-nav">
                <Link className="nav-link" href="/">
                  <I18nText ko="홈" en="Home" />
                </Link>
                <Link className="nav-link" href="/projects">
                  <I18nText ko="프로젝트" en="Projects" />
                </Link>
                <Link className="nav-link" href="/about">
                  <I18nText ko="소개" en="About" />
                </Link>
                <Link className="nav-link" href="/contact">
                  <I18nText ko="연락처" en="Contact" />
                </Link>
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
              © 2026 JWS. <I18nText ko="모든 권리 보유." en="All rights reserved." />
            </div>
          </footer>

          <div className="floating-theme-toggle">
            <ThemeToggle />
          </div>
        </div>
      </body>
    </html>
  );
}
