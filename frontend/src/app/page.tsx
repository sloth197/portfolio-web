import Link from "next/link";
import HomeItNewsStrip from "@/components/home-it-news-strip";
import { fetchHomeTechNews } from "@/lib/tech-news";

export default async function Home() {
  const newsItems = await fetchHomeTechNews(10);

  return (
    <div style={{ display: "grid", gap: 26 }}>
      <section className="surface-card" style={{ padding: "28px clamp(20px, 4vw, 42px)", display: "grid", gap: 18 }}>
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
          테스트 중입니다
        </h1>
        <p className="section-copy" style={{ maxWidth: 700 }}></p>
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
            <p className="section-copy" style={{ marginTop: 12 }}>
              Firmware List
            </p>
          </Link>

          <Link className="panel project-card" href="/projects?category=SOFTWARE" style={{ padding: 18, display: "grid" }}>
            <span className="badge">Software</span>
            <p className="section-copy" style={{ marginTop: 12 }}>
              Software List
            </p>
          </Link>
        </div>
      </section>

      <HomeItNewsStrip items={newsItems} />
    </div>
  );
}
