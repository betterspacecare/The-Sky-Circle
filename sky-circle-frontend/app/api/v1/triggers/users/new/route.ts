import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/triggers/users/new
 * Zapier/Make polling trigger for new users
 */
export async function GET(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!apiKey || apiKey !== process.env.ZAPIER_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing API key', code: 'AUTH_ERROR' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const since = searchParams.get('since') || new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const limit = parseInt(searchParams.get('limit') || '100')

    const supabase = await createClient()

    // Fetch new users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, display_name, profile_photo_url, experience_level, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json(
        { error: 'Internal Server Error', message: error.message, code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: users || [],
      meta: {
        count: users?.length || 0,
        since,
        limit
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
