interface EventSchemaProps {
  name: string
  description: string
  startDate: string
  endDate?: string
  location: {
    name: string
    address?: string
  }
  image?: string
  organizer?: string
}

export default function EventSchema({
  name,
  description,
  startDate,
  endDate,
  location,
  image,
  organizer = "SkyGuild"
}: EventSchemaProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": name,
    "description": description,
    "startDate": startDate,
    "endDate": endDate || startDate,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": location.name,
      "address": location.address ? {
        "@type": "PostalAddress",
        "streetAddress": location.address
      } : undefined
    },
    "image": image ? [image] : undefined,
    "organizer": {
      "@type": "Organization",
      "name": organizer,
      "url": "https://theskycircle.com"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://theskycircle.com/dashboard/events"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
