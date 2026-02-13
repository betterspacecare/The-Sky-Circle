import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Moon, Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'

interface ForgotPasswordPageProps {
    onBack: () => void
}

export function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
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
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                        <p className="text-slate-400 mb-6">
                            We've sent a password reset link to <span className="text-white">{email}</span>
                        </p>
                        <p className="text-sm text-slate-500 mb-6">
                            Didn't receive the email? Check your spam folder or try again.
                        </p>
                        <button
                            onClick={onBack}
                            className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Moon className="w-10 h-10 text-indigo-400" />
                        <span className="text-2xl font-bold text-white">Sky Circle</span>
                    </div>
                    <p className="text-slate-400">Admin Panel - Reset Password</p>
                </div>

                <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </button>

                    <h2 className="text-xl font-bold text-white mb-2">Forgot Password?</h2>
                    <p className="text-slate-400 text-sm mb-6">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="admin@example.com"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
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
            </div>
        </div>
    )
}
