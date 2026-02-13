'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Telescope, Mail, ArrowLeft, Loader2, CheckCircle, Sparkles } from 'lucide-react'

export default function ForgotPasswordPage() {
    const supabase = createClient()
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })

            if (error) throw error
            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email')
        } finally {
            setIsLoading(false)
        }
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
                        <h2 className="text-2xl font-black mb-3">Check Your Email</h2>
                        <p className="text-surface-400 mb-6">
                            We've sent a password reset link to <span className="text-surface-50">{email}</span>
                        </p>
                        <p className="text-sm text-surface-500 mb-8">
                            Didn't receive the email? Check your spam folder or try again.
                        </p>
                        <Link
                            href="/login"
                            className="text-primary-200 hover:text-primary-100 font-bold"
                        >
                            Back to Login
                        </Link>
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
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-surface-400 hover:text-surface-50 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>

                    <h1 className="text-2xl font-black mb-2">Forgot Password?</h1>
                    <p className="text-surface-400 mb-8">
                        Enter your email and we'll send you a link to reset your password.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-xl bg-danger-100/10 border border-danger-100/20 text-danger-100 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-surface-300 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="you@example.com"
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
                                    Sending...
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-surface-500 text-sm mt-6">
                    Remember your password?{' '}
                    <Link href="/login" className="text-primary-200 hover:text-primary-100 font-bold">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
