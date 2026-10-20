import type { Metadata } from "next";
import ProjectShowcaseCard from "@/components/project-showcase-card";
import { ApiError, PROJECT_REVALIDATE_SECONDS, fetchProjectSummaries } from "@/lib/api";
import { PREVIEW_PROJECTS } from "@/lib/project-preview";

export const metadata: Metadata = { title: "Home", description: "xhbt.dev developer portfolio" };
const skills = [["C#", "Backend Development", "90%"], ["ASP.NET", "Web Framework", "85%"], ["Next.js", "Frontend Framework", "84%"], ["TypeScript", "Frontend Development", "84%"], ["Docker", "Container & DevOps", "82%"], ["MySQL", "Database", "84%"]];

export default async function Home() {
  let projects: Awaited<ReturnType<typeof fetchProjectSummaries>> = [];
  let projectLoadWarning: string | null = null;
  try { projects = await fetchProjectSummaries(undefined, { policy: "cached", revalidateSeconds: PROJECT_REVALIDATE_SECONDS }); } catch (error) { if (error instanceof ApiError) projectLoadWarning = "Projects API is temporarily unavailable."; if (process.env.NODE_ENV !== "production") projects = PREVIEW_PROJECTS; }
  const sortedProjects = [...projects].sort((a, b) => a.title.localeCompare(b.title));
  return <div className="editorial-page">
    <section id="home" className="editorial-hero"><div className="editorial-hero-copy"><p className="editorial-kicker">DEVELOPER / CREATIVE BUILDER</p><h1><span>Building</span><span>digital things</span><span>that <em>work.</em></span></h1><p className="editorial-hero-description">Web applications, internal tools, and digital experiences<br />that solve real problems.</p><div className="editorial-stack">{["Java", "Spring", "React", "Next.js", "SQL"].map((item) => <span key={item}>{item}</span>)}</div></div><div className="monolith-visual" aria-hidden="true" /></section>
    <section id="about" className="editorial-intro"><p>안녕하세요. 백엔드 개발자로 성장하고 있는 주니어 개발자입니다.</p><p>C#, ASP.NET, Next.js를 활용해 다양한 프로젝트를 개발하며, 단순한 기능 구현을 넘어 실제 서비스와 데이터 흐름을 이해하는 데 집중하고 있습니다.</p><p>데이터 모델링과 처리 흐름을 꾸준히 개선하고, 협업과 피드백을 통해 더 나은 개발자로 성장해 나가는 것이 목표입니다.</p></section>
    <section className="editorial-section"><div className="editorial-section-title"><h2>HOW I WORK</h2><i /></div><div className="work-grid">{["Structure-Driven Development", "Work Together", "Keep Improving"].map((title, index) => <article className="work-card" key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{["명확한 구조와 유지보수하기 쉬운 코드를 작성합니다.", "함께 논의하고 피드백을 주고받으며 더 나은 결과를 만듭니다.", "새로운 기술을 배우고 실험하며 꾸준히 성장합니다."][index]}</p></div><b>→</b></article>)}</div></section>
    <section className="editorial-section"><div className="editorial-section-title"><h2>CORE TECH STACK</h2><i /></div><div className="skills-grid">{skills.map(([name, detail, level]) => <article className="skill-card" key={name}><strong>{name}</strong><span>{detail}</span><b>{level}</b></article>)}</div><div className="interest-list">{["PostgreSQL", "Vercel", "Java", "Spring", "C", "C++"].map((item) => <span key={item}>{item}</span>)}</div></section>
    <section id="projects" className="editorial-section editorial-projects"><div className="editorial-section-title"><h2>FEATURED PROJECTS</h2><a href="/projects">VIEW ALL →</a></div>{projectLoadWarning ? <div className="projects-empty-state">{projectLoadWarning}</div> : null}<div className="projects-showcase-grid">{sortedProjects.map((project, index) => <ProjectShowcaseCard key={project.id} href={`/projects/${project.slug}`} index={index} periodText={project.projectPeriod} project={project} />)}</div></section>
    <section id="contact" className="editorial-section contact-strip"><div className="editorial-section-title"><h2>LET&apos;S TALK</h2><span>좋은 아이디어가 있다면 언제든지 연락주세요.</span></div><div className="contact-links"><a href="https://github.com/sloth197">◉ GitHub <b>→</b></a><a href="/contact">in LinkedIn <b>→</b></a><a href="mailto:sloth197@naver.com">✉ E-mail <b>→</b></a></div></section>
    <section className="editorial-news"><div className="editorial-section-title"><h2>LATEST NEWS</h2><a href="/Notice">VIEW ALL →</a></div><div className="news-cards"><article>웹사이트 리뉴얼을 준비 중입니다.</article><article>ERP 데스크톱 프로그램 개발 진행 중</article><article>새로운 기술을 배우고 있습니다.</article></div></section>
  </div>;
}
