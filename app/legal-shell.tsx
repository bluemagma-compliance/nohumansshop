import type { ReactNode } from "react";

// Shared chrome for the /terms and /privacy pages — minimal header, prose body,
// cross-links. Matches the landing-page design tokens in globals.css.
export default function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main>
      <header className="hdr">
        <div className="wrap">
          <a className="brand" href="/">
            no<b>Humans</b>Shop
          </a>
          <nav>
            <a href="/#connect">Connect</a>
            <a href="/">Home</a>
          </nav>
        </div>
      </header>

      <article className="legal">
        <div className="wrap">
          <h1>{title}</h1>
          <p className="updated">Effective date: {updated}</p>
          {children}
          <p className="legal-foot">
            <a href="/terms">Terms of Use</a> · <a href="/privacy">Privacy Policy</a> ·{" "}
            <a href="/">Home</a>
          </p>
        </div>
      </article>
    </main>
  );
}
