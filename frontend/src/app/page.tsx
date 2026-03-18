import Link from "next/link";
import I18nText from "@/components/i18n-text";
import HomeItNewsStrip from "@/components/home-it-news-strip";
import { fetchHomeTechNews } from "@/lib/tech-news";

export default async function Home() {
  const newsItems = await fetchHomeTechNews(10);

  return (
    <div style={{ display: "grid", gap: 26 }}>
      <section className="surface-card top-banner top-banner-home" style={{ padding: "28px clamp(20px, 4vw, 42px)", display: "grid", gap: 18 }}>
        <span className="badge">Introduction</span>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(2rem, 5vw, 3.3rem)",
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            maxWidth: 760,
          }}
        >
          <I18nText ko="안녕하세요. 저는 OOO입니다. 제 포트폴리오 사이트에 오신 것을 환영합니다." en="Hello, I am OOO. Welcome to my portfolio website." />
        </h1>
      </section>

      <section style={{ display: "grid", gap: 14 }}>
        <h2 className="section-title">Projects</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          <Link className="panel project-card" href="/projects?category=FIRMWARE" style={{ padding: 18, display: "grid" }}>
            <span className="badge">Firmware</span>
            <p className="section-copy" style={{ marginTop: 12 }}>Firmware List</p>
          </Link>

          <Link className="panel project-card" href="/projects?category=SOFTWARE" style={{ padding: 18, display: "grid" }}>
            <span className="badge">Software</span>
            <p className="section-copy" style={{ marginTop: 12 }}>Software List</p>
          </Link>
        </div>
      </section>

      <HomeItNewsStrip items={newsItems} />
    </div>
  );
}
