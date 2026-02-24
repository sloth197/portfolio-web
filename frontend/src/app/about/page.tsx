export default function AboutPage() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="surface-card top-banner top-banner-about" style={{ padding: "22px clamp(18px, 4vw, 30px)", display: "grid", gap: 10 }}>
        <span className="badge">About</span>
        <h1 className="section-title">About This Portfolio</h1>
        <p className="section-copy">
          Firmware and software work, project details, and development notes are organized here.
        </p>
      </section>
    </div>
  );
}
