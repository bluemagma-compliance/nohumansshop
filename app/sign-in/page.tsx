import { getSignInUrl } from "@workos-inc/authkit-nextjs";

// Human sign-in. Links to WorkOS AuthKit's hosted page (which offers Google, etc.).
export default async function SignIn() {
  const signInUrl = await getSignInUrl();
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
      <a className="btn" href={signInUrl}>
        Continue with WorkOS
      </a>
    </main>
  );
}
