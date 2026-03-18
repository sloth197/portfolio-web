function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style={{ display: "block" }}>
      <path d="M22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0ZM7.12 20.45H3.56V9h3.56v11.45ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM20.45 20.45h-3.55v-5.57c0-1.33-.03-3.03-1.85-3.03-1.85 0-2.13 1.44-2.13 2.94v5.66H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.28 2.37 4.28 5.46v6.28Z" />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ display: "block" }}>
      <rect width="24" height="24" rx="5" fill="#03C75A" />
      <path fill="#fff" d="M6 5h4.1l4.8 7V5H18v14h-4.1l-4.8-7v7H6V5Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ display: "block" }}>
      <path
        d="M21.35 12.2c0-.68-.06-1.19-.2-1.72H12v3.22h5.37c-.11.8-.71 2-2.04 2.8l-.02.11 2.94 2.27.2.02c1.9-1.75 3-4.33 3-7.7Z"
        fill="#4285F4"
      />
      <path
        d="M12 21.5c2.63 0 4.84-.86 6.45-2.35l-3.07-2.4c-.82.57-1.93.97-3.38.97-2.58 0-4.77-1.75-5.55-4.15l-.11.01-3.06 2.36-.04.1C4.83 19.21 8.15 21.5 12 21.5Z"
        fill="#34A853"
      />
      <path
        d="M6.45 13.57A5.86 5.86 0 0 1 6.14 12c0-.54.11-1.06.3-1.57l-.01-.11-3.1-2.4-.1.05A9.6 9.6 0 0 0 2.5 12c0 1.47.35 2.85.96 4.03l3-2.46Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.27c1.83 0 3.06.78 3.76 1.44l2.75-2.68C16.83 3.46 14.63 2.5 12 2.5 8.15 2.5 4.83 4.79 3.23 7.97l3.2 2.47C7.23 8.02 9.42 6.27 12 6.27Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function ContactPage() {
  const linkedInUrl = "https://www.linkedin.com/in/%EC%9A%B0%EC%84%B1-%EC%A0%95-549379317/?skipRedirect=true";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="surface-card top-banner top-banner-contact" style={{ padding: "22px clamp(18px, 4vw, 30px)", display: "grid", gap: 10 }}>
        <span className="badge">Contact</span>
        <h1 className="section-title">Contact</h1>
        <p className="section-copy"></p>
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
            <span>Github</span>
          </div>
          <div className="section-copy"></div>
        </a>

        <a className="panel" href={linkedInUrl} target="_blank" rel="noreferrer" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 18 }}>
            <LinkedInIcon />
            <span>LinkedIn</span>
          </div>
        </a>

        <article className="panel" style={{ padding: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>E-mail</div>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "inherit" }}>
              <NaverIcon />
              <span className="section-copy">sloth197@naver.com</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "inherit" }}>
              <GoogleIcon />
              <span className="section-copy">kuala290@gmail.com</span>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
