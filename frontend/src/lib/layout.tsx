import type { Metadata } from "next";
import Link from "next/link";
import "../app/globals.css";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Java & C# Portfolio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="editorial-header">
          <div className="editorial-header-inner">
            <Link href="/" className="editorial-brand">xhbt.dev</Link>
            <nav className="editorial-nav" aria-label="Primary navigation">
              <Link href="/">Home</Link>
              <Link href="/projects">Projects</Link>
              <Link href="/about">About</Link>
              <Link href="/contact" className="editorial-contact-link">Let&apos;s Talk <span aria-hidden="true">→</span></Link>
            </nav>
          </div>
        </header>

        <main className="editorial-main">
          {children}
        </main>

        <footer style={{ borderTop: "1px solid #222" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 20px", fontSize: 12, color: "#aaa" }}>
            © {new Date().getFullYear()} Portfolio
          </div>
        </footer>
      </body>
    </html>
  );
}
