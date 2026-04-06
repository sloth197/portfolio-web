import Image from "next/image";
import AboutPage from "@/app/about/page";
import ContactPage from "@/app/contact/page";
import I18nText from "@/components/i18n-text";
import HomeItNewsStrip from "@/components/home-it-news-strip";
import ProjectShowcaseCard from "@/components/project-showcase-card";
import { ApiError, fetchProjects } from "@/lib/api";
import { PREVIEW_PROJECTS } from "@/lib/project-preview";
import { fetchHomeTechNews } from "@/lib/tech-news";

const HOME_PROJECTS_REVALIDATE_SECONDS = 120;

export default async function Home() {
  const newsItems = await fetchHomeTechNews(30);
  let projects: Awaited<ReturnType<typeof fetchProjects>> = [];
  let projectLoadWarning: string | null = null;

  try {
    projects = await fetchProjects(undefined, {
      policy: "cached",
      revalidateSeconds: HOME_PROJECTS_REVALIDATE_SECONDS,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401 || error.status === 403) {
        projectLoadWarning = "Projects API is requiring authentication (401/403). Check backend auth settings.";
      } else if (error.status >= 500) {
        projectLoadWarning = "Projects API is temporarily unavailable. Please check backend deployment status.";
      }

      if (process.env.NODE_ENV !== "production") {
        projects = PREVIEW_PROJECTS;
        if (!projectLoadWarning) {
          projectLoadWarning = "Development fallback data is shown because live API fetch failed.";
        }
      }
    }
  }

  const sortedProjects = [...projects].sort((a, b) => a.title.localeCompare(b.title));

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
            <I18nText ko="웹사이트 리뉴얼 중입니다. 곧 멋진 사이트로 돌아오겠습니다!" en="I am renewing my website. I'll be back with cool website soon!" />
            {/*  사이트 리뉴얼 중이므로 임시 주석 처리
            <I18nText ko="안녕하세요!" en="Hi!" /> <br />
            <I18nText ko="제 포트폴리오에 오신 것을 환영합니다. " en="Welcome to my Portfolio!" />
            */}
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
        {projectLoadWarning ? <div className="projects-empty-state">{projectLoadWarning}</div> : null}
        {sortedProjects.length === 0 ? (
          <div className="projects-empty-state">
            <I18nText ko="표시할 프로젝트가 없습니다." en="No projects available yet." />
          </div>
        ) : (
          <div className="projects-showcase-grid">
            {sortedProjects.map((project, index) => (
              <ProjectShowcaseCard
                key={project.id}
                href={`/projects/${project.slug}`}
                index={index}
                periodText={project.projectPeriod}
                project={project}
              />
            ))}
          </div>
        )}
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
