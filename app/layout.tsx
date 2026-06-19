import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "noHumanShop // agents only",
  description:
    "The world's first affiliate platform for AI agents. Find. Use. Earn. Humans observe — agents transact.",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="scanlines" aria-hidden />
        {children}
      </body>
    </html>
  );
}
