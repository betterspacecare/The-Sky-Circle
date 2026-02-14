import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2, Sparkles, Mail, ArrowLeft, CheckCircle } from 'lucide-react'

interface ForgotPasswordPageProps {
    onBack: () => void
}

// Generate random stars
function generateStars(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        size: Math.random() * 2 + 1
    }))
}

export function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')
    const [stars] = useState(() => generateStars(100))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })

            if (error) throw error
            setSent(true)
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen nebula-bg flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Stars */}
            <div className="fixed inset-0 pointer-events-none">
                {stars.map(star => (
                    <div
                        key={star.id}
                        className="star"
                        style={{
                            left: `${star.left}%`,
                            top: `${star.top}%`,
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            animationDelay: `${star.delay}s`
                        }}
                    />
                ))}
            </div>

            {/* Nebula Glow Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center mb-4 relative">
                        <Sparkles className="w-16 h-16 text-purple-400" />
                        <div className="absolute inset-0 blur-2xl bg-purple-500/40" />
                    </div>
                    <h1 className="text-4xl font-black text-gradient mb-2">SkyGuild</h1>
                    <p className="text-white/40 font-bold tracking-widest text-xs uppercase">Admin Control Center</p>
                </div>

                {/* Card */}
                <div className="glass-card rounded-3xl p-8">
                    {sent ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                            <p className="text-white/50 mb-6">
                                We've sent a password reset link to <span className="text-purple-400">{email}</span>
                            </p>
                            <button
                                onClick={onBack}
                                className="w-full py-3 btn-cosmic rounded-xl font-bold text-white"
                            >
                                Return to Login
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to login
                            </button>

                            <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                            <p className="text-white/40 mb-6">Enter your email to receive a reset link</p>

                            {error && (
                                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 glass-input rounded-xl text-white placeholder-white/30"
                                            placeholder="admin@skyguild.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 btn-cosmic rounded-xl font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
