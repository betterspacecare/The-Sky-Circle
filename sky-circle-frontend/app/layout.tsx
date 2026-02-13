import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkyGuild | Astronomy Community",
  description: "Join the cosmic journey. Log observations, earn badges, and explore the universe with fellow stargazers.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* Background layer for stars and nebula - sits behind content for backdrop-filter */}
        <div className="cosmic-bg" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
