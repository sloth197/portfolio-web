import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
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
  } catch {
    document.documentElement.dataset.theme = "light";
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
                  Home
                </Link>
                <Link className="nav-link" href="/projects">
                  Projects
                </Link>
                <Link className="nav-link" href="/about">
                  About
                </Link>
                <Link className="nav-link" href="/contact">
                  Contact
                </Link>
              </nav>
              <ThemeToggle />
            </div>
          </header>

          <main className="site-main">{children}</main>

          <footer className="site-footer">
            <div className="site-footer-inner">© 2026 JWS. All rights reserved. </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
