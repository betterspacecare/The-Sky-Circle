import { createBrowserClient } from '@supabase/ssr'

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export const createClient = () => {
    if (supabaseInstance) return supabaseInstance

    supabaseInstance = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: true,
                storageKey: 'skyguild-auth',
                storage: typeof window !== 'undefined' ? window.localStorage : undefined,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            }
        }
    )

    // Handle auth errors globally - clear invalid sessions
    supabaseInstance.auth.onAuthStateChange((event, session) => {
        if (event === 'TOKEN_REFRESHED' && !session) {
            // Token refresh failed, clear storage
            if (typeof window !== 'undefined') {
                localStorage.removeItem('skyguild-auth')
            }
        }
    })

    return supabaseInstance
}

// Helper to clear invalid session
export const clearSession = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('skyguild-auth')
    }
    supabaseInstance = null
}
