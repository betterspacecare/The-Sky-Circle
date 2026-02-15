# Generate Open Graph Images

## Required Images

### 1. Main OG Image (`/public/og-image.jpg`)
- **Size**: 1200x630px
- **Format**: JPG or PNG
- **Content**: SkyGuild logo, tagline "Look up. Stay curious.", space background
- **Text**: Large, readable, high contrast

### 2. About Page OG Image (`/public/og-about.jpg`)
- **Size**: 1200x630px
- **Content**: "About SkyGuild", mission statement snippet
- **Style**: Professional, cosmic theme

### 3. FAQ Page OG Image (`/public/og-faq.jpg`)
- **Size**: 1200x630px
- **Content**: "Frequently Asked Questions", question mark icon
- **Style**: Helpful, inviting

## Design Guidelines

### Colors
- Background: Dark space theme (#0a0e17)
- Primary: Purple (#7d49f8)
- Secondary: Pink (#f11856)
- Accent: Blue (#00d4ff)

### Typography
- Font: Bold, sans-serif (Inter, Poppins, or similar)
- Title: 60-80px
- Subtitle: 30-40px
- Ensure text is readable at small sizes

### Layout
- Keep important content in center 1200x600px (safe zone)
- Avoid text near edges (may be cropped on some platforms)
- Use high contrast for readability
- Include SkyGuild logo

## Tools to Create OG Images

### Online Tools (Easy)
1. **Canva** (https://canva.com)
   - Use "Facebook Post" template (1200x630)
   - Free templates available
   - Easy drag-and-drop

2. **Figma** (https://figma.com)
   - Professional design tool
   - Free for personal use
   - Great for custom designs

3. **Placid** (https://placid.app)
   - Automated OG image generation
   - Template-based

### Programmatic (Advanced)
1. **@vercel/og** - Generate images at runtime
2. **Puppeteer** - Screenshot HTML
3. **Sharp** - Node.js image processing

## Quick Setup with Vercel OG

Install package:
```bash
npm install @vercel/og
```

Create API route at `app/api/og/route.tsx`:
```tsx
import { ImageResponse } from '@vercel/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'SkyGuild'

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom, #0a0e17, #1a1e2e)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter',
        }}
      >
        <h1 style={{ fontSize: 80, color: '#fff' }}>{title}</h1>
        <p style={{ fontSize: 40, color: '#7d49f8' }}>Look up. Stay curious.</p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
```

## PWA Icons

### Required Sizes
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

### Tools
1. **RealFaviconGenerator** (https://realfavicongenerator.net)
   - Upload one image
   - Generates all sizes
   - Free

2. **Favicon.io** (https://favicon.io)
   - Simple favicon generator
   - Multiple formats

3. **PWA Asset Generator** (https://github.com/elegantapp/pwa-asset-generator)
   ```bash
   npx pwa-asset-generator logo.svg ./public/icons
   ```

## Favicon

### Create favicon.ico
- **Size**: 32x32 or 16x16
- **Format**: ICO
- **Location**: `/public/favicon.ico`

### Apple Touch Icon
- **Size**: 180x180
- **Format**: PNG
- **Location**: `/public/apple-touch-icon.png`

## Testing

After creating images, test them:

1. **Facebook Debugger**: https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
3. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/
4. **Open Graph Check**: https://www.opengraph.xyz/

## Checklist

- [ ] Create main OG image (1200x630)
- [ ] Create about page OG image
- [ ] Create FAQ page OG image
- [ ] Generate all PWA icon sizes
- [ ] Create favicon.ico
- [ ] Create apple-touch-icon.png
- [ ] Test on Facebook Debugger
- [ ] Test on Twitter Card Validator
- [ ] Verify images load correctly
- [ ] Check mobile appearance
