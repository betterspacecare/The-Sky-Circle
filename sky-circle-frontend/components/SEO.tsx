import Head from 'next/head'

interface SEOProps {
  title?: string
  description?: string
  canonical?: string
  ogImage?: string
  ogType?: string
  structuredData?: object
}

export default function SEO({
  title = "SkyGuild - Astronomy Community & Stargazing Platform",
  description = "Join SkyGuild, the ultimate astronomy community platform. Log celestial observations, earn badges, complete missions, and connect with fellow stargazers worldwide.",
  canonical,
  ogImage = "/og-image.jpg",
  ogType = "website",
  structuredData,
}: SEOProps) {
  const baseUrl = "https://theskycircle.com"
  const fullCanonical = canonical ? `${baseUrl}${canonical}` : baseUrl

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullCanonical} />
      
      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:image" content={`${baseUrl}${ogImage}`} />
      <meta property="og:site_name" content="SkyGuild" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${baseUrl}${ogImage}`} />
      <meta name="twitter:creator" content="@skyguild" />
      
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
    </Head>
  )
}
