export default function ContactPage() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="surface-card" style={{ padding: "22px clamp(18px, 4vw, 30px)", display: "grid", gap: 10 }}>
        <span className="badge">Contact</span>
        <h1 className="section-title">테슷뜨</h1>
        <p className="section-copy">테슷뜨</p>
      </section>

      <section style={{ display: "grid", gap: 12, maxWidth: 760 }}>
        <a className="panel" href="https://github.com/sloth197" target="_blank" rel="noreferrer" style={{ padding: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>GitHub</div>
          <div className="section-copy"></div>
        </a>

        <a className="panel" href="mailto:sloth197@naver.com" style={{ padding: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>E-mail</div>
          <div className="section-copy">sloth197@naver.com</div>
        </a>
      </section>
    </div>
  );
}
