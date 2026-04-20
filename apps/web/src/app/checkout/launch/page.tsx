"use client";

import { createApiClient } from "@platform/sdk";
import type { ApiError, CheckoutSession } from "@platform/types";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

export default function CheckoutLaunchPage() {
  return (
    <Suspense fallback={<CheckoutLaunchState />}>
      <CheckoutLaunchClient />
    </Suspense>
  );
}

function CheckoutLaunchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const api = useMemo(() => createApiClient(), []);
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkoutSessionId = searchParams.get("checkoutSessionId");
    const token = searchParams.get("token");

    if (!checkoutSessionId || !token) {
      setError("Missing checkout session parameters.");
      return;
    }

    void (async () => {
      try {
        const nextSession = await api.store.checkoutLaunch(checkoutSessionId, token);
        setSession(nextSession);
      } catch (unknownError) {
        setError((unknownError as ApiError).message || "Unable to load the checkout session.");
      }
    })();
  }, [api, searchParams]);

  useEffect(() => {
    if (!session) {
      return;
    }

    if (session.provider === "stripe" && session.providerCheckoutUrl) {
      globalThis.window.location.replace(session.providerCheckoutUrl);
      return;
    }

    if (session.provider === "razorpay" && session.razorpay) {
      void launchRazorpay(session, router).catch((unknownError) => {
        setError(
          unknownError instanceof Error
            ? unknownError.message
            : "Unable to open the Razorpay checkout."
        );
      });
    }
  }, [router, session]);

  return <CheckoutLaunchState error={error} session={session} />;
}

function CheckoutLaunchState({
  error,
  session
}: {
  error?: string | null;
  session?: CheckoutSession | null;
}) {
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
        Preparing your checkout
      </h1>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        {error
          ? error
          : session
            ? `Opening ${session.provider} for your ${session.kind} checkout.`
            : "Loading the provider handoff..."}
      </p>
    </section>
  );
}

async function launchRazorpay(session: CheckoutSession, router: ReturnType<typeof useRouter>) {
  if (!session.razorpay) {
    return;
  }

  await loadRazorpayScript();

  if (!globalThis.window.Razorpay) {
    throw new Error("Razorpay Checkout failed to load.");
  }

  const instance = new globalThis.window.Razorpay({
    key: session.razorpay.keyId,
    amount: session.amountMinor,
    currency: session.currency,
    name: session.razorpay.name,
    description: session.razorpay.description,
    order_id: session.razorpay.orderId ?? undefined,
    subscription_id: session.razorpay.subscriptionId ?? undefined,
    prefill: session.razorpay.prefill,
    handler: () => {
      globalThis.window.location.assign(session.razorpay!.callbackUrls.success);
    },
    modal: {
      ondismiss: () => {
        globalThis.window.location.assign(session.razorpay!.callbackUrls.cancel);
      }
    },
    theme: {
      color: "#6f9389"
    }
  });

  instance.open();
  router.refresh();
}

async function loadRazorpayScript() {
  const existing = globalThis.document.querySelector(
    'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
  );

  if (existing) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = globalThis.document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
    globalThis.document.body.appendChild(script);
  });
}
