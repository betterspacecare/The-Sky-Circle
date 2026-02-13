'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
    Calendar, MapPin, Users, ChevronLeft, Share2, ShieldCheck, Info, 
    Loader2, CheckCircle2, Clock, CalendarPlus, Copy, ExternalLink,
    MessageCircle, Star, X
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Event {
    id: string
    title: string
    description: string
    location: string
    latitude: number | null
    longitude: number | null
    event_date: string
    capacity: number | null
    is_paid: boolean
    price: number | null
    created_at: string
    created_by: string | null
}

interface Attendee {
    id: string
    user_id: string
    rsvp_at: string
    users: {
        display_name: string | null
        profile_photo_url: string | null
    } | null
}

export default function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const supabase = createClient()
    const [event, setEvent] = useState<Event | null>(null)
    const [loading, setLoading] = useState(true)
    const [registering, setRegistering] = useState(false)
    const [isRegistered, setIsRegistered] = useState(false)
    const [attendees, setAttendees] = useState<Attendee[]>([])
    const [userId, setUserId] = useState<string | null>(null)
    const [showShareModal, setShowShareModal] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        fetchEventData()
        setupRealtimeSubscription()
    }, [id])

    const setupRealtimeSubscription = () => {
        const channel = supabase
            .channel(`event-${id}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'event_attendees',
                filter: `event_id=eq.${id}`
            }, () => {
                fetchEventData()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }

    const fetchEventData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            setUserId(user?.id || null)

            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            setEvent(data)

            const { data: attendeeData } = await supabase
                .from('event_attendees')
                .select('*, users(display_name, profile_photo_url)')
                .eq('event_id', id)
                .order('rsvp_at', { ascending: true })

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
        if (!userId) {
            alert('Please log in to RSVP')
            return
        }

        setRegistering(true)
        try {
            if (isRegistered) {
                await supabase
                    .from('event_attendees')
                    .delete()
                    .eq('event_id', id)
                    .eq('user_id', userId)
                setIsRegistered(false)
            } else {
                if (event?.capacity && attendees.length >= event.capacity) {
                    alert('This event is full')
                    return
                }
                await supabase
                    .from('event_attendees')
                    .insert({ event_id: id, user_id: userId })
                setIsRegistered(true)
            }
            fetchEventData()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setRegistering(false)
        }
    }

    const handleShare = async () => {
        const shareUrl = window.location.href
        const shareText = `Join me at "${event?.title}" - ${new Date(event?.event_date || '').toLocaleDateString()}`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: event?.title,
                    text: shareText,
                    url: shareUrl
                })
            } catch (err) {
                // User cancelled or error
                setShowShareModal(true)
            }
        } else {
            setShowShareModal(true)
        }
    }

    const copyLink = async () => {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const addToCalendar = () => {
        if (!event) return
        
        const startDate = new Date(event.event_date)
        const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000) // 3 hours duration
        
        const formatDate = (date: Date) => {
            return date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, -1)
        }

        const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.location)}`
        
        window.open(googleCalUrl, '_blank')
    }

    const openInMaps = () => {
        if (!event) return
        
        if (event.latitude && event.longitude) {
            window.open(`https://www.google.com/maps?q=${event.latitude},${event.longitude}`, '_blank')
        } else {
            window.open(`https://www.google.com/maps/search/${encodeURIComponent(event.location)}`, '_blank')
        }
    }

    const isPastEvent = event ? new Date(event.event_date) < new Date() : false
    const spotsLeft = event?.capacity ? event.capacity - attendees.length : null
    const isFull = spotsLeft !== null && spotsLeft <= 0

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-10 h-10 text-cosmic-purple animate-spin" />
        </div>
    )

    if (!event) return null

    return (
        <div className="py-0">
            <Link
                href="/dashboard/events"
                className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group"
            >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back to events
            </Link>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-cosmic-purple/10 text-cosmic-purple rounded-full text-xs font-bold border border-cosmic-purple/20 uppercase tracking-widest">
                                <Star className="w-3 h-3" />
                                Observation Event
                            </span>
                            {isPastEvent && (
                                <span className="px-3 py-1 bg-white/10 text-white/50 rounded-full text-xs font-bold uppercase">
                                    Past Event
                                </span>
                            )}
                            {isRegistered && !isPastEvent && (
                                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold uppercase flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    You're Going
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black mb-6 leading-tight">{event.title}</h1>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 glass-effect rounded-xl p-4">
                                <div className="w-12 h-12 rounded-xl bg-cosmic-purple/20 flex items-center justify-center text-cosmic-purple">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-white/40">Date & Time</p>
                                    <p className="text-white font-medium">
                                        {new Date(event.event_date).toLocaleDateString(undefined, { 
                                            weekday: 'short', month: 'short', day: 'numeric' 
                                        })}
                                    </p>
                                    <p className="text-sm text-white/60">
                                        {new Date(event.event_date).toLocaleTimeString(undefined, { 
                                            hour: 'numeric', minute: '2-digit', hour12: true 
                                        })}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={openInMaps}
                                className="flex items-center gap-3 glass-effect rounded-xl p-4 text-left hover:bg-white/5 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-cosmic-pink/20 flex items-center justify-center text-cosmic-pink">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-white/40">Location</p>
                                    <p className="text-white font-medium truncate">{event.location}</p>
                                    <p className="text-xs text-cosmic-purple group-hover:underline">Open in Maps →</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="glass-effect rounded-2xl p-6 space-y-4">
                        <h3 className="text-lg font-bold border-b border-white/10 pb-3">About This Event</h3>
                        <p className="text-white/60 leading-relaxed whitespace-pre-wrap">
                            {event.description || 'No description provided.'}
                        </p>

                        <div className="grid sm:grid-cols-2 gap-4 pt-4">
                            <div className="p-4 glass-inner rounded-xl flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-white">Verified Guide</p>
                                    <p className="text-xs text-white/40">An experienced astronomer will lead this session.</p>
                                </div>
                            </div>
                            <div className="p-4 glass-inner rounded-xl flex items-start gap-3">
                                <Info className="w-5 h-5 text-cosmic-blue flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-white">Equipment</p>
                                    <p className="text-xs text-white/40">Bring your own telescope or binoculars if available.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Attendees */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-3">
                            <Users className="w-5 h-5 text-cosmic-purple" />
                            Attendees
                            <span className="text-sm font-normal text-white/40">
                                ({attendees.length}{event.capacity ? ` / ${event.capacity}` : ''})
                            </span>
                        </h3>
                        
                        {attendees.length === 0 ? (
                            <div className="glass-effect rounded-xl p-6 text-center">
                                <p className="text-white/40">No one has RSVP'd yet. Be the first!</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-3">
                                {attendees.map(a => (
                                    <div key={a.id} className="group relative">
                                        <div className={cn(
                                            "w-14 h-14 rounded-xl glass-effect overflow-hidden ring-2 transition-all",
                                            a.user_id === userId ? "ring-cosmic-purple" : "ring-transparent"
                                        )}>
                                            {a.users?.profile_photo_url ? (
                                                <img src={a.users.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cosmic-purple/20 to-cosmic-pink/20">
                                                    <span className="text-lg font-bold text-white/60">
                                                        {a.users?.display_name?.[0]?.toUpperCase() || '?'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-dark-50 border border-white/10 text-white px-2 py-1 rounded text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
                                            {a.users?.display_name || 'Observer'}
                                            {a.user_id === userId && ' (You)'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="glass-effect rounded-2xl p-6 lg:sticky lg:top-24">
                        <div className="text-center mb-6">
                            <p className="text-xs font-medium text-white/40 mb-1 uppercase tracking-wider">Entry Fee</p>
                            <h4 className="text-4xl font-black">
                                {event.is_paid ? `₹${event.price}` : 'FREE'}
                            </h4>
                        </div>

                        <div className="space-y-3 mb-6 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/40">Status</span>
                                <span className={cn(
                                    "font-bold",
                                    isPastEvent ? "text-white/40" : isFull ? "text-orange-400" : "text-green-400"
                                )}>
                                    {isPastEvent ? 'Ended' : isFull ? 'Full' : 'Open'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Spots</span>
                                <span className="font-bold">
                                    {attendees.length} / {event.capacity || '∞'}
                                </span>
                            </div>
                            {spotsLeft !== null && spotsLeft > 0 && !isPastEvent && (
                                <div className="flex justify-between">
                                    <span className="text-white/40">Available</span>
                                    <span className="font-bold text-cosmic-gold">{spotsLeft} left</span>
                                </div>
                            )}
                        </div>

                        {!isPastEvent && (
                            <button
                                onClick={handleRSVP}
                                disabled={registering || (isFull && !isRegistered)}
                                className={cn(
                                    "w-full py-4 rounded-xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed",
                                    isRegistered
                                        ? "bg-white/5 border border-white/10 text-white hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                                        : "bg-gradient-to-r from-cosmic-purple to-cosmic-blue shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] text-white"
                                )}
                            >
                                {registering ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : isRegistered ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Reserved
                                    </>
                                ) : isFull ? (
                                    'Event Full'
                                ) : (
                                    'RSVP Now'
                                )}
                            </button>
                        )}

                        {isRegistered && !isPastEvent && (
                            <p className="text-[10px] text-white/40 text-center mt-2">
                                Click to cancel your reservation
                            </p>
                        )}

                        <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-white/5">
                            <button 
                                onClick={handleShare}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl glass-inner hover:bg-white/5 transition-all group"
                            >
                                <Share2 className="w-5 h-5 text-white/40 group-hover:text-cosmic-purple transition-colors" />
                                <span className="text-[10px] uppercase font-bold text-white/40">Share</span>
                            </button>
                            <button 
                                onClick={addToCalendar}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl glass-inner hover:bg-white/5 transition-all group"
                            >
                                <CalendarPlus className="w-5 h-5 text-white/40 group-hover:text-cosmic-blue transition-colors" />
                                <span className="text-[10px] uppercase font-bold text-white/40">Calendar</span>
                            </button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/5 text-center">
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Organized by</p>
                            <p className="font-bold text-gradient">SkyGuild</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowShareModal(false)}
                >
                    <div 
                        className="glass-effect rounded-2xl p-6 max-w-md w-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">Share Event</h3>
                            <button 
                                onClick={() => setShowShareModal(false)}
                                className="p-2 glass-inner rounded-lg hover:bg-white/10 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={copyLink}
                                className="w-full flex items-center gap-3 p-4 glass-inner rounded-xl hover:bg-white/5 transition-all"
                            >
                                <Copy className="w-5 h-5 text-cosmic-purple" />
                                <span className="flex-1 text-left font-medium">
                                    {copied ? 'Copied!' : 'Copy Link'}
                                </span>
                                {copied && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                            </button>

                            <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join me at "${event.title}"`)}&url=${encodeURIComponent(window.location.href)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center gap-3 p-4 glass-inner rounded-xl hover:bg-white/5 transition-all"
                            >
                                <ExternalLink className="w-5 h-5 text-cosmic-blue" />
                                <span className="flex-1 text-left font-medium">Share on X</span>
                            </a>

                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(`Join me at "${event.title}" - ${window.location.href}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center gap-3 p-4 glass-inner rounded-xl hover:bg-white/5 transition-all"
                            >
                                <MessageCircle className="w-5 h-5 text-green-400" />
                                <span className="flex-1 text-left font-medium">Share on WhatsApp</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
