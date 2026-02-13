import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Search, Check, X, Loader2, Users, Globe, Lock, Trash2, Calendar } from 'lucide-react'

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
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-white">Guilds & Events</h2>
                    <p className="text-slate-400 text-sm">{groups.length} guilds, {groupEvents.length} events</p>
                </div>
                <div className="flex gap-2">
                    {pendingCount > 0 && (
                        <div className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium">
                            {pendingCount} guilds pending
                        </div>
                    )}
                    {pendingEventsCount > 0 && (
                        <div className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium">
                            {pendingEventsCount} events pending
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-700 pb-4">
                <button
                    onClick={() => setActiveTab('guilds')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                        activeTab === 'guilds' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <Users className="w-4 h-4 inline mr-2" />
                    Guilds
                    {pendingCount > 0 && <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded">{pendingCount}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('events')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                        activeTab === 'events' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Guild Events
                    {pendingEventsCount > 0 && <span className="ml-2 px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded">{pendingEventsCount}</span>}
                </button>
            </div>

            {activeTab === 'guilds' ? (
                <>
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search guilds..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'pending', 'approved'] as const).map(f => (
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
            </div>

            {/* Groups Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                        No guilds found
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700/50">
                                <tr className="text-left text-slate-300 text-sm">
                                    <th className="px-4 py-3 font-medium">Guild</th>
                                    <th className="px-4 py-3 font-medium">Creator</th>
                                    <th className="px-4 py-3 font-medium">Type</th>
                                    <th className="px-4 py-3 font-medium">Members</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Created</th>
                                    <th className="px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300">
                                {filteredGroups.map((group) => (
                                    <tr key={group.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                                        <td className="px-4 py-3">
                                            <div>
                                                <span className="font-medium text-white">{group.name}</span>
                                                {group.description && (
                                                    <p className="text-xs text-slate-400 truncate max-w-xs">
                                                        {group.description}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400">
                                            {group.creator?.display_name || group.creator?.email || 'Unknown'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {group.is_public ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                                                    <Globe className="w-3 h-3" /> Public
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs">
                                                    <Lock className="w-3 h-3" /> Private
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-4 h-4 text-slate-400" />
                                                {group.member_count}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {group.is_approved ? (
                                                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                                                    Approved
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs font-medium">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-400">
                                            {new Date(group.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {!group.is_approved && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(group.id)}
                                                            className="p-1.5 text-green-400 hover:bg-green-500/20 rounded transition-colors cursor-pointer"
                                                            title="Approve"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(group.id)}
                                                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors cursor-pointer"
                                                            title="Reject"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {group.is_approved && (
                                                    <button
                                                        onClick={() => handleDelete(group.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
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
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                        </div>
                    ) : groupEvents.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            No guild events found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-700/50">
                                    <tr className="text-left text-slate-300 text-sm">
                                        <th className="px-4 py-3 font-medium">Event</th>
                                        <th className="px-4 py-3 font-medium">Guild</th>
                                        <th className="px-4 py-3 font-medium">Creator</th>
                                        <th className="px-4 py-3 font-medium">Date</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                        <th className="px-4 py-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-300">
                                    {groupEvents.map((event) => (
                                        <tr key={event.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <span className="font-medium text-white">{event.title}</span>
                                                    <p className="text-xs text-slate-400">{event.location}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400">
                                                {event.group?.name || 'Unknown'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-400">
                                                {event.creator?.display_name || event.creator?.email || 'Unknown'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-400">
                                                {new Date(event.event_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                {event.is_approved ? (
                                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                                                        Approved
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs font-medium">
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {!event.is_approved && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApproveEvent(event.id)}
                                                                className="p-1.5 text-green-400 hover:bg-green-500/20 rounded transition-colors cursor-pointer"
                                                                title="Approve"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectEvent(event.id)}
                                                                className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors cursor-pointer"
                                                                title="Reject"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {event.is_approved && (
                                                        <button
                                                            onClick={() => handleRejectEvent(event.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
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
