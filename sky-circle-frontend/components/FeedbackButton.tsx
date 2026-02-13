'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquarePlus, X, Send, Loader2, Bug, Lightbulb, Sparkles, HelpCircle, Star } from 'lucide-react'

const feedbackTypes = [
    { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-400' },
    { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-amber-400' },
    { value: 'improvement', label: 'Improvement', icon: Sparkles, color: 'text-cosmic-purple' },
    { value: 'other', label: 'Other', icon: HelpCircle, color: 'text-white/60' },
]

export default function FeedbackButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [type, setType] = useState<string>('improvement')
    const [message, setMessage] = useState('')
    const [rating, setRating] = useState<number>(0)
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const supabase = createClient()

    const handleSubmit = async () => {
        if (!message.trim()) return

        setSubmitting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { error } = await supabase.from('feedback').insert({
                user_id: user?.id || null,
                type,
                message: message.trim(),
                rating: rating || null,
                page_url: window.location.href,
                user_agent: navigator.userAgent,
            })

            if (error) throw error

            setSubmitted(true)
            setTimeout(() => {
                setIsOpen(false)
                setSubmitted(false)
                setMessage('')
                setType('improvement')
                setRating(0)
            }, 2000)
        } catch (error: any) {
            alert('Failed to submit feedback: ' + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 p-3 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-full shadow-lg hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:scale-110 transition-all group"
                title="Send Feedback"
            >
                <MessageSquarePlus className="w-5 h-5 text-white" />
            </button>

            {/* Feedback Modal */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                    onClick={() => !submitting && setIsOpen(false)}
                >
                    <div 
                        className="bg-[#0a0e17] border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md max-h-[85vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {submitted ? (
                            <div className="py-8 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Thank You!</h3>
                                <p className="text-sm text-white/60">Your feedback helps us improve SkyGuild.</p>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <MessageSquarePlus className="w-5 h-5 text-cosmic-purple" />
                                        <h3 className="text-lg font-bold">Send Feedback</h3>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Feedback Type */}
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-white/50 mb-2">Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {feedbackTypes.map((t) => {
                                            const Icon = t.icon
                                            return (
                                                <button
                                                    key={t.value}
                                                    onClick={() => setType(t.value)}
                                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                                                        type === t.value
                                                            ? 'border-cosmic-purple bg-cosmic-purple/20'
                                                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                                                    }`}
                                                >
                                                    <Icon className={`w-4 h-4 ${t.color}`} />
                                                    <span className="text-xs font-medium">{t.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-white/50 mb-2">Your Feedback</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Tell us what's on your mind..."
                                        rows={4}
                                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg resize-none text-sm placeholder:text-white/30 focus:border-cosmic-purple/50 focus:outline-none transition-all"
                                    />
                                </div>

                                {/* Rating */}
                                <div className="mb-5">
                                    <label className="block text-xs font-medium text-white/50 mb-2">Rate your experience (optional)</label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setRating(star)}
                                                className="p-1 hover:scale-110 transition-transform"
                                            >
                                                <Star
                                                    className={`w-6 h-6 ${
                                                        star <= rating
                                                            ? 'text-cosmic-gold fill-cosmic-gold'
                                                            : 'text-white/20'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={!message.trim() || submitting}
                                    className="w-full py-3 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Submit Feedback
                                        </>
                                    )}
                                </button>

                                <p className="text-[10px] text-white/30 text-center mt-3">
                                    Your feedback is anonymous unless you're logged in.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
