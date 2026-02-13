'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
    Users, Plus, Calendar, MapPin, ChevronLeft, Settings,
    Loader2, Clock, UserPlus, UserMinus, Shield, Globe, Lock, X
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Group {
    id: string
    name: string
    description: string | null
    cover_image_url: string | null
    is_public: boolean
    member_count: number
    created_by: string
    created_at: string
}

interface GroupEvent {
    id: string
    title: string
    description: string | null
    location: string
    event_date: string
    capacity: number | null
    is_approved: boolean
    created_by: string
    attendee_count: number
    is_attending: boolean
}

interface Member {
    id: string
    user_id: string
    role: string
    joined_at: string
    users: {
        display_name: string | null
        profile_photo_url: string | null
    }
}

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const supabase = createClient()
    const [group, setGroup] = useState<Group | null>(null)
    const [events, setEvents] = useState<GroupEvent[]>([])
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [isMember, setIsMember] = useState(false)
    const [showCreateEvent, setShowCreateEvent] = useState(false)
    const [creating, setCreating] = useState(false)
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        location: '',
        event_date: '',
        capacity: ''
    })

    useEffect(() => {
        fetchData()
    }, [id])

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            setUserId(user?.id || null)

            // Fetch group
            const { data: groupData, error } = await supabase
                .from('groups')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            setGroup(groupData)

            // Fetch members
            const { data: membersData } = await supabase
                .from('group_members')
                .select('*, users(display_name, profile_photo_url)')
                .eq('group_id', id)
                .order('role', { ascending: true })

            setMembers(membersData || [])

            // Check if user is member
            if (user) {
                const membership = membersData?.find(m => m.user_id === user.id)
                setIsMember(!!membership)
                setUserRole(membership?.role || null)
            }

            // Fetch events
            const { data: eventsData } = await supabase
                .from('group_events')
                .select('*, attendee_count:group_event_attendees(count)')
                .eq('group_id', id)
                .eq('is_approved', true)
                .gte('event_date', new Date().toISOString())
                .order('event_date', { ascending: true })

            // Get user's RSVPs
            let userRsvps: string[] = []
            if (user) {
                const { data: rsvpData } = await supabase
                    .from('group_event_attendees')
                    .select('event_id')
                    .eq('user_id', user.id)
                userRsvps = rsvpData?.map(r => r.event_id) || []
            }

            const formattedEvents = (eventsData || []).map(e => ({
                ...e,
                attendee_count: e.attendee_count[0]?.count || 0,
                is_attending: userRsvps.includes(e.id)
            }))

            setEvents(formattedEvents)

        } catch (error) {
            console.error('Error:', error)
            router.push('/dashboard/groups')
        } finally {
            setLoading(false)
        }
    }

    const handleJoin = async () => {
        if (!userId) return
        try {
            await supabase
                .from('group_members')
                .insert({ group_id: id, user_id: userId })
            fetchData()
        } catch (error: any) {
            alert('Failed to join: ' + error.message)
        }
    }

    const handleLeave = async () => {
        if (!userId || userRole === 'owner') return
        if (!confirm('Are you sure you want to leave this guild?')) return
        
        try {
            await supabase
                .from('group_members')
                .delete()
                .eq('group_id', id)
                .eq('user_id', userId)
            router.push('/dashboard/groups')
        } catch (error: any) {
            alert('Failed to leave: ' + error.message)
        }
    }

    const handleRSVP = async (eventId: string, isAttending: boolean) => {
        if (!userId) return

        try {
            if (isAttending) {
                await supabase
                    .from('group_event_attendees')
                    .delete()
                    .eq('event_id', eventId)
                    .eq('user_id', userId)
            } else {
                await supabase
                    .from('group_event_attendees')
                    .insert({ event_id: eventId, user_id: userId })
            }
            fetchData()
        } catch (error: any) {
            alert('Failed to update RSVP: ' + error.message)
        }
    }

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userId) return

        setCreating(true)
        try {
            const { error } = await supabase
                .from('group_events')
                .insert({
                    group_id: id,
                    title: newEvent.title,
                    description: newEvent.description || null,
                    location: newEvent.location,
                    event_date: new Date(newEvent.event_date).toISOString(),
                    capacity: newEvent.capacity ? parseInt(newEvent.capacity) : null,
                    created_by: userId,
                    is_approved: false
                })

            if (error) throw error

            setShowCreateEvent(false)
            setNewEvent({ title: '', description: '', location: '', event_date: '', capacity: '' })
            alert('Event created! It will be visible after admin approval.')
            fetchData()
        } catch (error: any) {
            alert('Failed to create event: ' + error.message)
        } finally {
            setCreating(false)
        }
    }

    const canCreateEvents = ['owner', 'admin', 'moderator'].includes(userRole || '')

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-cosmic-purple animate-spin" />
            </div>
        )
    }

    if (!group) return null

    return (
        <div className="py-0">
            <Link
                href="/dashboard/groups"
                className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-6 group"
            >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back to Guilds
            </Link>

            {/* Header */}
            <div className="glass-effect rounded-3xl overflow-hidden mb-8">
                <div className="h-48 bg-gradient-to-br from-cosmic-purple/30 to-cosmic-blue/30 relative">
                    {group.cover_image_url && (
                        <img src={group.cover_image_url} alt="" className="w-full h-full object-cover" />
                    )}
                </div>
                <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-black">{group.name}</h1>
                                {group.is_public ? (
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold flex items-center gap-1">
                                        <Globe className="w-3 h-3" /> Public
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> Private
                                    </span>
                                )}
                            </div>
                            {group.description && (
                                <p className="text-white/50 max-w-2xl">{group.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-sm text-white/40">
                                <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {group.member_count} members
                                </span>
                                <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {isMember ? (
                                <>
                                    {canCreateEvents && (
                                        <button
                                            onClick={() => setShowCreateEvent(true)}
                                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-xl font-bold"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Create Event
                                        </button>
                                    )}
                                    {userRole !== 'owner' && (
                                        <button
                                            onClick={handleLeave}
                                            className="flex items-center gap-2 px-5 py-3 glass-inner rounded-xl font-medium hover:bg-red-500/10 hover:text-red-400"
                                        >
                                            <UserMinus className="w-5 h-5" />
                                            Leave
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button
                                    onClick={handleJoin}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-xl font-bold"
                                >
                                    <UserPlus className="w-5 h-5" />
                                    Join Guild
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Events */}
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-cosmic-purple" />
                        Upcoming Events
                    </h2>
                    {events.length === 0 ? (
                        <div className="glass-effect rounded-2xl p-8 text-center">
                            <Calendar className="w-10 h-10 text-white/20 mx-auto mb-3" />
                            <p className="text-white/40">No upcoming events</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {events.map(event => (
                                <div key={event.id} className="glass-effect rounded-2xl p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-lg font-bold">{event.title}</h3>
                                            {event.description && (
                                                <p className="text-sm text-white/40 mt-1">{event.description}</p>
                                            )}
                                        </div>
                                        <span className="px-3 py-1 bg-cosmic-purple/20 text-cosmic-purple rounded-lg text-xs font-bold">
                                            FREE
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-white/50 mb-4">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(event.event_date).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {event.location}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {event.attendee_count}{event.capacity ? ` / ${event.capacity}` : ''} attending
                                        </span>
                                    </div>
                                    {isMember && (
                                        <button
                                            onClick={() => handleRSVP(event.id, event.is_attending)}
                                            className={cn(
                                                "w-full py-3 rounded-xl font-bold transition-all",
                                                event.is_attending
                                                    ? "glass-inner text-white/70 hover:bg-red-500/10 hover:text-red-400"
                                                    : "bg-cosmic-purple/20 text-cosmic-purple hover:bg-cosmic-purple/30"
                                            )}
                                        >
                                            {event.is_attending ? 'Cancel RSVP' : 'RSVP'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Members */}
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-cosmic-pink" />
                        Members ({members.length})
                    </h2>
                    <div className="glass-effect rounded-2xl p-4 space-y-3 max-h-96 overflow-y-auto">
                        {members.map(member => (
                            <div key={member.id} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cosmic-purple/30 to-cosmic-pink/30 overflow-hidden">
                                    {member.users?.profile_photo_url ? (
                                        <img src={member.users.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/50 font-bold">
                                            {member.users?.display_name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{member.users?.display_name || 'Unknown'}</p>
                                    <p className="text-xs text-white/40 capitalize">{member.role}</p>
                                </div>
                                {member.role === 'owner' && (
                                    <Shield className="w-4 h-4 text-cosmic-gold" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Create Event Modal */}
            {showCreateEvent && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowCreateEvent(false)}
                >
                    <div 
                        className="glass-effect rounded-2xl p-6 max-w-md w-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Create Event</h3>
                            <button onClick={() => setShowCreateEvent(false)} className="p-2 glass-inner rounded-lg">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Event Title</label>
                                <input
                                    type="text"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    className="w-full px-4 py-3 glass-input rounded-xl"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Description</label>
                                <textarea
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                    className="w-full px-4 py-3 glass-input rounded-xl resize-none"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Location</label>
                                <input
                                    type="text"
                                    value={newEvent.location}
                                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                    className="w-full px-4 py-3 glass-input rounded-xl"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={newEvent.event_date}
                                    onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                                    className="w-full px-4 py-3 glass-input rounded-xl"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Capacity (optional)</label>
                                <input
                                    type="number"
                                    value={newEvent.capacity}
                                    onChange={(e) => setNewEvent({ ...newEvent, capacity: e.target.value })}
                                    className="w-full px-4 py-3 glass-input rounded-xl"
                                    placeholder="Leave empty for unlimited"
                                />
                            </div>
                            <p className="text-xs text-white/40">
                                All guild events are free. Your event will be reviewed before publishing.
                            </p>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateEvent(false)}
                                    className="flex-1 py-3 glass-inner rounded-xl font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-3 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-xl font-bold disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
