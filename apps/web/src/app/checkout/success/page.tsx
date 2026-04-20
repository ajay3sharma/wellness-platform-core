import Link from "next/link";

export default function CheckoutSuccessPage() {
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
        Payment submitted
      </h1>
      <p className="muted" style={{ lineHeight: 1.75, maxWidth: "58ch" }}>
        Your provider returned successfully. Order and subscription state are finalized by webhook,
        so the account view may show a short-lived pending state while confirmation arrives.
      </p>
      <div className="hero-actions" style={{ marginTop: 22 }}>
        <Link className="cta-pill" href="/account">
          Open account
        </Link>
        <Link className="ghost-pill" href="/store">
          Back to store
        </Link>
      </div>
    </section>
  );
}
