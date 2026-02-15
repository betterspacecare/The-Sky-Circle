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
    const next = requestUrl.searchParams.get('next') || '/dashboard'
    const type = requestUrl.searchParams.get('type')
    const isLinking = requestUrl.searchParams.get('link') === 'true'
    
    // Get all params for debugging
    const allParams = Object.fromEntries(requestUrl.searchParams.entries())
    console.log('Auth callback - All params:', allParams)
    console.log('Auth callback - Parsed:', { code: !!code, type, isLinking })

    if (code) {
        const supabase = await createClient()
        
        try {
            const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
            
            if (error) {
                console.error('Auth callback error:', error)
                
                // Handle specific errors
                if (error.message?.includes('already registered') || error.message?.includes('Email already exists')) {
                    return NextResponse.redirect(
                        new URL('/login?error=email_exists&message=' + encodeURIComponent('This email is already registered. Please sign in with your email and password.'), request.url)
                    )
                }
                
                return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
            }
            
            if (session?.user) {
                console.log('Session user identities:', session.user.identities?.map(i => ({ provider: i.provider, id: i.id })))
                
                // CRITICAL: Check for account linking FIRST, before ANY other checks
                // The 'link' parameter is explicitly set by our AccountLinking component
                if (isLinking) {
                    console.log('✅ Account linking flow detected - redirecting to profile')
                    return NextResponse.redirect(new URL('/dashboard/profile?linked=success', request.url))
                }

                // If this is a password recovery flow, redirect to reset password page
                // Only check this if it's NOT a linking flow
                if (type === 'recovery') {
                    console.log('🔑 Password recovery flow - redirecting to reset-password')
                    return NextResponse.redirect(new URL(`/reset-password`, request.url))
                }
                
                // Check if user profile exists
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('id', session.user.id)
                    .single()

                // Create user profile if it doesn't exist (new OAuth user)
                if (!existingUser) {
                    console.log('New user, creating profile')
                    const { error: insertError } = await supabase.from('users').insert({
                        id: session.user.id,
                        email: session.user.email!,
                        referral_code: generateReferralCode(),
                        display_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || null,
                        profile_photo_url: session.user.user_metadata?.avatar_url || null,
                    })
                    
                    if (insertError) {
                        console.error('Profile creation error:', insertError)
                    }
                    
                    // Redirect to profile setup for new users
                    return NextResponse.redirect(new URL('/setup-profile', request.url))
                }
                
                // Existing user - redirect to dashboard
                console.log('Existing user, redirecting to dashboard')
                return NextResponse.redirect(new URL(next, request.url))
            }
        } catch (err) {
            console.error('Unexpected error in auth callback:', err)
            return NextResponse.redirect(new URL('/login?error=unexpected', request.url))
        }
    }

    // No code provided - redirect to login
    console.log('No code provided, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
}
