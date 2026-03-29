import Link from "next/link";

export default function NotFound() {
  return (
    <section className="panel section">
      <span className="eyebrow">404</span>
      <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: "clamp(2.4rem, 5vw, 4rem)", margin: "14px 0 10px" }}>
        This surface is still forming
      </h1>
      <p className="muted" style={{ lineHeight: 1.75, maxWidth: "60ch" }}>
        The route you asked for does not exist in this scaffold yet.
      </p>
      <div className="hero-actions" style={{ marginTop: "22px" }}>
        <Link className="cta-pill" href="/">
          Back home
        </Link>
      </div>
    </section>
  );
}
