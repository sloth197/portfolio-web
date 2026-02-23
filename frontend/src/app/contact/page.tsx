import Image from "next/image";

export default function ContactPage() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="surface-card" style={{ padding: "22px clamp(18px, 4vw, 30px)", display: "grid", gap: 10 }}>
        <span className="badge">Contact</span>
        <h1 className="section-title">채용 및 인터뷰 문의</h1>
        <p className="section-copy">아래 채널로 연락 주시면 확인 후 답변드리겠습니다.</p>
      </section>

      <section style={{ display: "grid", gap: 12, maxWidth: 760 }}>
        <a className="panel" href="https://github.com/sloth197" target="_blank" rel="noreferrer" style={{ padding: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>GitHub</div>
          <div className="section-copy">카드를 클릭하면 GitHub 프로필로 이동합니다.</div>
        </a>

        <a className="panel" href="mailto:your-email@example.com" style={{ padding: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>E-mail</div>
          <div className="section-copy">your-email@example.com</div>
        </a>

        <a
          className="panel"
          href="https://github.com/sloth197"
          target="_blank"
          rel="noreferrer"
          style={{ padding: 16, display: "grid", gap: 10, justifyItems: "start" }}
        >
          <div style={{ fontWeight: 800, fontSize: 18 }}>QR Contact</div>
          <div className="section-copy">QR 코드를 스캔하면 GitHub 프로필로 이동합니다.</div>
          <Image src="/contact-github-qr.png" alt="GitHub QR Code" width={140} height={140} />
        </a>
      </section>
    </div>
  );
}
