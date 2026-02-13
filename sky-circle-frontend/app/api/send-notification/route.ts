import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY

interface NotificationPayload {
  user_id?: string
  user_ids?: string[]
  type: 'sky_alert' | 'event_reminder' | 'badge_earned' | 'mission_complete' | 'system'
  title: string
  message: string
  data?: Record<string, any>
  send_email?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const payload: NotificationPayload = await request.json()
    const supabase = await createClient()

    // Get target users
    let userIds: string[] = []
    if (payload.user_id) {
      userIds = [payload.user_id]
    } else if (payload.user_ids) {
      userIds = payload.user_ids
    } else {
      // Send to all users
      const { data: users } = await supabase.from('users').select('id')
      userIds = users?.map(u => u.id) || []
    }

    // Create in-app notifications
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data || {},
      is_read: false
    }))

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (notifError) {
      console.error('Error creating notifications:', notifError)
    }

    // Send emails if enabled
    if (payload.send_email && RESEND_API_KEY) {
      // Get users with email notifications enabled
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('user_id')
        .in('user_id', userIds)
        .eq('email_enabled', true)

      const emailUserIds = prefs?.map(p => p.user_id) || userIds

      // Get user emails
      const { data: users } = await supabase
        .from('users')
        .select('id, email, display_name')
        .in('id', emailUserIds)

      // Send emails
      for (const user of users || []) {
        if (user.email) {
          await sendEmail(user.email, payload.title, payload.message, user.display_name)
        }
      }
    }

    return NextResponse.json({ success: true, notified: userIds.length })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function sendEmail(to: string, title: string, message: string, userName?: string) {
  if (!RESEND_API_KEY) return

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Sky Circle <onboarding@resend.dev>',
        to: to,
        subject: title.replace(/[🌟🏆💬❤️📅🎯]/g, '').trim(),
        html: generateEmailHtml(title, message, userName)
      })
    })

    const result = await response.json()
    console.log('Email sent:', result)
    return result
  } catch (error) {
    console.error('Email send error:', error)
  }
}

function generateEmailHtml(title: string, message: string, userName?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a1a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">🔭 The Sky Circle</h1>
            </td>
          </tr>
          <tr>
            <td style="background: linear-gradient(135deg, rgba(125, 73, 248, 0.15), rgba(241, 24, 86, 0.1)); border-radius: 24px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
              <h2 style="margin: 0 0 16px 0; color: #ffffff; font-size: 22px; text-align: center;">
                ${title.replace(/[🌟🏆💬❤️📅🎯👥🔔]/g, '').trim()}
              </h2>
              ${userName ? `<p style="margin: 0 0 20px 0; color: rgba(255,255,255,0.6); font-size: 16px; text-align: center;">Hi ${userName},</p>` : ''}
              <p style="margin: 0 0 32px 0; color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; text-align: center;">
                ${message}
              </p>
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="https://skycircle.app/dashboard/alerts" style="display: inline-block; background: linear-gradient(135deg, #7d49f8, #f11856); color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700;">
                      View in App
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0; color: rgba(255,255,255,0.4); font-size: 12px;">
                You received this because you have notifications enabled.
                <a href="https://skycircle.app/dashboard/alerts?tab=settings" style="color: #7d49f8;">Manage preferences</a>
              </p>
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
