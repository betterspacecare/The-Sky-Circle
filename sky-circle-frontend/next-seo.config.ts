export const SEO_CONFIG = {
  titleTemplate: '%s | SkyGuild',
  defaultTitle: 'SkyGuild - Astronomy Community & Stargazing Platform',
  description: 'Join SkyGuild, the ultimate astronomy community platform. Log celestial observations, earn badges, complete missions, attend events, and connect with fellow stargazers worldwide.',
  canonical: 'https://theskycircle.com',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://theskycircle.com',
    siteName: 'SkyGuild',
    title: 'SkyGuild - Astronomy Community & Stargazing Platform',
    description: 'Join SkyGuild, the ultimate astronomy community. Log observations, earn badges, complete missions, and explore the cosmos with fellow stargazers.',
    images: [
      {
        url: 'https://theskycircle.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SkyGuild - Astronomy Community Platform',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    handle: '@skyguild',
    site: '@skyguild',
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'keywords',
      content: 'astronomy, stargazing, astrophotography, celestial observations, astronomy community, space exploration, telescope, night sky, astronomy events, astronomy badges, amateur astronomy',
    },
    {
      name: 'author',
      content: 'SkyGuild',
    },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, maximum-scale=5',
    },
    {
      name: 'theme-color',
      content: '#0a0e17',
    },
    {
      name: 'apple-mobile-web-app-capable',
      content: 'yes',
    },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'black-translucent',
    },
  ],
  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-touch-icon.png',
      sizes: '180x180',
    },
    {
      rel: 'manifest',
      href: '/manifest.json',
    },
  ],
}

export default SEO_CONFIG
