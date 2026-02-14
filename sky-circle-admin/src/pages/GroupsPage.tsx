import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Search, Check, X, Loader2, Users, Globe, Lock, Trash2, Calendar, Star, Sparkles } from 'lucide-react'

interface Group {
    id: string
    name: string
    description: string | null
    is_public: boolean
    is_approved: boolean
    member_count: number
    created_at: string
    created_by: string
    creator?: {
        display_name: string | null
        email: string
    }
}

interface GroupEvent {
    id: string
    group_id: string
    title: string
    description: string | null
    location: string
    event_date: string
    is_approved: boolean
    created_at: string
    group?: {
        name: string
    }
    creator?: {
        display_name: string | null
        email: string
    }
}

export function GroupsPage() {
    const [groups, setGroups] = useState<Group[]>([])
    const [groupEvents, setGroupEvents] = useState<GroupEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
    const [search, setSearch] = useState('')
    const [activeTab, setActiveTab] = useState<'guilds' | 'events'>('guilds')

    useEffect(() => {
        fetchGroups()
        fetchGroupEvents()
    }, [])

    const fetchGroups = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('groups')
                .select('*, creator:users(display_name, email)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setGroups(data || [])
        } catch (error) {
            console.error('Error fetching groups:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchGroupEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('group_events')
                .select('*, group:groups(name), creator:users(display_name, email)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setGroupEvents(data || [])
        } catch (error) {
            console.error('Error fetching group events:', error)
        }
    }

    const handleApprove = async (id: string) => {
        try {
            await supabase
                .from('groups')
                .update({ is_approved: true })
                .eq('id', id)
            fetchGroups()
        } catch (error) {
            console.error('Error approving group:', error)
        }
    }

    const handleReject = async (id: string) => {
        if (!confirm('Are you sure you want to reject and delete this group?')) return
        try {
            await supabase
                .from('groups')
                .delete()
                .eq('id', id)
            fetchGroups()
        } catch (error) {
            console.error('Error rejecting group:', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this group? This will also delete all events and members.')) return
        try {
            await supabase
                .from('groups')
                .delete()
                .eq('id', id)
            fetchGroups()
        } catch (error) {
            console.error('Error deleting group:', error)
        }
    }

    const handleApproveEvent = async (id: string) => {
        try {
            await supabase
                .from('group_events')
                .update({ is_approved: true })
                .eq('id', id)
            fetchGroupEvents()
        } catch (error) {
            console.error('Error approving event:', error)
        }
    }

    const handleRejectEvent = async (id: string) => {
        if (!confirm('Are you sure you want to reject and delete this event?')) return
        try {
            await supabase
                .from('group_events')
                .delete()
                .eq('id', id)
            fetchGroupEvents()
        } catch (error) {
            console.error('Error rejecting event:', error)
        }
    }

    const filteredGroups = groups.filter(g => {
        const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase())
        if (filter === 'pending') return matchesSearch && !g.is_approved
        if (filter === 'approved') return matchesSearch && g.is_approved
        return matchesSearch
    })

    const pendingCount = groups.filter(g => !g.is_approved).length
    const pendingEventsCount = groupEvents.filter(e => !e.is_approved).length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <span className="text-purple-400 font-bold text-xs tracking-wider uppercase">Community Management</span>
                    </div>
                    <p className="text-white/40 text-sm">{groups.length} guilds, {groupEvents.length} events</p>
                </div>
                <div className="flex gap-2">
                    {pendingCount > 0 && (
                        <div className="px-4 py-2 bg-amber-500/10 text-amber-400 rounded-xl text-sm font-bold border border-amber-500/20">
                            {pendingCount} guilds pending
                        </div>
                    )}
                    {pendingEventsCount > 0 && (
                        <div className="px-4 py-2 bg-purple-500/10 text-purple-400 rounded-xl text-sm font-bold border border-purple-500/20">
                            {pendingEventsCount} events pending
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-purple-500/20 pb-4">
                <button
                    onClick={() => setActiveTab('guilds')}
                    className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                        activeTab === 'guilds' 
                            ? 'btn-cosmic text-white' 
                            : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Users className="w-4 h-4 inline mr-2" />
                    Guilds
                    {pendingCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full font-bold">
                            {pendingCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('events')}
                    className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                        activeTab === 'events' 
                            ? 'btn-cosmic text-white' 
                            : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Guild Events
                    {pendingEventsCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full font-bold">
                            {pendingEventsCount}
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'guilds' ? (
                <>
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <input
                                type="text"
                                placeholder="Search guilds..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 glass-input rounded-xl text-white placeholder-white/30"
                            />
                        </div>
                        <div className="flex gap-2">
                            {(['all', 'pending', 'approved'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${
                                        filter === f
                                            ? 'btn-cosmic text-white'
                                            : 'glass-input text-white/60 hover:text-white'
                                    }`}
                                >
                                    {f}
                                    {f === 'pending' && pendingCount > 0 && (
                                        <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                                            {pendingCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Groups Table */}
                    <div className="glass-card rounded-2xl overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                            </div>
                        ) : filteredGroups.length === 0 ? (
                            <div className="text-center py-16 text-white/40">
                                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p>No guilds found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-purple-500/10 border-b border-purple-500/20">
                                        <tr className="text-left text-white/40 text-xs uppercase tracking-wider">
                                            <th className="px-4 py-4 font-semibold">Guild</th>
                                            <th className="px-4 py-4 font-semibold">Creator</th>
                                            <th className="px-4 py-4 font-semibold">Type</th>
                                            <th className="px-4 py-4 font-semibold">Members</th>
                                            <th className="px-4 py-4 font-semibold">Status</th>
                                            <th className="px-4 py-4 font-semibold">Created</th>
                                            <th className="px-4 py-4 font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-white/80">
                                        {filteredGroups.map((group) => (
                                            <tr key={group.id} className="border-t border-purple-500/10 hover:bg-purple-500/5 transition-colors">
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <span className="font-semibold text-white flex items-center gap-2">
                                                            <Star className="w-4 h-4 text-amber-400" />
                                                            {group.name}
                                                        </span>
                                                        {group.description && (
                                                            <p className="text-xs text-white/40 truncate max-w-xs mt-1">
                                                                {group.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-white/50">
                                                    {group.creator?.display_name || group.creator?.email || 'Unknown'}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {group.is_public ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 badge-success rounded-lg text-xs font-bold">
                                                            <Globe className="w-3 h-3" /> Public
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 badge-warning rounded-lg text-xs font-bold">
                                                            <Lock className="w-3 h-3" /> Private
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="flex items-center gap-1.5 text-white/60">
                                                        <Users className="w-4 h-4" />
                                                        {group.member_count}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {group.is_approved ? (
                                                        <span className="px-3 py-1 badge-success rounded-lg text-xs font-bold">
                                                            Approved
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 badge-warning rounded-lg text-xs font-bold">
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-white/40">
                                                    {new Date(group.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-1">
                                                        {!group.is_approved && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleApprove(group.id)}
                                                                    className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                                                                    title="Approve"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReject(group.id)}
                                                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                                    title="Reject"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {group.is_approved && (
                                                            <button
                                                                onClick={() => handleDelete(group.id)}
                                                                className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* Events Tab */
                <div className="glass-card rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                        </div>
                    ) : groupEvents.length === 0 ? (
                        <div className="text-center py-16 text-white/40">
                            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p>No guild events found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-purple-500/10 border-b border-purple-500/20">
                                    <tr className="text-left text-white/40 text-xs uppercase tracking-wider">
                                        <th className="px-4 py-4 font-semibold">Event</th>
                                        <th className="px-4 py-4 font-semibold">Guild</th>
                                        <th className="px-4 py-4 font-semibold">Creator</th>
                                        <th className="px-4 py-4 font-semibold">Date</th>
                                        <th className="px-4 py-4 font-semibold">Status</th>
                                        <th className="px-4 py-4 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-white/80">
                                    {groupEvents.map((event) => (
                                        <tr key={event.id} className="border-t border-purple-500/10 hover:bg-purple-500/5 transition-colors">
                                            <td className="px-4 py-4">
                                                <div>
                                                    <span className="font-semibold text-white">{event.title}</span>
                                                    <p className="text-xs text-white/40">{event.location}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-white/50">
                                                {event.group?.name || 'Unknown'}
                                            </td>
                                            <td className="px-4 py-4 text-white/50">
                                                {event.creator?.display_name || event.creator?.email || 'Unknown'}
                                            </td>
                                            <td className="px-4 py-4 text-white/40">
                                                {new Date(event.event_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-4">
                                                {event.is_approved ? (
                                                    <span className="px-3 py-1 badge-success rounded-lg text-xs font-bold">
                                                        Approved
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 badge-warning rounded-lg text-xs font-bold">
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1">
                                                    {!event.is_approved && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApproveEvent(event.id)}
                                                                className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                                                                title="Approve"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectEvent(event.id)}
                                                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                                title="Reject"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {event.is_approved && (
                                                        <button
                                                            onClick={() => handleRejectEvent(event.id)}
                                                            className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
