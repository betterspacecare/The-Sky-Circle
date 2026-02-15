'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Link2, Mail, Loader2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'

interface LinkedAccount {
  provider: string
  email: string
  linked_at: string
}

export default function AccountLinking() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([])
  const [currentEmail, setCurrentEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchLinkedAccounts()
  }, [])

  const fetchLinkedAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setCurrentEmail(user.email || '')

      // Get all identities (linked accounts)
      const identities = user.identities || []
      const accounts: LinkedAccount[] = identities.map(identity => ({
        provider: identity.provider,
        email: identity.identity_data?.email || user.email || '',
        linked_at: identity.created_at || new Date().toISOString()
      }))

      setLinkedAccounts(accounts)
    } catch (err: any) {
      console.error('Error fetching linked accounts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLinkGoogle = async () => {
    setLinking(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if Google is already linked
      const hasGoogle = linkedAccounts.some(acc => acc.provider === 'google')
      if (hasGoogle) {
        setError('Google account is already linked')
        setLinking(false)
        return
      }

      console.log('🔗 Initiating Google account linking...')
      
      // Initiate OAuth flow with linking parameter
      // IMPORTANT: The link=true parameter is critical for the callback to know this is a linking flow
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?link=true`,
          queryParams: {
            // Add extra parameter to help distinguish from other flows
            access_type: 'online',
            prompt: 'select_account'
          }
        }
      })

      if (error) {
        console.error('❌ Link identity error:', error)
        throw error
      }

      console.log('✅ Redirecting to Google for account linking...')
      // User will be redirected to Google
      // After successful linking, they'll be redirected back to /auth/callback?link=true
    } catch (err: any) {
      console.error('Link error:', err)
      setError(err.message || 'Failed to link Google account')
      setLinking(false)
    }
  }

  const handleUnlinkGoogle = async () => {
    if (!confirm('Are you sure you want to unlink your Google account? You will need to use email/password to sign in.')) {
      return
    }

    setLinking(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Find Google identity
      const googleIdentity = user.identities?.find(i => i.provider === 'google')
      if (!googleIdentity) {
        throw new Error('Google account not found')
      }

      // Unlink identity
      const { error } = await supabase.auth.unlinkIdentity(googleIdentity)
      if (error) throw error

      setSuccess('Google account unlinked successfully')
      await fetchLinkedAccounts()
    } catch (err: any) {
      console.error('Unlink error:', err)
      setError(err.message || 'Failed to unlink Google account')
    } finally {
      setLinking(false)
    }
  }

  if (loading) {
    return (
      <div className="glass-effect rounded-2xl p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-cosmic-purple animate-spin" />
      </div>
    )
  }

  const hasEmail = linkedAccounts.some(acc => acc.provider === 'email')
  const hasGoogle = linkedAccounts.some(acc => acc.provider === 'google')

  return (
    <div className="glass-effect rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-5 h-5 text-cosmic-purple" />
        <h3 className="text-lg font-bold">Linked Accounts</h3>
      </div>

      <p className="text-sm text-white/60 mb-6">
        Link multiple sign-in methods to your account for easier access.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      <div className="space-y-3">
        {/* Email/Password Account */}
        <div className="glass-inner rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
              <Mail className="w-5 h-5 text-white/60" />
            </div>
            <div>
              <p className="font-medium text-sm">Email & Password</p>
              <p className="text-xs text-white/40">{currentEmail}</p>
            </div>
          </div>
          {hasEmail ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-medium">Linked</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-white/40">
              <XCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Not Set</span>
            </div>
          )}
        </div>

        {/* Google Account */}
        <div className="glass-inner rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm">Google</p>
              <p className="text-xs text-white/40">
                {hasGoogle ? 'Sign in with Google' : 'Not linked'}
              </p>
            </div>
          </div>
          {hasGoogle ? (
            <button
              onClick={handleUnlinkGoogle}
              disabled={linking || !hasEmail}
              className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title={!hasEmail ? 'You must have email/password set up before unlinking Google' : 'Unlink Google account'}
            >
              {linking ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Unlink'}
            </button>
          ) : (
            <button
              onClick={handleLinkGoogle}
              disabled={linking}
              className="px-3 py-1.5 bg-cosmic-purple/20 text-cosmic-purple rounded-lg text-xs font-medium hover:bg-cosmic-purple/30 transition-all disabled:opacity-50 flex items-center gap-1"
            >
              {linking ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Link'}
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 glass-inner rounded-lg">
        <p className="text-xs text-white/50 leading-relaxed">
          <strong className="text-white/70">Security Note:</strong> You can link multiple sign-in methods to your account. 
          We recommend keeping at least one method active at all times. You cannot unlink your only sign-in method.
        </p>
      </div>
    </div>
  )
}
