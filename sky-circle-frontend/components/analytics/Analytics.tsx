'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Generic analytics wrapper that can work with multiple providers
export function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      // Track page view
      trackPageView(pathname)
    }
  }, [pathname, searchParams])

  return null
}

// Track page views
export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }
}

// Track custom events
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Track user signup
export function trackSignup(method: string) {
  trackEvent('sign_up', 'engagement', method)
}

// Track observation logged
export function trackObservation(objectType: string) {
  trackEvent('log_observation', 'engagement', objectType)
}

// Track badge earned
export function trackBadgeEarned(badgeName: string) {
  trackEvent('earn_badge', 'achievement', badgeName)
}

// Track event attendance
export function trackEventAttendance(eventName: string) {
  trackEvent('attend_event', 'engagement', eventName)
}
