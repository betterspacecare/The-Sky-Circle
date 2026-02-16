'use server'

import { triggerWebhooks, type WebhookEvent } from '@/lib/webhooks/trigger'

/**
 * Server action to trigger webhooks
 * Can be called from any component
 */
export async function triggerWebhookAction(event: WebhookEvent, data: any) {
  await triggerWebhooks(event, data)
}
