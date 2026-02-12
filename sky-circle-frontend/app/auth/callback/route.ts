import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const supabase = await createClient()
        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (session?.user && !error) {
            // Check if user profile exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('id', session.user.id)
                .single()

            // Create user profile if it doesn't exist
            if (!existingUser) {
                await supabase.from('users').insert({
                    id: session.user.id,
                    email: session.user.email!,
                    referral_code: generateReferralCode(),
                    display_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || null,
                    profile_photo_url: session.user.user_metadata?.avatar_url || null,
                })
                
                // Redirect to profile setup for new users
                return NextResponse.redirect(new URL('/setup-profile', request.url))
            }
        }
    }

    return NextResponse.redirect(new URL('/dashboard', request.url))
}
