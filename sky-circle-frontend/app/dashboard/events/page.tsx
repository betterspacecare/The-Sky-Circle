'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
    Calendar, MapPin, Users, ChevronRight, Clock, Star, Search,
    Filter, Loader2, CalendarPlus, Sparkles, Eye
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Event {
    id: string
    title: string
    description: string
    location: string
    event_date: string
    capacity: number | null
    is_paid: boolean
    price: number | null
    attendee_count: number
    is_registered: boolean
}

type FilterType = 'all' | 'free' | 'paid' | 'registered'

export default function EventsPage() {
    const supabase = createClient()
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState<FilterType>('all')
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        fetchEvents()
        setupRealtimeSubscription()
    }, [])

    const setupRealtimeSubscription = () => {
        const channel = supabase
            .channel('events-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
                fetchEvents()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event_attendees' }, () => {
                fetchEvents()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }

    const fetchEvents = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            setUserId(user?.id || null)

            const { data, error } = await supabase
                .from('events')
                .select(`
                    *,
                    attendee_count:event_attendees(count)
                `)
                .order('event_date', { ascending: true })

            if (error) throw error

            // Get user's registrations
            let userRegistrations: string[] = []
            if (user) {
                const { data: regData } = await supabase
                    .from('event_attendees')
                    .select('event_id')
                    .eq('user_id', user.id)
                
                userRegistrations = regData?.map(r => r.event_id) || []
            }

            const formattedEvents = data.map(event => ({
                ...event,
                attendee_count: event.attendee_count[0]?.count || 0,
                is_registered: userRegistrations.includes(event.id)
            }))

            setEvents(formattedEvents || [])
        } catch (error: any) {
            console.error('Error fetching events:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const quickRSVP = async (eventId: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (!userId) {
            alert('Please log in to RSVP')
            return
        }

        const event = events.find(ev => ev.id === eventId)
        if (!event) return

        try {
            if (event.is_registered) {
                await supabase
                    .from('event_attendees')
                    .delete()
                    .eq('event_id', eventId)
                    .eq('user_id', userId)
            } else {
                if (event.capacity && event.attendee_count >= event.capacity) {
                    alert('This event is full')
                    return
                }
                await supabase
                    .from('event_attendees')
                    .insert({ event_id: eventId, user_id: userId })
            }
            fetchEvents()
        } catch (error: any) {
            alert('Failed to update RSVP: ' + error.message)
        }
    }

    const now = new Date()
    const upcomingEvents = events.filter(e => new Date(e.event_date) >= now)
    const pastEvents = events.filter(e => new Date(e.event_date) < now)

    // Apply filters
    const filteredUpcoming = upcomingEvents.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.description?.toLowerCase().includes(searchQuery.toLowerCase())
        
        let matchesFilter = true
        if (filter === 'free') matchesFilter = !event.is_paid
        if (filter === 'paid') matchesFilter = event.is_paid
        if (filter === 'registered') matchesFilter = event.is_registered

        return matchesSearch && matchesFilter
    })

    // Find featured event (next upcoming with most attendees)
    const featuredEvent = upcomingEvents
        .sort((a, b) => b.attendee_count - a.attendee_count)[0]

    return (
        <div className="py-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-black mb-2 text-gradient tracking-tighter">Stellar Events</h1>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Join fellow observers under the stars</p>
                </div>
                <div className="flex gap-3">
                    <div className="glass-effect px-4 py-2.5 rounded-xl flex items-center gap-2">
                        <Clock className="w-4 h-4 text-cosmic-purple" />
                        <span className="text-sm font-medium">{upcomingEvents.length} Upcoming</span>
                    </div>
                    <div className="glass-effect px-4 py-2.5 rounded-xl flex items-center gap-2">
                        <Users className="w-4 h-4 text-cosmic-pink" />
                        <span className="text-sm font-medium">{events.filter(e => e.is_registered).length} Registered</span>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                        type="text"
                        placeholder="Search events by name or location..."
                        className="w-full pl-12 pr-4 py-3 glass-input rounded-xl text-white placeholder:text-white/30"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'free', 'paid', 'registered'] as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-4 py-2.5 rounded-xl text-sm font-medium transition-all capitalize",
                                filter === f
                                    ? "bg-cosmic-purple/20 text-cosmic-purple border border-cosmic-purple/30"
                                    : "glass-inner text-white/60 hover:text-white"
                            )}
                        >
                            {f === 'all' ? 'All Events' : f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Featured Event */}
            {featuredEvent && filter === 'all' && !searchQuery && (
                <Link 
                    href={`/dashboard/events/${featuredEvent.id}`}
                    className="relative rounded-3xl overflow-hidden mb-12 group cursor-pointer block"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-cosmic-purple to-cosmic-blue opacity-85 group-hover:opacity-100 transition-opacity z-10" />
                    <div className="absolute inset-0 z-0">
                        <img
                            src="https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&q=80&w=2070"
                            className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[2s]"
                            alt=""
                        />
                    </div>
                    <div className="relative z-20 p-8 md:p-12">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white mb-6 border border-white/10 uppercase tracking-widest">
                                    <Sparkles className="w-3 h-3" />
                                    Featured Event
                                </div>
                                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                                    {featuredEvent.title}
                                </h2>
                                <div className="flex flex-wrap gap-6 text-white/80">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-cosmic-gold" />
                                        <span>{new Date(featuredEvent.event_date).toLocaleDateString('en-US', { 
                                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                                        })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-cosmic-gold" />
                                        <span>{featuredEvent.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-cosmic-gold" />
                                        <span>
                                            {featuredEvent.capacity 
                                                ? `${featuredEvent.capacity - featuredEvent.attendee_count} spots left`
                                                : `${featuredEvent.attendee_count} attending`
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => quickRSVP(featuredEvent.id, e)}
                                className={cn(
                                    "px-8 py-4 rounded-2xl font-black text-lg transition-all flex items-center gap-3 active:scale-95 shrink-0",
                                    featuredEvent.is_registered
                                        ? "bg-white/20 text-white border border-white/30 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300"
                                        : "bg-white text-cosmic-purple hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                                )}
                            >
                                {featuredEvent.is_registered ? 'Cancel RSVP' : 'Register Now'}
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </Link>
            )}

            {/* Upcoming Events Grid */}
            <h3 className="text-2xl font-black mb-8 flex items-center gap-4 tracking-tighter text-white">
                <Star className="w-7 h-7 text-cosmic-gold drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]" />
                {filter === 'registered' ? 'My Registered Events' : 'Upcoming Events'}
            </h3>

            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-effect h-72 rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : filteredUpcoming.length === 0 ? (
                <div className="text-center py-16 glass-effect rounded-3xl">
                    <Eye className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40 font-medium">
                        {searchQuery || filter !== 'all' 
                            ? 'No events match your search' 
                            : 'No upcoming events scheduled'}
                    </p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUpcoming.map(event => (
                        <Link
                            key={event.id}
                            href={`/dashboard/events/${event.id}`}
                            className="group glass-effect rounded-3xl overflow-hidden hover:scale-[1.02] transition-all duration-300 flex flex-col"
                        >
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cosmic-purple to-cosmic-pink flex flex-col items-center justify-center text-white font-black shadow-lg">
                                        <span className="text-lg leading-none">{new Date(event.event_date).getDate()}</span>
                                        <span className="text-[9px] uppercase tracking-wider mt-0.5">
                                            {new Date(event.event_date).toLocaleString('default', { month: 'short' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {event.is_registered && (
                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-[10px] font-bold uppercase">
                                                Going
                                            </span>
                                        )}
                                        <span className={cn(
                                            "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                            event.is_paid 
                                                ? "bg-cosmic-gold/20 text-cosmic-gold border border-cosmic-gold/30" 
                                                : "bg-green-500/20 text-green-400 border border-green-500/20"
                                        )}>
                                            {event.is_paid ? `₹${event.price}` : 'Free'}
                                        </span>
                                    </div>
                                </div>

                                <h4 className="text-xl font-black mb-3 line-clamp-2 group-hover:text-cosmic-purple transition-colors">
                                    {event.title}
                                </h4>
                                
                                {event.description && (
                                    <p className="text-sm text-white/40 line-clamp-2 mb-4">
                                        {event.description}
                                    </p>
                                )}

                                <div className="space-y-3 mt-auto pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-xs text-white/50">
                                        <MapPin className="w-4 h-4 text-cosmic-purple" />
                                        <span className="truncate">{event.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-white/50">
                                        <Users className="w-4 h-4 text-cosmic-pink" />
                                        <span>{event.attendee_count} / {event.capacity || '∞'} attending</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-white/50">
                                        <Clock className="w-4 h-4 text-cosmic-blue" />
                                        <span>
                                            {new Date(event.event_date).toLocaleTimeString('en-US', { 
                                                hour: 'numeric', minute: '2-digit', hour12: true 
                                            })}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => quickRSVP(event.id, e)}
                                    className={cn(
                                        "mt-4 w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                                        event.is_registered
                                            ? "glass-inner text-white/70 hover:bg-red-500/10 hover:text-red-400"
                                            : "bg-cosmic-purple/20 text-cosmic-purple hover:bg-cosmic-purple/30",
                                        event.capacity && event.attendee_count >= event.capacity && !event.is_registered
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                    )}
                                    disabled={event.capacity !== null && event.attendee_count >= event.capacity && !event.is_registered}
                                >
                                    {event.is_registered ? (
                                        'Cancel RSVP'
                                    ) : event.capacity && event.attendee_count >= event.capacity ? (
                                        'Event Full'
                                    ) : (
                                        <>
                                            <CalendarPlus className="w-4 h-4" />
                                            Quick RSVP
                                        </>
                                    )}
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && filter === 'all' && !searchQuery && (
                <div className="mt-16">
                    <h3 className="text-xl font-black mb-6 text-white/40 tracking-tighter">Past Events</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {pastEvents.slice(0, 8).map((event) => (
                            <div 
                                key={event.id} 
                                className="glass-effect rounded-2xl p-4 opacity-50 hover:opacity-80 transition-all"
                            >
                                <h4 className="font-bold text-white text-sm mb-1 truncate">{event.title}</h4>
                                <p className="text-[10px] text-white/40 font-medium">
                                    {new Date(event.event_date).toLocaleDateString()}
                                </p>
                                <p className="text-[10px] text-white/30 mt-1">
                                    {event.attendee_count} attended
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
