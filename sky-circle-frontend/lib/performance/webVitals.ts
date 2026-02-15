import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals'

// Send metrics to analytics
function sendToAnalytics(metric: Metric) {
  // Send to Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    })
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value)
  }
}

export function reportWebVitals() {
  try {
    onCLS(sendToAnalytics)
    onINP(sendToAnalytics) // INP (Interaction to Next Paint) replaces FID
    onFCP(sendToAnalytics)
    onLCP(sendToAnalytics)
    onTTFB(sendToAnalytics)
  } catch (err) {
    console.error('Error reporting web vitals:', err)
  }
}
