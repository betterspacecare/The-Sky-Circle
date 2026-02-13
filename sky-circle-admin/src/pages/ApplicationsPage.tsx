import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Check, X, Loader2, User, Clock, CheckCircle2, XCircle } from 'lucide-react'

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
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-white">Guild Leader Applications</h2>
                    <p className="text-slate-400 text-sm">{applications.length} total applications</p>
                </div>
                {pendingCount > 0 && (
                    <div className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium">
                        {pendingCount} pending review
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize cursor-pointer ${
                            filter === f
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                        {f}
                        {f === 'pending' && pendingCount > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded">
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
                        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <div className="text-center py-16 bg-slate-800 rounded-xl text-slate-400">
                        No applications found
                    </div>
                ) : (
                    filteredApplications.map(application => (
                        <div key={application.id} className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                        <User className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">
                                            {application.user?.display_name || 'Unknown User'}
                                        </h3>
                                        <p className="text-sm text-slate-400">{application.user?.email}</p>
                                        <div className="flex gap-3 mt-1 text-xs text-slate-500">
                                            <span>Level {application.user?.level || 1}</span>
                                            <span>•</span>
                                            <span>{application.user?.total_points || 0} points</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {application.status === 'pending' && (
                                        <span className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm">
                                            <Clock className="w-4 h-4" />
                                            Pending
                                        </span>
                                    )}
                                    {application.status === 'approved' && (
                                        <span className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Approved
                                        </span>
                                    )}
                                    {application.status === 'rejected' && (
                                        <span className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm">
                                            <XCircle className="w-4 h-4" />
                                            Rejected
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                                <p className="text-sm text-slate-300 whitespace-pre-wrap">{application.reason}</p>
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-500">
                                    Applied {new Date(application.created_at).toLocaleDateString()}
                                    {application.reviewed_at && (
                                        <> • Reviewed {new Date(application.reviewed_at).toLocaleDateString()}</>
                                    )}
                                </p>

                                {application.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(application)}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors cursor-pointer"
                                        >
                                            <Check className="w-4 h-4" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(application)}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors cursor-pointer"
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
