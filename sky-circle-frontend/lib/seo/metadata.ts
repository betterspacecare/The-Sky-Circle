import { Metadata } from 'next'

const baseUrl = 'https://www.skyguild.club'

export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "SkyGuild - Astronomy Community & Stargazing Platform",
    template: "%s | SkyGuild"
  },
  description: "Join SkyGuild, the ultimate astronomy community platform. Log celestial observations, earn badges, complete missions, attend events, and connect with fellow stargazers worldwide.",
}

export const pageMetadata = {
  home: {
    title: "SkyGuild - Astronomy Community & Stargazing Platform",
    description: "Join SkyGuild, the ultimate astronomy community. Log celestial observations, earn badges, complete missions, attend events, and connect with fellow stargazers worldwide.",
    openGraph: {
      title: "SkyGuild - Astronomy Community & Stargazing Platform",
      description: "Join SkyGuild, the ultimate astronomy community. Log observations, earn badges, and explore the cosmos with fellow stargazers.",
      url: baseUrl,
      siteName: "SkyGuild",
      images: [
        {
          url: `${baseUrl}/og-image.svg`,
          width: 1200,
          height: 630,
          alt: "SkyGuild - Astronomy Community Platform",
        },
      ],
      type: "website",
    },
  },
  about: {
    title: "About SkyGuild - Our Mission & Vision",
    description: "Learn about SkyGuild's mission to build a global community of stargazers and make astronomy accessible to everyone. Based in Naya Raipur, India.",
    openGraph: {
      title: "About SkyGuild - Our Mission & Vision",
      description: "Learn about SkyGuild's mission to build a global community of stargazers and make astronomy accessible to everyone.",
      url: `${baseUrl}/about`,
      images: [
        {
          url: `${baseUrl}/og-image.svg`,
          width: 1200,
          height: 630,
          alt: "About SkyGuild",
        },
      ],
    },
  },
  login: {
    title: "Login to SkyGuild",
    description: "Sign in to your SkyGuild account to access your observations, badges, missions, and connect with the astronomy community.",
    openGraph: {
      title: "Login to SkyGuild",
      description: "Sign in to your SkyGuild account to access your observations and connect with the astronomy community.",
      url: `${baseUrl}/login`,
    },
  },
  signup: {
    title: "Join SkyGuild - Create Free Account",
    description: "Create your free SkyGuild account and start your astronomy journey. Log observations, earn badges, complete missions, and connect with stargazers worldwide.",
    openGraph: {
      title: "Join SkyGuild - Create Free Account",
      description: "Create your free SkyGuild account and start your astronomy journey today.",
      url: `${baseUrl}/signup`,
    },
  },
  terms: {
    title: "Terms of Service",
    description: "Read SkyGuild's terms of service and user agreement.",
    openGraph: {
      title: "Terms of Service - SkyGuild",
      url: `${baseUrl}/terms`,
    },
  },
  privacy: {
    title: "Privacy Policy",
    description: "Learn how SkyGuild protects your privacy and handles your data.",
    openGraph: {
      title: "Privacy Policy - SkyGuild",
      url: `${baseUrl}/privacy`,
    },
  },
  cancellation: {
    title: "Cancellation Policy",
    description: "Read SkyGuild's cancellation and refund policy.",
    openGraph: {
      title: "Cancellation Policy - SkyGuild",
      url: `${baseUrl}/cancellation`,
    },
  },
}
