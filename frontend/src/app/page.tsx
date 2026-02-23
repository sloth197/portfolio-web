import Link from "next/link";
import { fetchHomeTechNews } from "@/lib/tech-news";

function formatPublishedAt(unixSeconds: number): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(unixSeconds * 1000));
}

export default async function Home() {
  const newsItems = await fetchHomeTechNews(6);

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
          안녕하세요 테스트 중입니다
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
              Firmware 프로젝트 목록 보기
            </p>
          </Link>

          <Link className="panel project-card" href="/projects?category=SOFTWARE" style={{ padding: 18, display: "grid" }}>
            <span className="badge">Software</span>
            <p className="section-copy" style={{ marginTop: 12 }}>
              Software 프로젝트 목록 보기
            </p>
          </Link>
        </div>
      </section>

      <section style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h2 className="section-title">IT News</h2>
          <span className="section-copy" style={{ fontSize: 13 }}>
            Hacker News 기준, 15분 캐시
          </span>
        </div>

        {newsItems.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            {newsItems.map((item) => (
              <a
                key={item.id}
                className="panel project-card"
                href={item.url}
                target="_blank"
                rel="noreferrer"
                style={{ padding: 16, display: "grid", gap: 10 }}
              >
                <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-geist-mono)" }}>
                  {formatPublishedAt(item.publishedAtUnix)}
                </div>
                <div style={{ margin: 0, fontSize: 17, fontWeight: 800, lineHeight: 1.38 }}>{item.title}</div>
                <div className="section-copy" style={{ fontSize: 13 }}>
                  by {item.author} · score {item.score}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="panel" style={{ padding: 16 }}>
            <p className="section-copy">뉴스를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>
          </div>
        )}
      </section>
    </div>
  );
}
