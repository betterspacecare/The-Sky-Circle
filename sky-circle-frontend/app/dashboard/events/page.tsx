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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-black mb-1 sm:mb-2 text-gradient tracking-tighter">Stellar Events</h1>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">Join fellow observers under the stars</p>
                </div>
                <div className="flex gap-2 sm:gap-3">
                    <div className="glass-effect px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cosmic-purple" />
                        <span className="text-xs sm:text-sm font-medium">{upcomingEvents.length} Upcoming</span>
                    </div>
                    <div className="glass-effect px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cosmic-pink" />
                        <span className="text-xs sm:text-sm font-medium">{events.filter(e => e.is_registered).length} Registered</span>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="relative">
                    <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/30" />
                    <input
                        type="text"
                        placeholder="Search events..."
                        className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 glass-input rounded-xl text-sm sm:text-base text-white placeholder:text-white/30"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    {(['all', 'free', 'paid', 'registered'] as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all capitalize whitespace-nowrap",
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
                    className="relative rounded-2xl sm:rounded-3xl overflow-hidden mb-8 sm:mb-12 group cursor-pointer block"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-cosmic-purple to-cosmic-blue opacity-85 group-hover:opacity-100 transition-opacity z-10" />
                    <div className="absolute inset-0 z-0">
                        <img
                            src="https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&q=80&w=2070"
                            className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[2s]"
                            alt=""
                        />
                    </div>
                    <div className="relative z-20 p-5 sm:p-8 md:p-12">
                        <div className="flex flex-col gap-4 sm:gap-6">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] sm:text-xs font-bold text-white mb-3 sm:mb-6 border border-white/10 uppercase tracking-widest">
                                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    Featured Event
                                </div>
                                <h2 className="text-xl sm:text-3xl md:text-5xl font-black text-white mb-3 sm:mb-6 leading-tight">
                                    {featuredEvent.title}
                                </h2>
                                <div className="flex flex-wrap gap-3 sm:gap-6 text-white/80 text-xs sm:text-base">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-cosmic-gold" />
                                        <span>{new Date(featuredEvent.event_date).toLocaleDateString('en-US', { 
                                            weekday: 'short', month: 'short', day: 'numeric'
                                        })}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-cosmic-gold" />
                                        <span className="truncate max-w-[120px] sm:max-w-none">{featuredEvent.location}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-cosmic-gold" />
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
                                    "w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg transition-all flex items-center justify-center gap-2 sm:gap-3 active:scale-95",
                                    featuredEvent.is_registered
                                        ? "bg-white/20 text-white border border-white/30 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300"
                                        : "bg-white text-cosmic-purple hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                                )}
                            >
                                {featuredEvent.is_registered ? 'Cancel RSVP' : 'Register Now'}
                                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>
                    </div>
                </Link>
            )}

            {/* Upcoming Events Grid */}
            <h3 className="text-xl sm:text-2xl font-black mb-4 sm:mb-8 flex items-center gap-2 sm:gap-4 tracking-tighter text-white">
                <Star className="w-5 h-5 sm:w-7 sm:h-7 text-cosmic-gold drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]" />
                {filter === 'registered' ? 'My Registered Events' : 'Upcoming Events'}
            </h3>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-effect h-64 sm:h-72 rounded-2xl sm:rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : filteredUpcoming.length === 0 ? (
                <div className="text-center py-12 sm:py-16 glass-effect rounded-2xl sm:rounded-3xl">
                    <Eye className="w-10 h-10 sm:w-12 sm:h-12 text-white/20 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-white/40 font-medium">
                        {searchQuery || filter !== 'all' 
                            ? 'No events match your search' 
                            : 'No upcoming events scheduled'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredUpcoming.map(event => (
                        <Link
                            key={event.id}
                            href={`/dashboard/events/${event.id}`}
                            className="group glass-effect rounded-2xl sm:rounded-3xl overflow-hidden hover:scale-[1.02] transition-all duration-300 flex flex-col"
                        >
                            <div className="p-4 sm:p-6 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4 sm:mb-6">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cosmic-purple to-cosmic-pink flex flex-col items-center justify-center text-white font-black shadow-lg">
                                        <span className="text-base sm:text-lg leading-none">{new Date(event.event_date).getDate()}</span>
                                        <span className="text-[8px] sm:text-[9px] uppercase tracking-wider mt-0.5">
                                            {new Date(event.event_date).toLocaleString('default', { month: 'short' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        {event.is_registered && (
                                            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-500/20 text-green-400 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase">
                                                Going
                                            </span>
                                        )}
                                        <span className={cn(
                                            "px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider",
                                            event.is_paid 
                                                ? "bg-cosmic-gold/20 text-cosmic-gold border border-cosmic-gold/30" 
                                                : "bg-green-500/20 text-green-400 border border-green-500/20"
                                        )}>
                                            {event.is_paid ? `₹${event.price}` : 'Free'}
                                        </span>
                                    </div>
                                </div>

                                <h4 className="text-base sm:text-xl font-black mb-2 sm:mb-3 line-clamp-2 group-hover:text-cosmic-purple transition-colors">
                                    {event.title}
                                </h4>
                                
                                {event.description && (
                                    <p className="text-xs sm:text-sm text-white/40 line-clamp-2 mb-3 sm:mb-4">
                                        {event.description}
                                    </p>
                                )}

                                <div className="space-y-2 sm:space-y-3 mt-auto pt-3 sm:pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-white/50">
                                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cosmic-purple" />
                                        <span className="truncate">{event.location}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-white/50">
                                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cosmic-pink" />
                                        <span>{event.attendee_count} / {event.capacity || '∞'} attending</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-white/50">
                                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cosmic-blue" />
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
                                        "mt-3 sm:mt-4 w-full py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2",
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
                                            <CalendarPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                <div className="mt-10 sm:mt-16">
                    <h3 className="text-lg sm:text-xl font-black mb-4 sm:mb-6 text-white/40 tracking-tighter">Past Events</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {pastEvents.slice(0, 8).map((event) => (
                            <div 
                                key={event.id} 
                                className="glass-effect rounded-xl sm:rounded-2xl p-3 sm:p-4 opacity-50 hover:opacity-80 transition-all"
                            >
                                <h4 className="font-bold text-white text-xs sm:text-sm mb-1 truncate">{event.title}</h4>
                                <p className="text-[9px] sm:text-[10px] text-white/40 font-medium">
                                    {new Date(event.event_date).toLocaleDateString()}
                                </p>
                                <p className="text-[9px] sm:text-[10px] text-white/30 mt-1">
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
