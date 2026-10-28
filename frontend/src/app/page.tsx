import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import ProjectShowcaseCard from "@/components/project-showcase-card";
import { ApiError, PROJECT_REVALIDATE_SECONDS, fetchProjectSummaries } from "@/lib/api";
import { PREVIEW_PROJECTS } from "@/lib/project-preview";
import { fetchHomeTechNews } from "@/lib/tech-news";

export const metadata: Metadata = { title: "Home", description: "xhbt.dev developer portfolio" };
const frontendSkills = ["React", "Next.js", "TypeScript"];
const backendSkills = ["C#", "WPF", "Docker", "PostgreSQL", "Java"];
const workItems = [
  { title: "Understand the Problem", description: "I start by clarifying the problem and the value the product should deliver." },
  { title: "Design the Structure", description: "I shape a clear, maintainable structure before turning ideas into code." },
  { title: "Build and Iterate", description: "I build, test, and improve the product through real feedback." },
];

function TechIcon({ name }: { name: string }) {
  if (name === "React") return <svg viewBox="0 0 24 24" className="tech-icon" aria-hidden="true"><circle cx="12" cy="12" r="2.2" fill="currentColor" /><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" /><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(120 12 12)" /></svg>;
  const iconByName: Record<string, string> = {
    "Next.js": "/icons/tech/nextjs.svg",
    TypeScript: "/icons/tech/typescript.svg",
    "C#": "/icons/tech/c-sharp.png",
    WPF: "/icons/tech/wpf.svg",
    Docker: "/icons/tech/docker.svg",
    Java: "/icons/tech/java.svg",
    PostgreSQL: "/icons/tech/postgresql.svg",
  };
  return iconByName[name] ? <Image src={iconByName[name]} className="tech-icon tech-icon-image" alt="" width={24} height={24} aria-hidden="true" /> : null;
}

function GithubIcon() {
  return <svg className="contact-link-icon contact-link-icon-github" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8a8.01 8.01 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" /></svg>;
}

function LinkedinIcon() {
  return <svg className="contact-link-icon contact-link-icon-linkedin" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0ZM7.12 20.45H3.56V9h3.56v11.45ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM20.45 20.45h-3.55v-5.57c0-1.33-.03-3.03-1.85-3.03-1.85 0-2.13 1.44-2.13 2.94v5.66H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.28 2.37 4.28 5.46v6.28Z" /></svg>;
}

function MailIcon() {
  return <svg className="contact-link-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2 9 6 9-6H3Zm18 10V9l-9 6-9-6v8h18Z" /></svg>;
}

export default async function Home() {
  let projects: Awaited<ReturnType<typeof fetchProjectSummaries>> = [];
  let projectLoadWarning: string | null = null;
  const [newsItems, projectResult] = await Promise.all([
    fetchHomeTechNews(3),
    fetchProjectSummaries(undefined, { policy: "cached", revalidateSeconds: PROJECT_REVALIDATE_SECONDS })
      .then((value) => ({ projects: value, error: null }))
      .catch((error: unknown) => ({ projects: [], error })),
  ]);
  projects = projectResult.projects;
  if (projectResult.error instanceof ApiError) projectLoadWarning = "Projects API is temporarily unavailable.";
  if (process.env.NODE_ENV !== "production" && projectResult.error) projects = PREVIEW_PROJECTS;
  const sortedProjects = [...projects].sort((a, b) => a.title.localeCompare(b.title));
  return <div className="editorial-page">
    <section id="home" className="editorial-hero"><div className="editorial-hero-copy"><p className="editorial-kicker">DEVELOPER / CREATIVE BUILDER</p><h1><span>Concept to</span><span><em>working product.</em></span></h1><p className="editorial-hero-description">Turning ideas into reliable digital products<br />across web and desktop.</p></div><div className="monolith-visual" aria-hidden="true" /></section>
    <section id="about" className="editorial-intro"><p className="editorial-intro-highlight"><span>The goal is simple:</span><br /><strong>software that is easy to use, maintain, and improve over time.</strong></p><p>Clear structure, thoughtful interfaces, and reliable application logic are at the center of my work.</p><p>I focus on understanding how systems and data flow together, then improving each project through testing and feedback.</p></section>
    <section className="editorial-section"><div className="editorial-section-title"><h2>HOW I WORK</h2><i /></div><div className="work-carousel"><div className="work-grid">{workItems.map(({ title, description }) => <article className="work-card" key={title}><div><h3>{title}</h3><p>{description}</p></div></article>)}{workItems.map(({ title, description }) => <article className="work-card" aria-hidden="true" key={`duplicate-${title}`}><div><h3>{title}</h3><p>{description}</p></div></article>)}</div></div></section>
    <section className="editorial-section"><div className="editorial-section-title"><h2>TECH STACK</h2><i /></div><div className="skills-pill-groups"><div className="skills-pill-group"><h3>FRONTEND</h3><div>{frontendSkills.map((name) => <span key={name}><TechIcon name={name} />{name}</span>)}</div></div><div className="skills-pill-group"><h3>BACKEND</h3><div>{backendSkills.map((name) => <span key={name}><TechIcon name={name} />{name}</span>)}</div></div></div></section>
    <section id="projects" className="editorial-section editorial-projects"><div className="editorial-section-title"><h2>PROJECTS</h2><Link href="/projects">VIEW ALL →</Link></div>{projectLoadWarning ? <div className="projects-empty-state">{projectLoadWarning}</div> : null}<div className="projects-showcase-grid">{sortedProjects.map((project, index) => <ProjectShowcaseCard key={project.id} href={`/projects/${project.slug}`} index={index} periodText={project.projectPeriod} project={project} />)}</div></section>
    <section id="contact" className="editorial-section contact-strip"><div className="editorial-section-title"><h2>CONTACT</h2><span>좋은 아이디어가 있다면 언제든지 연락주세요.</span></div><div className="contact-links"><a href="https://github.com/sloth197" target="_blank" rel="noreferrer"><GithubIcon /><span>GitHub</span><b>→</b></a><a href="https://www.linkedin.com/in/%EC%9A%B0%EC%84%B1-%EC%A0%95-549379317/?skipRedirect=true" target="_blank" rel="noreferrer"><LinkedinIcon /><span>LinkedIn</span><b>→</b></a><a href="mailto:sloth197@naver.com"><MailIcon /><span>E-mail</span><b>→</b></a></div></section>
    <section className="editorial-news"><div className="editorial-section-title"><h2>DEVELOPER PICKS</h2><a href="https://news.ycombinator.com/" target="_blank" rel="noreferrer">VIEW ALL →</a></div><div className="news-cards">{newsItems.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer"><article><strong>{item.title}</strong>{item.summary ? <span>{item.summary}</span> : null}</article></a>)}</div></section>
  </div>;
}
