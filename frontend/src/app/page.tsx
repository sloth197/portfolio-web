import type { Metadata } from "next";
import Link from "next/link";
import ProjectShowcaseCard from "@/components/project-showcase-card";
import { ApiError, PROJECT_REVALIDATE_SECONDS, fetchProjectSummaries } from "@/lib/api";
import { PREVIEW_PROJECTS } from "@/lib/project-preview";

export const metadata: Metadata = { title: "Home", description: "xhbt.dev developer portfolio" };
const frontendSkills = ["React", "Next.js", "TypeScript"];
const backendSkills = ["C#", "ASP.NET", "Docker", "MySQL"];

function TechIcon({ name }: { name: string }) {
  if (name === "React") return <svg viewBox="0 0 24 24" className="tech-icon" aria-hidden="true"><circle cx="12" cy="12" r="2.2" fill="currentColor" /><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" /><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(120 12 12)" /></svg>;
  if (name === "Next.js") return <span className="tech-icon tech-icon-next" aria-hidden="true">N</span>;
  if (name === "TypeScript") return <span className="tech-icon tech-icon-ts" aria-hidden="true">TS</span>;
  if (name === "C#") return <svg viewBox="0 0 24 24" className="tech-icon tech-icon-csharp" aria-hidden="true"><path fill="currentColor" d="M12 2 21 7v10l-9 5-9-5V7l9-5Zm-4.8 8.2v1.4h1.7v1.6H7.2v1.4h1.7v1.7h1.4v-1.7h2v1.7h1.4v-1.7h1.2v-1.4h-1.2v-1.6h1.2v-1.4h-1.2V8.5h-1.4v1.7h-2V8.5H8.9v1.7H7.2Zm3.1 1.4h2v1.6h-2v-1.6Z" /></svg>;
  if (name === "ASP.NET") return <svg viewBox="0 0 28 24" className="tech-icon tech-icon-dotnet" aria-hidden="true"><path fill="currentColor" d="M2 15.5c4.2-6.2 8.2-6.2 12.2 0 3.1 4.8 6.3 4.8 11.8-.3-3.6 7.4-8.8 8.1-12.7 2.5C10 13.9 7.2 13.2 2 15.5Z" /><path fill="currentColor" opacity=".65" d="M2 11.8c4.4-3.4 8.6-3.1 12.1.8 3.2 3.5 6.3 3.3 11.9-1.7-3.4 6.6-8.4 7.5-12.6 3.5C9.8 10.9 6.3 10 2 11.8Z" /></svg>;
  if (name === "Docker") return <svg viewBox="0 0 24 24" className="tech-icon tech-icon-docker" aria-hidden="true"><path fill="currentColor" d="M3 13h3v3H3v-3Zm4 0h3v3H7v-3Zm4 0h3v3h-3v-3Zm-4-4h3v3H7V9Zm4 0h3v3h-3V9Zm4 4h3v3h-3v-3Zm3.8 1.2c-.7-.5-1.5-.7-2.3-.6-.2-1-.6-1.9-1.3-2.6l-.7.7c.5.5.8 1.2.9 1.9H4.2c.1 2.8 2 4.4 4.8 4.4h5.7c2.6 0 4.3-1.1 5.1-3.1.3-.7.5-1.5.5-2.3-.5.1-1 .3-1.5.6Z" /></svg>;
  return <svg viewBox="0 0 24 24" className="tech-icon tech-icon-mysql" aria-hidden="true"><path fill="currentColor" d="M4 7c0-2 3.6-3.5 8-3.5S20 5 20 7v10c0 2-3.6 3.5-8 3.5S4 19 4 17V7Zm2 0c0 .8 2.2 1.8 6 1.8s6-1 6-1.8-2.2-1.8-6-1.8-6 1-6 1.8Zm0 5c1.4 1 3.6 1.5 6 1.5s4.6-.5 6-1.5v2c-1.4 1-3.6 1.5-6 1.5s-4.6-.5-6-1.5v-2Zm0 5c1.4 1 3.6 1.5 6 1.5s4.6-.5 6-1.5v2c-1.4 1-3.6 1.5-6 1.5s-4.6-.5-6-1.5v-2Z" /></svg>;
}

function GithubIcon() {
  return <svg className="contact-link-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8a8.01 8.01 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" /></svg>;
}

function LinkedinIcon() {
  return <svg className="contact-link-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0ZM7.12 20.45H3.56V9h3.56v11.45ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM20.45 20.45h-3.55v-5.57c0-1.33-.03-3.03-1.85-3.03-1.85 0-2.13 1.44-2.13 2.94v5.66H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.28 2.37 4.28 5.46v6.28Z" /></svg>;
}

