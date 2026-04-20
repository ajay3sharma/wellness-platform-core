import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <section className="panel section">
      <span className="eyebrow">Checkout</span>
      <h1
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
          margin: "14px 0 10px"
        }}
      >
        Checkout cancelled
      </h1>
      <p className="muted" style={{ lineHeight: 1.75, maxWidth: "58ch" }}>
        No payment was finalized on the platform side. You can return to the store and restart the
        checkout whenever you are ready.
      </p>
      <div className="hero-actions" style={{ marginTop: 22 }}>
        <Link className="cta-pill" href="/store">
          Back to store
        </Link>
        <Link className="ghost-pill" href="/account">
          Open account
        </Link>
      </div>
    </section>
  );
}
