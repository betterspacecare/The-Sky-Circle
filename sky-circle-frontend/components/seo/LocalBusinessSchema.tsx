export default function LocalBusinessSchema() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SkyGuild",
    "url": "https://theskycircle.com",
    "logo": "https://theskycircle.com/logo.png",
    "description": "SkyGuild is building the largest community of amateur astronomers and space enthusiasts on the planet.",
    "foundingDate": "2024",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Naya Raipur",
      "addressRegion": "Chhattisgarh",
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "hello@theskycircle.com",
      "contactType": "Customer Support",
      "availableLanguage": ["English"]
    },
    "sameAs": [
      "https://twitter.com/skyguild",
      "https://instagram.com/skyguild",
      "https://youtube.com/@skyguild",
      "https://facebook.com/skyguild"
    ],
    "founder": {
      "@type": "Person",
      "name": "SkyGuild Founder"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
