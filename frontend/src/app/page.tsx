import Link from "next/link";
import Image from "next/image";
import AboutPage from "@/app/about/page";
import ContactPage from "@/app/contact/page";
import I18nText from "@/components/i18n-text";
import HomeItNewsStrip from "@/components/home-it-news-strip";
import { fetchHomeTechNews } from "@/lib/tech-news";

export default async function Home() {
  const newsItems = await fetchHomeTechNews(10);

  return (
    <div className="home-merged-page" style={{ display: "grid", gap: 32 }}>
      <section id="home" className="home-merged-home" style={{ display: "grid", gap: 18 }}>
        <div className="home-merged-home-layout">
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 5vw, 3.3rem)",
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              maxWidth: 760,
              whiteSpace: "pre-line",
            }}
          >
            <I18nText ko="안녕하세요!" en={""} /> <br />
            <I18nText ko="제 포트폴리오에 오신 것을 환영합니다." en={`Hi!
Welcome to my Portfolio!`} />
          </h1>

          <div className="home-profile-slot" aria-label="Profile photo placeholder">
            <div className="home-profile-photo">
              <Image
                src="/profile-sloth.png"
                alt="Profile photo"
                fill
                className="home-profile-photo-image"
                sizes="(max-width: 900px) 96px, 8vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="home-merged-about-section">
        <AboutPage />
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

      <section id="contact" className="home-merged-contact-section" style={{ display: "grid", gap: 10 }}>
        <ContactPage />
      </section>

      <section className="home-merged-news">
        <HomeItNewsStrip items={newsItems} />
      </section>
    </div>
  );
}
