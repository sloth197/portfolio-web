import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "GitHub, LinkedIn, 이메일 등 JWS 연락 채널입니다.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact | JWS Portfolio",
    description: "GitHub, LinkedIn, 이메일 등 JWS 연락 채널입니다.",
    url: "/contact",
  },
};

const CONTACT_EMAILS = ["contact@xhbt.dev", "kuala290@gmail.com"] as const;

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style={{ display: "block" }}>
      <path d="M22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0ZM7.12 20.45H3.56V9h3.56v11.45ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM20.45 20.45h-3.55v-5.57c0-1.33-.03-3.03-1.85-3.03-1.85 0-2.13 1.44-2.13 2.94v5.66H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.28 2.37 4.28 5.46v6.28Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ display: "block" }}>
      <path d="M3 6.75A1.75 1.75 0 0 1 4.75 5h14.5A1.75 1.75 0 0 1 21 6.75v10.5A1.75 1.75 0 0 1 19.25 19H4.75A1.75 1.75 0 0 1 3 17.25V6.75Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ display: "block" }}>
      <path d="M3 7.5 12 14l9-6.5" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 7.5v9A1.5 1.5 0 0 0 4.5 18H8v-6h8v6h3.5A1.5 1.5 0 0 0 21 16.5v-9" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 18H4.5A1.5 1.5 0 0 1 3 16.5v-9" stroke="#34A853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 7.5v9A1.5 1.5 0 0 1 19.5 18H16" stroke="#FBBC05" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
            {CONTACT_EMAILS.map((email) => (
              <a
                key={email}
                href={`mailto:${email}`}
                style={{ display: "flex", alignItems: "center", gap: 8, color: "inherit", textDecoration: "none", width: "fit-content" }}
              >
                {email.endsWith("@gmail.com") ? <GmailIcon /> : <MailIcon />}
                <span className="section-copy">{email}</span>
              </a>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
