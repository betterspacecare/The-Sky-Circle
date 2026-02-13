// Supabase Edge Function for sending email notifications
// Deploy: supabase functions deploy send-notification --no-verify-jwt
// 
// Set secrets in Supabase Dashboard > Edge Functions > Secrets:
// - RESEND_API_KEY: Your Resend API key (get from resend.com)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: {
    id: string
    user_id: string
    type: string
    title: string
    message: string
    data: Record<string, any>
  }
  old_record: any
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const payload: NotificationPayload = await req.json()
    
    // Only process INSERT events on notifications table
    if (payload.type !== 'INSERT' || payload.table !== 'notifications') {
      return new Response(JSON.stringify({ message: 'Ignored' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const notification = payload.record
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get user details and preferences
    const { data: user } = await supabase
      .from('users')
      .select('email, display_name')
      .eq('id', notification.user_id)
      .single()

    if (!user?.email) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check notification preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', notification.user_id)
      .single()

    // Check if email is enabled for this notification type
    const shouldSendEmail = prefs?.email_enabled && shouldNotifyByType(notification.type, prefs)

    if (!shouldSendEmail) {
      return new Response(JSON.stringify({ message: 'Email disabled for this type' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Send email via Resend
    if (RESEND_API_KEY) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Sky Circle <notifications@skycircle.app>',
          to: user.email,
          subject: notification.title.replace(/[🌟🏆💬❤️📅🎯]/g, '').trim(),
          html: generateEmailHtml(notification, user.display_name)
        })
      })

      const emailResult = await emailResponse.json()
      console.log('Email sent:', emailResult)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function shouldNotifyByType(type: string, prefs: any): boolean {
  switch (type) {
    case 'sky_alert': return prefs.sky_alerts
    case 'event_reminder': return prefs.event_reminders
    case 'badge_earned': return prefs.badge_notifications
    case 'mission_complete': return prefs.mission_notifications
    case 'comment':
    case 'like':
    case 'follow': return prefs.social_notifications
    default: return true
  }
}

function generateEmailHtml(notification: any, userName?: string): string {
  const iconMap: Record<string, string> = {
    'sky_alert': '🌟',
    'event_reminder': '📅',
    'badge_earned': '🏆',
    'mission_complete': '🎯',
    'comment': '💬',
    'like': '❤️',
    'follow': '👥',
    'system': '🔔'
  }

  const icon = iconMap[notification.type] || '🔔'
  const actionUrl = getActionUrl(notification)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a1a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 32px; padding-right: 12px;">🔭</td>
                  <td>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800;">The Sky Circle</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background: linear-gradient(135deg, rgba(125, 73, 248, 0.15), rgba(241, 24, 86, 0.1)); border-radius: 24px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
              <!-- Icon -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="width: 64px; height: 64px; background: rgba(125, 73, 248, 0.2); border-radius: 16px; line-height: 64px; font-size: 32px; text-align: center;">
                      ${icon}
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Title -->
              <h2 style="margin: 0 0 16px 0; color: #ffffff; font-size: 22px; font-weight: 700; text-align: center;">
                ${notification.title.replace(/[🌟🏆💬❤️📅🎯👥🔔]/g, '').trim()}
              </h2>
              
              <!-- Greeting -->
              ${userName ? `<p style="margin: 0 0 20px 0; color: rgba(255,255,255,0.6); font-size: 16px; text-align: center;">Hi ${userName},</p>` : ''}
              
              <!-- Message -->
              <p style="margin: 0 0 32px 0; color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; text-align: center;">
                ${notification.message}
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${actionUrl}" style="display: inline-block; background: linear-gradient(135deg, #7d49f8, #f11856); color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px;">
                      View in App
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.4); font-size: 12px;">
                You received this email because you have notifications enabled.
              </p>
              <a href="https://skycircle.app/dashboard/alerts?tab=settings" style="color: #7d49f8; font-size: 12px; text-decoration: none;">
                Manage notification preferences
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

function getActionUrl(notification: any): string {
  const baseUrl = 'https://skycircle.app'
  const data = notification.data || {}

  switch (notification.type) {
    case 'sky_alert':
      return `${baseUrl}/dashboard/alerts`
    case 'event_reminder':
      return data.event_id ? `${baseUrl}/dashboard/events/${data.event_id}` : `${baseUrl}/dashboard/events`
    case 'badge_earned':
      return `${baseUrl}/dashboard/profile`
    case 'mission_complete':
      return `${baseUrl}/dashboard/missions`
    case 'comment':
    case 'like':
      return data.post_id ? `${baseUrl}/dashboard/community` : `${baseUrl}/dashboard/community`
    default:
      return `${baseUrl}/dashboard/alerts`
  }
}