function MailIcon() {
  return <svg className="contact-link-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2 9 6 9-6H3Zm18 10V9l-9 6-9-6v8h18Z" /></svg>;
}

export default async function Home() {
  let projects: Awaited<ReturnType<typeof fetchProjectSummaries>> = [];
  let projectLoadWarning: string | null = null;
  try { projects = await fetchProjectSummaries(undefined, { policy: "cached", revalidateSeconds: PROJECT_REVALIDATE_SECONDS }); } catch (error) { if (error instanceof ApiError) projectLoadWarning = "Projects API is temporarily unavailable."; if (process.env.NODE_ENV !== "production") projects = PREVIEW_PROJECTS; }
  const sortedProjects = [...projects].sort((a, b) => a.title.localeCompare(b.title));
  return <div className="editorial-page">
    <section id="home" className="editorial-hero"><div className="editorial-hero-copy"><p className="editorial-kicker">DEVELOPER / CREATIVE BUILDER</p><h1><span>Building</span><span>digital things</span><span>that <em>work.</em></span></h1><p className="editorial-hero-description">Web applications, internal tools, and digital experiences<br />that solve real problems.</p><div className="editorial-stack">{["Java", "Spring", "React", "Next.js", "SQL"].map((item) => <span key={item}>{item}</span>)}</div></div><div className="monolith-visual" aria-hidden="true" /></section>
    <section id="about" className="editorial-intro"><p>안녕하세요. 백엔드 개발자로 성장하고 있는 주니어 개발자입니다.</p><p>C#, ASP.NET, Next.js를 활용해 다양한 프로젝트를 개발하며, 단순한 기능 구현을 넘어 실제 서비스와 데이터 흐름을 이해하는 데 집중하고 있습니다.</p><p>데이터 모델링과 처리 흐름을 꾸준히 개선하고, 협업과 피드백을 통해 더 나은 개발자로 성장해 나가는 것이 목표입니다.</p></section>
    <section className="editorial-section"><div className="editorial-section-title"><h2>HOW I WORK</h2><i /></div><div className="work-grid">{["Structure-Driven Development", "Work Together", "Keep Improving"].map((title, index) => <article className="work-card" key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{["명확한 구조와 유지보수하기 쉬운 코드를 작성합니다.", "함께 논의하고 피드백을 주고받으며 더 나은 결과를 만듭니다.", "새로운 기술을 배우고 실험하며 꾸준히 성장합니다."][index]}</p></div><b>→</b></article>)}</div></section>
    <section className="editorial-section"><div className="editorial-section-title"><h2>TECH STACK</h2><i /></div><div className="skills-pill-groups"><div className="skills-pill-group"><h3>FRONTEND</h3><div>{frontendSkills.map((name) => <span key={name}><TechIcon name={name} />{name}</span>)}</div></div><div className="skills-pill-group"><h3>BACKEND</h3><div>{backendSkills.map((name) => <span key={name}><TechIcon name={name} />{name}</span>)}</div></div></div></section>
    <section id="projects" className="editorial-section editorial-projects"><div className="editorial-section-title"><h2>FEATURED PROJECTS</h2><Link href="/projects">VIEW ALL →</Link></div>{projectLoadWarning ? <div className="projects-empty-state">{projectLoadWarning}</div> : null}<div className="projects-showcase-grid">{sortedProjects.map((project, index) => <ProjectShowcaseCard key={project.id} href={`/projects/${project.slug}`} index={index} periodText={project.projectPeriod} project={project} />)}</div></section>
    <section id="contact" className="editorial-section contact-strip"><div className="editorial-section-title"><h2>LET&apos;S TALK</h2><span>좋은 아이디어가 있다면 언제든지 연락주세요.</span></div><div className="contact-links"><a href="https://github.com/sloth197"><GithubIcon /><span>GitHub</span><b>→</b></a><a href="/contact"><LinkedinIcon /><span>LinkedIn</span><b>→</b></a><a href="mailto:sloth197@naver.com"><MailIcon /><span>E-mail</span><b>→</b></a></div></section>
    <section className="editorial-news"><div className="editorial-section-title"><h2>LATEST NEWS</h2><a href="/Notice">VIEW ALL →</a></div><div className="news-cards"><article>웹사이트 리뉴얼을 준비 중입니다.</article><article>ERP 데스크톱 프로그램 개발 진행 중</article><article>새로운 기술을 배우고 있습니다.</article></div></section>
  </div>;
}
