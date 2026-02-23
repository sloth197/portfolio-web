import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Firmware & Software Portfolio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header style={{ borderBottom: "1px solid #222" }}>
          <div
            style={{
              maxWidth: 1080,
              margin: "0 auto",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <Link href="/" style={{ fontWeight: 800, letterSpacing: 0.3 }}>
              Portfolio
            </Link>

            <nav style={{ display: "flex", gap: 16 }}>
              <Link href="/">Home</Link>
              <Link href="/projects">Projects</Link>
              <Link href="/contact">Contact</Link>
            </nav>
          </div>
        </header>

        <main style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px" }}>
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