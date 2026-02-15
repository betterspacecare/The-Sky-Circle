import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { StarField } from "@/components/StarField";
import ToastContainer from "@/components/ui/ToastContainer";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { Analytics } from "@/components/analytics/Analytics";

export const metadata: Metadata = {
  metadataBase: new URL('https://theskycircle.com'),
  title: {
    default: "SkyGuild - Astronomy Community & Stargazing Platform",
    template: "%s | SkyGuild"
  },
  description: "Join SkyGuild, the ultimate astronomy community platform. Log celestial observations, earn badges, complete missions, attend events, and connect with fellow stargazers worldwide.",
  keywords: [
    "astronomy",
    "stargazing",
    "astrophotography",
    "celestial observations",
    "astronomy community",
    "space exploration",
    "telescope",
    "night sky",
    "astronomy events",
    "astronomy badges",
    "amateur astronomy",
    "sky watching",
    "constellation tracking",
    "astronomy missions"
  ],
  authors: [{ name: "SkyGuild" }],
  creator: "SkyGuild",
  publisher: "SkyGuild",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://theskycircle.com",
    siteName: "SkyGuild",
    title: "SkyGuild - Astronomy Community & Stargazing Platform",
    description: "Join SkyGuild, the ultimate astronomy community. Log observations, earn badges, complete missions, and explore the cosmos with fellow stargazers.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SkyGuild - Astronomy Community Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SkyGuild - Astronomy Community & Stargazing Platform",
    description: "Join SkyGuild, the ultimate astronomy community. Log observations, earn badges, and explore the cosmos with fellow stargazers.",
    images: ["/og-image.jpg"],
    creator: "@skyguild",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
  alternates: {
    canonical: "https://theskycircle.com",
  },
  category: "Science & Education",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0e17' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased">
        {/* Google Analytics */}
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''} />
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        
        {/* Background layer for stars and nebula - sits behind content for backdrop-filter */}
        <div className="cosmic-bg" aria-hidden="true" />
        <StarField starCount={120} showShootingStars={true} />
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
