import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/v1/actions/alerts
 * Create a new sky alert (Zapier/Make action)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!apiKey || apiKey !== process.env.ZAPIER_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing API key', code: 'AUTH_ERROR' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { title, message, alert_type } = body

    // Validate required fields
    if (!title || !message || !alert_type) {
      return NextResponse.json(
        { 
          error: 'Bad Request', 
          message: 'Missing required fields: title, message, alert_type', 
          code: 'VALIDATION_ERROR' 
        },
        { status: 400 }
      )
    }

    // Validate alert_type
    const validTypes = ['text', 'object_visibility', 'meteor_shower', 'special_event']
    if (!validTypes.includes(alert_type)) {
      return NextResponse.json(
        { 
          error: 'Bad Request', 
          message: `Invalid alert_type. Must be one of: ${validTypes.join(', ')}`, 
          code: 'VALIDATION_ERROR' 
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Create alert
    const { data: alert, error } = await supabase
      .from('sky_alerts')
      .insert({
        title,
        message,
        alert_type,
        created_by: null // API-created alerts have no specific creator
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Internal Server Error', message: error.message, code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: alert
    }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
