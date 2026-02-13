'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Telescope, Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'

export default function ResetPasswordPage() {
    const supabase = createClient()
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [isValidSession, setIsValidSession] = useState(false)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setIsValidSession(!!session)
            setChecking(false)
        }
        checkSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsValidSession(true)
                setChecking(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setIsLoading(true)

        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            setSuccess(true)
            setTimeout(() => {
                router.push('/dashboard')
            }, 2000)
        } catch (err: any) {
            setError(err.message || 'Failed to reset password')
        } finally {
            setIsLoading(false)
        }
    }

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="cosmic-bg" />
                <Loader2 className="w-8 h-8 text-primary-200 animate-spin relative z-10" />
            </div>
        )
    }

    if (!isValidSession) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="cosmic-bg" />
                <div className="w-full max-w-md relative z-10">
                    <div className="glass-effect rounded-3xl p-8 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-danger-100/20 flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10 text-danger-100" />
                        </div>
                        <h2 className="text-2xl font-black mb-3">Invalid or Expired Link</h2>
                        <p className="text-surface-400 mb-8">
                            This password reset link is invalid or has expired. Please request a new one.
                        </p>
                        <Link
                            href="/forgot-password"
                            className="inline-block px-6 py-3 bg-gradient-to-r from-primary-200 to-danger-100 text-white font-bold rounded-xl"
                        >
                            Request New Link
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="cosmic-bg" />
                <div className="w-full max-w-md relative z-10">
                    <div className="glass-effect rounded-3xl p-8 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-success-100/20 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-success-100" />
                        </div>
                        <h2 className="text-2xl font-black mb-3">Password Reset!</h2>
                        <p className="text-surface-400">
                            Your password has been successfully reset. Redirecting to dashboard...
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="cosmic-bg" />
            
            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3 group">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-200 via-danger-100 to-secondary-200 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-[0_0_30px_rgba(125,73,248,0.5)]">
                                <Telescope className="w-7 h-7 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1">
                                <Sparkles className="w-4 h-4 text-warning-100 animate-pulse" />
                            </div>
                        </div>
                        <div>
                            <span className="font-black text-2xl text-surface-50 block">SkyGuild</span>
                            <span className="text-xs font-bold text-surface-400 uppercase tracking-widest">Look up. Stay curious.</span>
                        </div>
                    </Link>
                </div>

                {/* Form Card */}
                <div className="glass-effect rounded-3xl p-8">
                    <h1 className="text-2xl font-black mb-2">Create New Password</h1>
                    <p className="text-surface-400 mb-8">
                        Enter your new password below.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-xl bg-danger-100/10 border border-danger-100/20 text-danger-100 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-surface-300 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-4 glass-input rounded-xl text-surface-50 placeholder-surface-500 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-surface-300 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-4 glass-input rounded-xl text-surface-50 placeholder-surface-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-primary-200 to-danger-100 hover:from-primary-300 hover:to-danger-200 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
