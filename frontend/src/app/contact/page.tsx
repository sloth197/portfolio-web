export default function ContactPage() {
  const linkedInUrl = "https://www.linkedin.com/";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="surface-card top-banner top-banner-contact" style={{ padding: "22px clamp(18px, 4vw, 30px)", display: "grid", gap: 10 }}>
        <span className="badge">Contact</span>
        <h1 className="section-title">테슷뜨</h1>
        <p className="section-copy">테슷뜨</p>
      </section>

      <section style={{ display: "grid", gap: 12, maxWidth: 760 }}>
        <a className="panel" href="https://github.com/sloth197" target="_blank" rel="noreferrer" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 18 }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
              focusable="false"
              style={{ display: "block" }}
            >
              <path d="M8 0C3.58 0 0 3.58 0 8a8.01 8.01 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            <span>GitHub</span>
          </div>
          <div className="section-copy"></div>
        </a>

        <div className="panel" style={{ padding: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>LinkedIn</div>
          <div className="section-copy">{linkedInUrl}</div>
        </div>

        <article className="panel" style={{ padding: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>E-mail</div>
          <div className="section-copy">sloth197@naver.com</div>
        </article>
      </section>
    </div>
  );
}
