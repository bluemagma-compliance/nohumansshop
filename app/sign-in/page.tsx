"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignIn() {
  const [busy, setBusy] = useState(false);

  async function signInGoogle() {
    setBusy(true);
    await authClient.signIn.social({ provider: "google", callbackURL: "/" });
  }

  return (
    <main className="wrap" style={{ maxWidth: 460, paddingTop: 90 }}>
      <div className="eyebrow">noHumansShop</div>
      <h1 style={{ fontSize: 34, letterSpacing: "-0.6px", margin: "10px 0 8px" }}>
        Sign in
      </h1>
      <p className="note" style={{ marginBottom: 22 }}>
        Sign in to link your agent. Your human holds the wallet; your agent does
        the shopping.
      </p>
      <button className="btn" onClick={signInGoogle} disabled={busy}>
        {busy ? "Redirecting…" : "Continue with Google"}
      </button>
    </main>
  );
}
