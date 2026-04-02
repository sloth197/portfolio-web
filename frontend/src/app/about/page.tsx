import Image from "next/image";
import I18nText from "@/components/i18n-text";

const WORKFLOW_CARDS = [
  {
    koTitle: "문제 해결 중심",
    enTitle: "Problem-Solving Focus",
  },
  {
    koTitle: "구조 중심 개발",
    enTitle: "Structure-Driven Development",
  },
  {
    koTitle: "TEST",
    enTitle: "TEST",
  },
  {
    koTitle: "TEST",
    enTitle: "TEST",
  },
];

type TechIcon = {
  src: string;
  label: string;
};

type Tool = {
  name: string;
  level: string;
  icons: TechIcon[];
};

type InterestTech = {
  name: string;
  icons: TechIcon[];
};

const TOOLS: Tool[] = [
  {
    name: "C#",
    level: "90%",
    icons: [{ src: "/icons/tech/c-sharp.png", label: "C#" }],
  },
  {
    name: "ASP.NET",
    level: "85%",
    icons: [{ src: "/icons/tech/aspnet.svg", label: "ASP.NET" }],
  },
  {
    name: "WPF",
    level: "84%",
    icons: [{ src: "/icons/tech/wpf.svg", label: "WPF" }],
  },
  {
    name: "Docker",
    level: "82%",
    icons: [{ src: "/icons/tech/docker.svg", label: "Docker" }],
  },
  {
    name: "Java",
    level: "84%",
    icons: [{ src: "/icons/tech/java.svg", label: "Java" }],
  },
  {
    name: "Spring",
    level: "84%",
    icons: [{ src: "/icons/tech/spring.svg", label: "Spring" }],
  },
];

const INTEREST_TECHS: InterestTech[] = [
  {
    name: "PostgreSQL",
    icons: [{ src: "/icons/tech/postgresql.svg", label: "PostgreSQL" }],
  },
  {
    name: "Vercel",
    icons: [{ src: "/icons/tech/vercel.svg", label: "Vercel" }],
  },
  {
    name: "Next.js",
    icons: [{ src: "/icons/tech/nextjs.svg", label: "Next.js" }],
  },
  {
    name: "TypeScript",
    icons: [{ src: "/icons/tech/typescript.svg", label: "TypeScript" }],
  },
  {
    name: "C",
    icons: [{ src: "/icons/tech/c.svg", label: "C" }],
  },
  {
    name: "C++",
    icons: [{ src: "/icons/tech/cplusplus.svg", label: "C++" }],
  },
];

function getTechIconClass(label: string): string {
  if (label === "Vercel") {
    return "about-neo-tech-icon about-neo-tech-icon-vercel";
  }
  return "about-neo-tech-icon";
}

function splitLevelText(level: string): { value: string; unit: string } {
  const trimmed = level.trim();
  if (trimmed.endsWith("%")) {
    return { value: trimmed.slice(0, -1).trim(), unit: "%" };
  }
  return { value: trimmed, unit: "" };
}

export default function AboutPage() {
  return (
    <div className="about-neo-shell">
      <div className="about-neo-debug-section">
        <section className="about-neo-section">
          <h2 className="about-neo-section-title">
            <I18nText ko="About Me" en="About Me" />
          </h2>
          <div className="about-neo-about-text">
            <p style={{ whiteSpace: "pre-line" }}>
              <I18nText
                ko={`백엔드 개발자를 목표로 준비 중입니다.
Java와 Spring, C# 기반으로 API 설계와 데이터 처리 구조를 학습하며 프로젝트를 진행하고 있습니다.`}
                en={`I am preparing to become a backend developer.
Building projects using Java, Spring, and C#, focusing on API design and data processing structures.`}
              />
            </p>
            <p>
              <I18nText
                ko="사용가능한 실제 서비스를 구현함에 있어 안정적인 시스템을 구현하는 것을 목표로 하고 있습니다."
                en="My goal is to build stable systems for practical, real services."
              />
            </p>
          </div>
        </section>
      </div>

      <div className="about-neo-debug-section">
        <section className="about-neo-section">
          <h2 className="about-neo-section-title">
            <I18nText ko="일하는 방식" en="How I Work" />
          </h2>
          <div className="about-neo-work-grid">
            {WORKFLOW_CARDS.map((card, index) => (
              <article key={`${card.koTitle}-${index}`} className="about-neo-work-card">
                <h3>
                  <I18nText ko={card.koTitle} en={card.enTitle} />
                </h3>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="about-neo-debug-section">
        <section className="about-neo-section">
          <h2 className="about-neo-section-title">
            <I18nText ko="주요 기술 스택" en="Core Tech Stack" />
          </h2>
          <div className="about-neo-tool-grid">
            {TOOLS.map((tool) => {
              const level = splitLevelText(tool.level);
              return (
                <article key={tool.name} className="about-neo-tool-card">
                  <span className="about-neo-tool-name">
                    <span className="about-neo-tech-icon-stack" aria-hidden="true">
                      {tool.icons.map((icon) => (
                        <Image
                          key={`${tool.name}-${icon.label}`}
                          src={icon.src}
                          alt=""
                          width={16}
                          height={16}
                          className={getTechIconClass(icon.label)}
                        />
                      ))}
                    </span>
                    <span>{tool.name}</span>
                  </span>
                  <strong>
                    <span className="about-neo-level-value">{level.value}</span>
                    <span className="about-neo-level-unit">{level.unit}</span>
                  </strong>
                </article>
              );
            })}
          </div>
          <div className="about-neo-interest-wrap">
            <h3 className="about-neo-interest-title">
              <I18nText ko="보유·관심 기술" en="Skills & Interests" />
            </h3>
            <div className="about-neo-interest-list">
              {INTEREST_TECHS.filter((item) => item.name.trim().length > 0).map((item) => (
                <span key={item.name} className="about-neo-interest-pill">
                  <span className="about-neo-tech-icon-stack" aria-hidden="true">
                    {item.icons.map((icon) => (
                      <Image
                        key={`${item.name}-${icon.label}`}
                        src={icon.src}
                        alt=""
                        width={14}
                        height={14}
                        className={getTechIconClass(icon.label)}
                      />
                    ))}
                  </span>
                  <span>{item.name}</span>
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
