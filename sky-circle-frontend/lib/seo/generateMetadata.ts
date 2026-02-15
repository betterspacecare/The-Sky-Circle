import { Metadata } from 'next'

interface GenerateMetadataProps {
  title: string
  description: string
  path?: string
  image?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
  tags?: string[]
}

export function generateMetadata({
  title,
  description,
  path = '',
  image = '/og-image.jpg',
  type = 'website',
  publishedTime,
  modifiedTime,
  authors,
  tags,
}: GenerateMetadataProps): Metadata {
  const baseUrl = 'https://theskycircle.com'
  const url = `${baseUrl}${path}`
  const imageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`

  return {
    title,
    description,
    keywords: tags,
    authors: authors?.map(name => ({ name })),
    openGraph: {
      title,
      description,
      url,
      siteName: 'SkyGuild',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type,
      publishedTime,
      modifiedTime,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@skyguild',
    },
    alternates: {
      canonical: url,
    },
  }
}

// Helper for blog posts
export function generateBlogMetadata({
  title,
  description,
  slug,
  image,
  publishedTime,
  modifiedTime,
  author,
  tags,
}: {
  title: string
  description: string
  slug: string
  image?: string
  publishedTime: string
  modifiedTime?: string
  author: string
  tags: string[]
}): Metadata {
  return generateMetadata({
    title: `${title} | SkyGuild Blog`,
    description,
    path: `/blog/${slug}`,
    image: image || '/og-blog.jpg',
    type: 'article',
    publishedTime,
    modifiedTime,
    authors: [author],
    tags,
  })
}

// Helper for event pages
export function generateEventMetadata({
  title,
  description,
  eventId,
  image,
  startDate,
}: {
  title: string
  description: string
  eventId: string
  image?: string
  startDate: string
}): Metadata {
  return generateMetadata({
    title: `${title} | SkyGuild Events`,
    description,
    path: `/dashboard/events/${eventId}`,
    image: image || '/og-event.jpg',
    publishedTime: startDate,
  })
}
