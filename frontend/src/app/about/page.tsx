const WORKFLOW_CARDS = [
  {
    title: "TEST",
    copy: "TEST",
  },
  {
    title: "TEST",
    copy: "TEST",
  },
  {
    title: "TEST",
    copy: "TEST",
  },
  {
    title: "TEST",
    copy: "TEST",
  },
];

const TOOLS = [
  { name: "Java / Spring", level: "92%" },
  { name: "Next.js", level: "88%" },
  { name: "TypeScript", level: "90%" },
  { name: "PostgreSQL", level: "85%" },
  { name: "Docker", level: "84%" },
  { name: "C#", level: "82%" },
];

const INTEREST_TECHS = [
  "ASP.NET",
  "WPF",
  "C/C++",
  "MySQL",

];

function SectionMarker({ number, title }: { number: string; title: string }) {
  return (
    <div className="about-neo-marker" aria-hidden>
      <span>{`섹션 ${number}`}</span>
      <strong>{title}</strong>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="about-neo-shell">
      <div className="about-neo-debug-section">
        <SectionMarker number="03" title="About Me" />
        <section className="about-neo-section">
          <h2 className="about-neo-section-title">About Me</h2>
          <div className="about-neo-about-text">
            <p>PCB제조 및 반도체 장비 제조분야에서 근무하며 제조 공정과 장비 흐름을 경험했습니다.</p>
            <p>현장 이해를 강점으로 실무에 활용 가능한 시스템을 개발하는 개발자로 성장하는 것을 목표로 하고 있습니다.</p>
          </div>
        </section>
      </div>

      <div className="about-neo-debug-section">
        <SectionMarker number="05" title="일하는 방식" />
        <section className="about-neo-section">
          <h2 className="about-neo-section-title">일하는 방식</h2>
          <div className="about-neo-work-grid">
            {WORKFLOW_CARDS.map((card) => (
              <article key={card.title} className="about-neo-work-card">
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="about-neo-debug-section">
        <SectionMarker number="06" title="주요 기술 스택" />
        <section className="about-neo-section">
          <h2 className="about-neo-section-title">주요 기술 스택</h2>
          <div className="about-neo-tool-grid">
            {TOOLS.map((tool) => (
              <article key={tool.name} className="about-neo-tool-card">
                <span className="about-neo-tool-name">{tool.name}</span>
                <strong>{tool.level}</strong>
              </article>
            ))}
          </div>
          <div className="about-neo-interest-wrap">
            <h3 className="about-neo-interest-title">보유·관심 기술</h3>
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
