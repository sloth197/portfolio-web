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

const TOOLS = [
  { name: "C#", level: "90%" },
  { name: "ASP.NET", level: "85%" },
  { name: "WPF", level: "84%" },
  { name: "Docker", level: "82%" },
  { name: "Java / Spring", level: "84%" },
];

const INTEREST_TECHS = [
  "PostgreSQL",
  "Vercel",
  "Next.js",
  "TypeScript",
  "C/C++",
];

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
                en="My goal is to build stable systems for practical, real-world services."
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
            {TOOLS.map((tool) => (
              <article key={tool.name} className="about-neo-tool-card">
                <span className="about-neo-tool-name">{tool.name}</span>
                <strong>{tool.level}</strong>
              </article>
            ))}
          </div>
          <div className="about-neo-interest-wrap">
            <h3 className="about-neo-interest-title">
              <I18nText ko="보유·관심 기술" en="Skills & Interests" />
            </h3>
            <div className="about-neo-interest-list">
              {INTEREST_TECHS.filter((item) => item.trim().length > 0).map((item) => (
                <span key={item} className="about-neo-interest-pill">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
