interface Review {
  author: string
  rating: number
  date: string
  text: string
}

interface ReviewSchemaProps {
  reviews: Review[]
  aggregateRating: {
    ratingValue: number
    reviewCount: number
  }
}

export default function ReviewSchema({ reviews, aggregateRating }: ReviewSchemaProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "SkyGuild",
    "description": "Astronomy community platform for stargazers",
    "brand": {
      "@type": "Brand",
      "name": "SkyGuild"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": aggregateRating.ratingValue,
      "reviewCount": aggregateRating.reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": reviews.map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.author
      },
      "datePublished": review.date,
      "reviewBody": review.text,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": "5",
        "worstRating": "1"
      }
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
