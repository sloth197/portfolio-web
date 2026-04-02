import Link from "next/link";
import Image from "next/image";
import AboutPage from "@/app/about/page";
import ContactPage from "@/app/contact/page";
import I18nText from "@/components/i18n-text";
import HomeItNewsStrip from "@/components/home-it-news-strip";
import { fetchHomeTechNews } from "@/lib/tech-news";

export default async function Home() {
  const newsItems = await fetchHomeTechNews(30);

  return (
    <div className="home-merged-page" style={{ display: "grid", gap: 18 }}>
      <section id="home" className="home-merged-home" style={{ display: "grid", gap: 18 }}>
        <div className="home-merged-home-layout">
          <h1
            className="home-hero-heading"
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 5vw, 3.3rem)",
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              maxWidth: 760,
              whiteSpace: "pre-line",
            }}
          >
            <I18nText ko="안녕하세요!" en="Hi!" /> <br />
            <I18nText ko="제 포트폴리오에 오신 것을 환영합니다." en="Welcome to my Portfolio!" />
          </h1>

          <div className="home-profile-slot" aria-label="Profile photo placeholder">
            <div className="home-profile-photo">
              <Image
                src="/profile-sloth.png"
                alt="Profile photo"
                fill
                className="home-profile-photo-image"
                sizes="(max-width: 900px) 110px, (max-width: 1400px) 9.2vw, 129px"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="home-merged-about-section">
        <AboutPage />
      </section>

      <section className="home-merged-project-section" style={{ display: "grid", gap: 20 }}>
        <h2 className="section-title">PROJECT</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          <Link className="panel project-card" href="/projects?category=FIRMWARE" style={{ padding: 18, display: "grid" }}>
            <span className="badge badge-java">Java</span>
          </Link>
          <Link className="panel project-card" href="/projects?category=SOFTWARE" style={{ padding: 18, display: "grid" }}>
            <span className="badge badge-csharp">C#</span>
          </Link>
        </div>
      </section>

      <section id="contact" className="home-merged-contact-section" style={{ display: "grid", gap: 10 }}>
        <ContactPage />
      </section>

      <section className="home-merged-news">
        <HomeItNewsStrip items={newsItems} />
      </section>
    </div>
  );
}
