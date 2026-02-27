import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                domain: '.skyguild.club',
                path: '/',
                sameSite: 'lax',
                secure: true,
            },
            cookies: {
                // Use shared storage key across all skyguild.club subdomains
                name: 'skyguild-auth',
            },
        }
    )
}
