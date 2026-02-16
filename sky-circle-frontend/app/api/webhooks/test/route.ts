import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// CORS headers for admin panel
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In production, set to your admin domain
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/**
 * OPTIONS /api/webhooks/test
 * Handle CORS preflight request
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * POST /api/webhooks/test
 * Server-side proxy for testing webhooks (avoids CORS issues)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, secret, webhookId, webhookName } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Create test payload
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from SkyGuild Admin',
        webhook_id: webhookId,
        webhook_name: webhookName
      }
    }

    // Send test request
    const startTime = Date.now()
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret && { 'X-Webhook-Secret': secret })
      },
      body: JSON.stringify(testPayload)
    })

    const responseTime = Date.now() - startTime
    const responseBody = await response.text().catch(() => null)

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseTime,
      responseBody: responseBody?.substring(0, 1000), // Limit response size
      error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test webhook'
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
