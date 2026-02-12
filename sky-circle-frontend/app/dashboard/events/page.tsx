'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, MapPin, Users, Info, ChevronRight, Clock, Star } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Event {
    id: string
    title: string
    description: string
    location: string
    event_date: string
    capacity: number
    is_paid: boolean
    price: number
    attendee_count: number
}

export default function EventsPage() {
    const supabase = createClient()
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchEvents()
    }, [])

    const fetchEvents = async () => {
        try {
            // In a real app, we'd join with event_attendees to get the count
            // For now, we'll fetch events and mock the attendee count if not in schema properly
            const { data, error } = await supabase
                .from('events')
                .select(`
                    *,
                    attendee_count:event_attendees(count)
                `)
                .order('event_date', { ascending: true })

            if (error) throw error

            const formattedEvents = data.map(event => ({
                ...event,
                attendee_count: event.attendee_count[0]?.count || 0
            }))

            setEvents(formattedEvents || [])
        } catch (error: any) {
            console.error('Error fetching events:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date())
    const pastEvents = events.filter(e => new Date(e.event_date) < new Date())

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
                <div>
                    <h1 className="text-4xl font-black mb-2 text-gradient tracking-tighter">Stellar Events</h1>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Join fellow observers in the deep blue</p>
                </div>
                <div className="flex gap-4">
                    <div className="glass-effect px-5 py-3 rounded-xl flex items-center gap-3">
                        <Clock className="w-5 h-5 text-cosmic-purple" />
                        <span className="text-sm font-medium">{upcomingEvents.length} Upcoming</span>
                    </div>
                </div>
            </div>

            {/* Featured Event / Alert */}
            <div className="relative rounded-3xl overflow-hidden mb-12 group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-cosmic-purple to-cosmic-blue opacity-85 group-hover:opacity-100 transition-opacity z-10" />
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&q=80&w=2070"
                        className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[2s]"
                        alt=""
                    />
                </div>
                <div className="relative z-20 p-8 md:p-12 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white mb-6 border border-white/10 uppercase tracking-widest">
                        Featured Event
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                        Messier Marathon 2026: The Ultimate Hunt
                    </h2>
                    <div className="flex flex-wrap gap-6 mb-8 text-white/80">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-cosmic-gold" />
                            <span>March 20, 2026</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-cosmic-gold" />
                            <span>Naya Raipur, CG</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-cosmic-gold" />
                            <span>12 Spots left</span>
                        </div>
                    </div>
                    <button className="px-8 py-4 bg-white text-cosmic-purple rounded-2xl font-black text-lg hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all flex items-center gap-3 active:scale-95">
                        Register Now
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Upcoming Events Grid */}
            <h3 className="text-2xl font-black mb-10 flex items-center gap-4 tracking-tighter text-white">
                <Star className="w-8 h-8 text-cosmic-gold drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]" />
                Upcoming Observations
            </h3>

            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-effect h-80 rounded-[2.5rem] animate-pulse" />
                    ))}
                </div>
            ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-24 glass-effect rounded-[2.5rem]">
                    <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">The skies are clear. No upcoming events scheduled.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {upcomingEvents.map(event => (
                        <Link
                            key={event.id}
                            href={`/dashboard/events/${event.id}`}
                            className="group glass-effect rounded-[2.5rem] overflow-hidden hover:scale-[1.02] transition-all duration-500 flex flex-col"
                        >
                            <div className="p-10 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cosmic-purple to-cosmic-pink flex flex-col items-center justify-center text-white font-black shadow-[0_10px_20px_rgba(192,132,252,0.3)]">
                                        <span className="text-xl leading-none">{new Date(event.event_date).getDate()}</span>
                                        <span className="text-[10px] uppercase tracking-widest mt-1">{new Date(event.event_date).toLocaleString('default', { month: 'short' })}</span>
                                    </div>
                                    <div className={cn(
                                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em]",
                                        event.is_paid ? "bg-cosmic-gold/20 text-cosmic-gold border border-cosmic-gold/30" : "bg-green-500/20 text-green-400 border border-green-500/20"
                                    )}>
                                        {event.is_paid ? `₹${event.price}` : 'Free Entry'}
                                    </div>
                                </div>

                                <h4 className="text-2xl font-black mb-4 line-clamp-2 group-hover:text-cosmic-purple transition-colors text-white tracking-tight">{event.title}</h4>

                                <div className="space-y-4 mt-auto pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                        <MapPin className="w-4 h-4 text-cosmic-purple" />
                                        <span className="truncate">{event.location}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                        <Users className="w-4 h-4 text-cosmic-pink" />
                                        <span>{event.attendee_count} / {event.capacity || '∞'} Stargazers</span>
                                    </div>

                                    <div className="pt-6 flex items-center justify-between group-hover:translate-x-1 transition-all">
                                        <span className="text-white text-[10px] font-black uppercase tracking-widest">Warp to details</span>
                                        <ChevronRight className="w-5 h-5 text-cosmic-purple" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
                <div className="mt-24">
                    <h3 className="text-2xl font-black mb-10 text-white/40 tracking-tighter">Archived Logs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {pastEvents.map((event) => (
                            <div key={event.id} className="glass-effect rounded-3xl p-6 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                                <h4 className="font-black text-white text-sm mb-2">{event.title}</h4>
                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{new Date(event.event_date).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
