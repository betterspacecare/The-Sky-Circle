/**
 * Webhook Trigger System
 * Fires webhooks when events occur in the application
 */

import { createClient } from '@/lib/supabase/server'

export type WebhookEvent = 
  | 'user.created' | 'user.updated' | 'user.deleted'
  | 'observation.created' | 'observation.updated' | 'observation.deleted'
  | 'post.created' | 'post.reported' | 'post.deleted'
  | 'event.created' | 'event.updated' | 'event.rsvp'
  | 'mission.completed' | 'badge.earned'
  | 'follow.created' | 'follow.deleted'
  | 'comment.created' | 'like.created'
  | 'referral.completed'

interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: any
  user?: {
    id: string
    email: string
    display_name: string | null
    profile_photo_url: string | null
  }
}

/**
 * Fetch user details for webhook payload
 */
async function getUserDetails(userId: string) {
  try {
    const supabase = await createClient()
    const { data: user } = await supabase
      .from('users')
      .select('id, email, display_name, profile_photo_url')
      .eq('id', userId)
      .single()
    
    return user || null
  } catch (error) {
    console.error('Error fetching user details:', error)
    return null
  }
}

/**
 * Trigger webhooks for a specific event
 */
export async function triggerWebhooks(event: WebhookEvent, data: any) {
  try {
    const supabase = await createClient()
    
    // Get all active webhooks that listen to this event
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('is_active', true)
      .contains('events', [event])
    
    if (error || !webhooks || webhooks.length === 0) {
      return
    }

    // Fetch user details if user_id is present in data
    let userDetails = null
    if (data.user_id) {
      userDetails = await getUserDetails(data.user_id)
    }

    // Prepare payload with user details
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      ...(userDetails && { user: userDetails })
    }

    // Send to all matching webhooks
    const promises = webhooks.map(webhook => sendWebhook(webhook, payload))
    await Promise.allSettled(promises)
  } catch (error) {
    console.error('Error triggering webhooks:', error)
  }
}

/**
 * Send webhook to a specific URL
 */
async function sendWebhook(webhook: any, payload: WebhookPayload) {
  const startTime = Date.now()
  
  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(webhook.secret && { 'X-Webhook-Secret': webhook.secret })
      },
      body: JSON.stringify(payload)
    })

    const responseTime = Date.now() - startTime
    const responseBody = await response.text().catch(() => null)

    // Log the webhook call
    const supabase = await createClient()
    await supabase.from('webhook_logs').insert({
      webhook_id: webhook.id,
      event_type: payload.event,
      payload: payload,
      response_status: response.status,
      response_body: responseBody?.substring(0, 1000),
      error_message: response.ok ? null : `HTTP ${response.status}`,
      retry_count: 0
    })

    // Update webhook status
    if (response.ok) {
      await supabase.from('webhooks').update({
        last_success_at: new Date().toISOString(),
        last_triggered_at: new Date().toISOString(),
        status: 'active'
      }).eq('id', webhook.id)
    } else {
      await supabase.from('webhooks').update({
        last_triggered_at: new Date().toISOString(),
        last_error: `HTTP ${response.status}`,
        retry_count: webhook.retry_count + 1,
        status: webhook.retry_count + 1 >= 5 ? 'failed' : 'active'
      }).eq('id', webhook.id)
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Log the error
    const supabase = await createClient()
    await supabase.from('webhook_logs').insert({
      webhook_id: webhook.id,
      event_type: payload.event,
      payload: payload,
      response_status: null,
      response_body: null,
      error_message: errorMessage,
      retry_count: 0
    })

    // Update webhook status
    await supabase.from('webhooks').update({
      last_triggered_at: new Date().toISOString(),
      last_error: errorMessage,
      retry_count: webhook.retry_count + 1,
      status: webhook.retry_count + 1 >= 5 ? 'failed' : 'active'
    }).eq('id', webhook.id)
  }
}
