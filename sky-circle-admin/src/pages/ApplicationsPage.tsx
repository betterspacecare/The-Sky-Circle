import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Check, X, Loader2, User, Clock, CheckCircle2, XCircle, Star, Sparkles, Rocket } from 'lucide-react'

interface Application {
    id: string
    user_id: string
    reason: string
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
    reviewed_at: string | null
    user?: {
        display_name: string | null
        email: string
        level: number
        total_points: number
    }
}

export function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

    useEffect(() => {
        fetchApplications()
    }, [])

    const fetchApplications = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('guild_leader_applications')
                .select('*, user:users!guild_leader_applications_user_id_fkey(display_name, email, level, total_points)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setApplications(data || [])
        } catch (error) {
            console.error('Error fetching applications:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (application: Application) => {
        try {
            // Update application status
            await supabase
                .from('guild_leader_applications')
                .update({ 
                    status: 'approved',
                    reviewed_at: new Date().toISOString()
                })
                .eq('id', application.id)

            // Update user to be event creator
            await supabase
                .from('users')
                .update({ 
                    is_event_creator: true,
                    guild_leader_application_status: 'approved'
                })
                .eq('id', application.user_id)

            fetchApplications()
        } catch (error) {
            console.error('Error approving application:', error)
        }
    }

    const handleReject = async (application: Application) => {
        if (!confirm('Are you sure you want to reject this application?')) return
        
        try {
            await supabase
                .from('guild_leader_applications')
                .update({ 
                    status: 'rejected',
                    reviewed_at: new Date().toISOString()
                })
                .eq('id', application.id)

            await supabase
                .from('users')
                .update({ guild_leader_application_status: 'rejected' })
                .eq('id', application.user_id)

            fetchApplications()
        } catch (error) {
            console.error('Error rejecting application:', error)
        }
    }

    const filteredApplications = applications.filter(a => {
        if (filter === 'all') return true
        return a.status === filter
    })

    const pendingCount = applications.filter(a => a.status === 'pending').length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <span className="text-purple-400 font-bold text-xs tracking-wider uppercase">Guild Leader Applications</span>
                    </div>
                    <p className="text-white/40 text-sm">{applications.length} total applications</p>
                </div>
                {pendingCount > 0 && (
                    <div className="px-4 py-2 bg-amber-500/10 text-amber-400 rounded-xl text-sm font-bold border border-amber-500/20 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {pendingCount} pending review
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${
                            filter === f
                                ? 'btn-cosmic text-white'
                                : 'glass-input text-white/60 hover:text-white'
                        }`}
                    >
                        {f}
                        {f === 'pending' && pendingCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full font-bold">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Applications List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <div className="text-center py-16 glass-card rounded-2xl text-white/40">
                        <Rocket className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No applications found</p>
                    </div>
                ) : (
                    filteredApplications.map(application => (
                        <div key={application.id} className="glass-card rounded-2xl p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                        <User className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                            {application.user?.display_name || 'Unknown User'}
                                            <Star className="w-4 h-4 text-amber-400" />
                                        </h3>
                                        <p className="text-sm text-white/50">{application.user?.email}</p>
                                        <div className="flex gap-3 mt-2 text-xs">
                                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg font-semibold">
                                                Level {application.user?.level || 1}
                                            </span>
                                            <span className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded-lg font-semibold">
                                                {application.user?.total_points || 0} points
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {application.status === 'pending' && (
                                        <span className="flex items-center gap-1.5 px-4 py-2 badge-warning rounded-xl text-sm font-bold">
                                            <Clock className="w-4 h-4" />
                                            Pending
                                        </span>
                                    )}
                                    {application.status === 'approved' && (
                                        <span className="flex items-center gap-1.5 px-4 py-2 badge-success rounded-xl text-sm font-bold">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Approved
                                        </span>
                                    )}
                                    {application.status === 'rejected' && (
                                        <span className="flex items-center gap-1.5 px-4 py-2 badge-danger rounded-xl text-sm font-bold">
                                            <XCircle className="w-4 h-4" />
                                            Rejected
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="glass-input rounded-xl p-4 mb-4">
                                <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{application.reason}</p>
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-xs text-white/30">
                                    Applied {new Date(application.created_at).toLocaleDateString()}
                                    {application.reviewed_at && (
                                        <> • Reviewed {new Date(application.reviewed_at).toLocaleDateString()}</>
                                    )}
                                </p>

                                {application.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(application)}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-xl transition-all font-bold border border-green-500/20"
                                        >
                                            <Check className="w-4 h-4" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(application)}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all font-bold border border-red-500/20"
                                        >
                                            <X className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
