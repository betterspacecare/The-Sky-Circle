import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2, Sparkles, Lock, CheckCircle, AlertCircle } from 'lucide-react'

interface ResetPasswordPageProps {
    onComplete: () => void
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

export function ResetPasswordPage({ onComplete }: ResetPasswordPageProps) {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [stars] = useState(() => generateStars(100))

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

        setLoading(true)

        try {
            const { error } = await supabase.auth.updateUser({ password })

            if (error) throw error
            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Failed to reset password')
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
                    {success ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Password Updated</h2>
                            <p className="text-white/50 mb-6">
                                Your password has been successfully reset. You can now sign in with your new password.
                            </p>
                            <button
                                onClick={onComplete}
                                className="w-full py-4 btn-cosmic rounded-xl font-bold text-white"
                            >
                                Continue to Login
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-white mb-2">Set New Password</h2>
                            <p className="text-white/40 mb-6">Enter your new password below</p>

                            {error && (
                                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 glass-input rounded-xl text-white placeholder-white/30"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 glass-input rounded-xl text-white placeholder-white/30"
                                            placeholder="••••••••"
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
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Password'
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
