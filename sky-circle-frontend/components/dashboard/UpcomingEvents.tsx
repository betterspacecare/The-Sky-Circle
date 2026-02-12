'use client'

import Link from 'next/link'
import { Calendar, MapPin, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface UpcomingEventsProps {
    events: any[]
}

export default function UpcomingEvents({ events }: UpcomingEventsProps) {
    if (events.length === 0) {
        return (
            <div className="glass-effect rounded-[2.5rem] p-10">
                <h2 className="text-2xl font-black mb-6 tracking-tighter text-white">Upcoming Events</h2>
                <p className="text-white/40 text-center py-10 font-bold uppercase tracking-widest text-[10px]">The skies are quiet today. No upcoming events.</p>
            </div>
        )
    }

    return (
        <div className="glass-effect rounded-[2.5rem] p-10">
            <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black tracking-tighter text-white">Upcoming Events</h2>
                <Link href="/dashboard/events" className="text-cosmic-purple hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.15em]">
                    Satellite view
                </Link>
            </div>

            <div className="space-y-4">
                {events.map((event) => (
                    <Link
                        key={event.id}
                        href={`/dashboard/events/${event.id}`}
                        className="block p-5 rounded-2xl glass-inner hover:bg-white/[0.06] transition-all group"
                    >
                        <h3 className="font-black text-sm mb-3 text-white tracking-tight">{event.title}</h3>
                        <div className="flex flex-wrap gap-6 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-cosmic-purple" />
                                {formatDate(event.event_date)}
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-cosmic-purple" />
                                {event.location}
                            </div>
                            {event.capacity && (
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-cosmic-pink" />
                                    {event.capacity} Spots
                                </div>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
