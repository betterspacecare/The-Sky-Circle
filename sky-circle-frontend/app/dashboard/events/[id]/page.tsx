'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, MapPin, Users, ChevronLeft, Share2, ShieldCheck, Info, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
    created_at: string
}

export default function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const supabase = createClient()
    const [event, setEvent] = useState<Event | null>(null)
    const [loading, setLoading] = useState(true)
    const [registering, setRegistering] = useState(false)
    const [isRegistered, setIsRegistered] = useState(false)
    const [attendees, setAttendees] = useState<any[]>([])

    useEffect(() => {
        fetchEventData()
    }, [id])

    const fetchEventData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            // Get event details
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            setEvent(data)

            // Get attendees
            const { data: attendeeData } = await supabase
                .from('event_attendees')
                .select('*, users(display_name, profile_photo_url)')
                .eq('event_id', id)

            setAttendees(attendeeData || [])

            if (user) {
                const registered = attendeeData?.some(a => a.user_id === user.id)
                setIsRegistered(!!registered)
            }
        } catch (error: any) {
            console.error('Error fetching event:', error.message)
            router.push('/dashboard/events')
        } finally {
            setLoading(false)
        }
    }

    const handleRSVP = async () => {
        setRegistering(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Auth required')

            if (isRegistered) {
                await supabase
                    .from('event_attendees')
                    .delete()
                    .eq('event_id', id)
                    .eq('user_id', user.id)
                setIsRegistered(false)
            } else {
                await supabase
                    .from('event_attendees')
                    .insert({ event_id: id, user_id: user.id })
                setIsRegistered(true)
            }
            fetchEventData() // Refresh list
        } catch (error: any) {
            alert(error.message)
        } finally {
            setRegistering(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-10 h-10 text-cosmic-purple animate-spin" />
        </div>
    )

    if (!event) return null

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <Link
                href="/dashboard/events"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
            >
                <ChevronLeft className="w-5 h-5" />
                Back to events
            </Link>

            <div className="grid lg:grid-cols-3 gap-12">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-12">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cosmic-purple/10 text-cosmic-purple rounded-full text-xs font-bold border border-cosmic-purple/20 uppercase tracking-widest mb-6">
                            Observation Event
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-8 leading-tight">{event.title}</h1>

                        <div className="flex flex-wrap gap-6 text-gray-400">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-cosmic-purple">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Date</p>
                                    <p className="text-white font-medium">{new Date(event.event_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-cosmic-purple">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Location</p>
                                    <p className="text-white font-medium">{event.location}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-effect rounded-3xl p-8 space-y-6">
                        <h3 className="text-2xl font-bold border-b border-white/10 pb-4">Event Description</h3>
                        <p className="text-white/50 leading-relaxed whitespace-pre-wrap">
                            {event.description}
                        </p>

                        <div className="grid sm:grid-cols-2 gap-6 pt-6">
                            <div className="p-4 glass-inner rounded-2xl flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-white">Verified Guide</p>
                                    <p className="text-xs text-white/40">An experienced astronomer will be leading this session.</p>
                                </div>
                            </div>
                            <div className="p-4 glass-inner rounded-2xl flex items-start gap-3">
                                <Info className="w-5 h-5 text-cosmic-blue flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-white">Equipment Required</p>
                                    <p className="text-xs text-white/40">Bring your own telescope or binoculars if available.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Attendees Preview */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold flex items-center gap-3">
                            Observers Attending
                            <span className="text-sm font-normal text-gray-500">({attendees.length} people)</span>
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            {attendees.map(a => (
                                <div key={a.id} className="group relative">
                                    <div className="w-14 h-14 rounded-2xl glass-inner overflow-hidden">
                                        {a.users?.profile_photo_url ? (
                                            <img src={a.users.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Users className="w-6 h-6 text-white/30" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
                                        {a.users?.display_name || 'Observer'}
                                    </div>
                                </div>
                            ))}
                            {attendees.length === 0 && (
                                <p className="text-gray-500 italic">Be the first one to RSVP!</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Card */}
                <div className="space-y-6">
                    <div className="glass-effect rounded-3xl p-8 sticky top-24 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cosmic-purple/10 rounded-full blur-3xl -z-10" />

                        <div className="text-center mb-8">
                            <p className="text-sm font-medium text-gray-400 mb-1">Entry Fee</p>
                            <h4 className="text-4xl font-black">
                                {event.is_paid ? `$${event.price}` : 'FREE'}
                            </h4>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Status</span>
                                <span className="text-green-400 font-bold">Open</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Confirmed Spots</span>
                                <span className="font-bold">{attendees.length} / {event.capacity || '∞'}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleRSVP}
                            disabled={registering || (event.capacity && attendees.length >= event.capacity && !isRegistered)}
                            className={cn(
                                "w-full py-4 rounded-xl font-black text-xl transition-all active:scale-95 flex items-center justify-center gap-3",
                                isRegistered
                                    ? "bg-white/5 border border-white/10 text-white hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500"
                                    : "bg-gradient-to-r from-cosmic-purple to-cosmic-blue shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_40px_rgba(139,92,246,0.7)] text-white"
                            )}
                        >
                            {registering ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : isRegistered ? (
                                <>
                                    <CheckCircle2 className="w-6 h-6" />
                                    Reserved
                                </>
                            ) : (
                                'RSVP Now'
                            )}
                        </button>

                        <p className="text-[10px] text-gray-500 text-center mt-4 uppercase tracking-widest font-bold">
                            {isRegistered ? 'Click to cancel reservation' : 'Instantly join the event'}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/5">
                            <button className="flex flex-col items-center gap-2 group">
                                <div className="w-10 h-10 rounded-full glass-inner flex items-center justify-center group-hover:bg-cosmic-purple/20 transition-colors">
                                    <Share2 className="w-4 h-4 text-white/40 group-hover:text-cosmic-purple" />
                                </div>
                                <span className="text-[10px] uppercase font-bold text-white/40">Share</span>
                            </button>
                            <Link href="/dashboard/events" className="flex flex-col items-center gap-2 group">
                                <div className="w-10 h-10 rounded-full glass-inner flex items-center justify-center group-hover:bg-cosmic-blue/20 transition-colors">
                                    <Info className="w-4 h-4 text-white/40 group-hover:text-cosmic-blue" />
                                </div>
                                <span className="text-[10px] uppercase font-bold text-white/40">Rules</span>
                            </Link>
                        </div>
                    </div>

                    <div className="glass-effect rounded-2xl p-6 text-center">
                        <p className="text-xs text-white/40 uppercase tracking-widest font-black mb-1">Organizer</p>
                        <p className="font-bold text-gradient">The Sky Circle Official</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
