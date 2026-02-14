import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MessageSquare, Bug, Lightbulb, Sparkles, HelpCircle, Star, Loader2, Trash2, User, Calendar, Globe } from 'lucide-react'

interface Feedback {
    id: string
    user_id: string | null
    type: 'bug' | 'feature' | 'improvement' | 'other'
    message: string
    rating: number | null
    page_url: string | null
    user_agent: string | null
    created_at: string
    users?: {
        display_name: string | null
        email: string
    } | null
}

const typeConfig = {
    bug: { label: 'Bug Report', icon: Bug, color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' },
    feature: { label: 'Feature Request', icon: Lightbulb, color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
    improvement: { label: 'Improvement', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/30' },
    other: { label: 'Other', icon: HelpCircle, color: 'text-slate-300', bg: 'bg-slate-500/20 border-slate-500/30' },
}

export function FeedbackPage() {
    const [feedback, setFeedback] = useState<Feedback[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('all')
    const [deleting, setDeleting] = useState<string | null>(null)

    useEffect(() => {
        fetchFeedback()
    }, [])

    const fetchFeedback = async () => {
        try {
            const { data, error } = await supabase
                .from('feedback')
                .select(`
                    *,
                    users (
                        display_name,
                        email
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setFeedback(data || [])
        } catch (error: any) {
            console.error('Error fetching feedback:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this feedback?')) return

        setDeleting(id)
        try {
            const { error } = await supabase
                .from('feedback')
                .delete()
                .eq('id', id)

            if (error) throw error
            setFeedback(feedback.filter(f => f.id !== id))
        } catch (error: any) {
            alert('Failed to delete: ' + error.message)
        } finally {
            setDeleting(null)
        }
    }

    const filteredFeedback = filter === 'all' 
        ? feedback 
        : feedback.filter(f => f.type === filter)

    const stats = {
        total: feedback.length,
        bug: feedback.filter(f => f.type === 'bug').length,
        feature: feedback.filter(f => f.type === 'feature').length,
        improvement: feedback.filter(f => f.type === 'improvement').length,
        other: feedback.filter(f => f.type === 'other').length,
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <button
                    onClick={() => setFilter('all')}
                    className={`glass-card p-4 rounded-xl text-center transition-all ${filter === 'all' ? 'ring-2 ring-purple-500' : ''}`}
                >
                    <MessageSquare className="w-5 h-5 mx-auto mb-2 text-purple-400" />
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                    <p className="text-xs text-white/60">Total</p>
                </button>
                {Object.entries(typeConfig).map(([key, config]) => {
                    const Icon = config.icon
                    return (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`glass-card p-4 rounded-xl text-center transition-all ${filter === key ? 'ring-2 ring-purple-500' : ''}`}
                        >
                            <Icon className={`w-5 h-5 mx-auto mb-2 ${config.color}`} />
                            <p className="text-2xl font-bold text-white">{stats[key as keyof typeof stats]}</p>
                            <p className="text-xs text-white/60">{config.label}</p>
                        </button>
                    )
                })}
            </div>

            {/* Feedback List */}
            <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <h2 className="font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-purple-400" />
                        User Feedback
                        {filter !== 'all' && (
                            <span className="text-sm font-normal text-white/60">
                                — Showing {typeConfig[filter as keyof typeof typeConfig]?.label}
                            </span>
                        )}
                    </h2>
                </div>

                {filteredFeedback.length === 0 ? (
                    <div className="p-12 text-center text-white/50">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No feedback yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {filteredFeedback.map((item) => {
                            const config = typeConfig[item.type]
                            const Icon = config.icon
                            return (
                                <div key={item.id} className="p-4 hover:bg-white/5 transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-lg border ${config.bg}`}>
                                            <Icon className={`w-5 h-5 ${config.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${config.bg} ${config.color}`}>
                                                    {config.label}
                                                </span>
                                                {item.rating && (
                                                    <div className="flex items-center gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                className={`w-3 h-3 ${star <= item.rating! ? 'text-amber-400 fill-amber-400' : 'text-white/30'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-white mb-3 whitespace-pre-wrap">{item.message}</p>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {item.users?.display_name || item.users?.email || 'Anonymous'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </span>
                                                {item.page_url && (
                                                    <span className="flex items-center gap-1 truncate max-w-[200px]">
                                                        <Globe className="w-3 h-3 shrink-0" />
                                                        {item.page_url.replace(/https?:\/\/[^/]+/, '')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            disabled={deleting === item.id}
                                            className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                        >
                                            {deleting === item.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
