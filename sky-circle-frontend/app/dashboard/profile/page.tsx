'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Settings, Camera, Trophy, Star, MapPin, Telescope, Edit3, Loader2, LogOut, Shield, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EXPERIENCE_LEVELS, STORAGE_BUCKETS } from '@/lib/constants'
import { useRouter } from 'next/navigation'

interface UserProfile {
    id: string
    display_name: string
    bio: string
    profile_photo_url: string
    telescope_type: string
    experience_level: string
    level: number
    total_points: number
    referral_code: string
    is_event_creator: boolean
    guild_leader_application_status: string | null
}

export default function ProfilePage() {
    const supabase = createClient()
    const router = useRouter()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [badges, setBadges] = useState<any[]>([])
    const [applyingGuildLeader, setApplyingGuildLeader] = useState(false)
    const [applicationReason, setApplicationReason] = useState('')
    const [showApplicationModal, setShowApplicationModal] = useState(false)

    const [editForm, setEditForm] = useState({
        display_name: '',
        bio: '',
        telescope_type: '',
        experience_level: ''
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) throw error
            setProfile(data)
            setEditForm({
                display_name: data.display_name || '',
                bio: data.bio || '',
                telescope_type: data.telescope_type || '',
                experience_level: data.experience_level || 'beginner'
            })

            // Fetch badges
            const { data: badgeData } = await supabase
                .from('user_badges')
                .select('*, badges(*)')
                .eq('user_id', user.id)

            setBadges(badgeData || [])
        } catch (error: any) {
            console.error('Error fetching profile:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No user context')

            const { error } = await supabase
                .from('users')
                .update(editForm)
                .eq('id', user.id)

            if (error) throw error
            setProfile({ ...profile!, ...editForm })
            setEditing(false)
        } catch (error: any) {
            alert(error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    const handleGuildLeaderApplication = async () => {
        if (!applicationReason.trim()) return
        
        setApplyingGuildLeader(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Insert application
            const { error } = await supabase
                .from('guild_leader_applications')
                .insert({
                    user_id: user.id,
                    reason: applicationReason,
                    status: 'pending'
                })

            if (error) throw error

            // Update user's application status
            await supabase
                .from('users')
                .update({ guild_leader_application_status: 'pending' })
                .eq('id', user.id)

            setProfile({ ...profile!, guild_leader_application_status: 'pending' })
            setShowApplicationModal(false)
            setApplicationReason('')
            alert('Application submitted! We\'ll review it soon.')
        } catch (error: any) {
            alert('Failed to submit application: ' + error.message)
        } finally {
            setApplyingGuildLeader(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-10 h-10 text-cosmic-purple animate-spin" />
        </div>
    )

    if (!profile) return null

    return (
        <div className="py-0">
            {/* Header / Banner */}
            <div className="relative rounded-[3rem] overflow-hidden mb-12 h-64 group">
                <div className="absolute inset-0 bg-gradient-to-r from-cosmic-purple/40 to-cosmic-blue/40 z-10" />
                <div className="absolute inset-0 z-0">
                    <div className="w-full h-full bg-[#0a0e27] starfield" />
                </div>

                {/* Profile Photo Overlay */}
                <div className="absolute -bottom-16 left-12 z-20 flex items-end gap-6">
                    <div className="relative">
                        <div className="w-40 h-40 rounded-[2.5rem] border-8 border-background overflow-hidden bg-white/5 shadow-2xl">
                            {profile.profile_photo_url ? (
                                <img src={profile.profile_photo_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <User className="w-20 h-20 m-10 text-gray-700" />
                            )}
                        </div>
                        <button className="absolute bottom-4 right-4 p-2 bg-cosmic-purple rounded-xl text-white shadow-lg active:scale-90 transition-transform">
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-6 right-12 z-20 flex gap-4">
                    <button
                        onClick={() => setEditing(!editing)}
                        className="px-6 py-2 bg-white/10 backdrop-blur-md rounded-xl font-bold flex items-center gap-2 border border-white/10 hover:bg-white/20 transition-all"
                    >
                        {editing ? 'Cancel' : <><Edit3 className="w-4 h-4" /> Edit Profile</>}
                    </button>
                    <button
                        onClick={handleSignOut}
                        className="px-4 py-2 bg-red-500/10 backdrop-blur-md rounded-xl font-bold text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-12 mt-20">
                {/* Left Column: Stats & Meta */}
                <div className="space-y-8">
                    <div className="glass-effect rounded-[2rem] p-8">
                        <h1 className="text-3xl font-black mb-2">{profile.display_name || 'Cosmic Traveler'}</h1>
                        <p className="text-cosmic-purple font-bold mb-6">@{profile.id.substring(0, 8)}</p>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl glass-inner flex items-center justify-center text-cosmic-gold">
                                    <Star className="w-6 h-6 fill-current" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-white/40">Total Points</p>
                                    <p className="text-xl font-black">{profile.total_points.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl glass-inner flex items-center justify-center text-cosmic-purple">
                                    <Trophy className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-white/40">Level</p>
                                    <p className="text-xl font-black">{profile.level}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5">
                            <p className="text-sm text-white/50 mb-4">{profile.bio || 'This observer hasn\'t written a bio yet.'}</p>
                            <div className="flex flex-wrap gap-2">
                                <div className="px-3 py-1 glass-inner rounded-full text-xs font-bold text-white/50 flex items-center gap-2">
                                    <Telescope className="w-3 h-3" />
                                    {profile.telescope_type || 'No Telescope'}
                                </div>
                                <div className="px-3 py-1 glass-purple text-cosmic-purple rounded-full text-xs font-bold flex items-center gap-2">
                                    <MapPin className="w-3 h-3" />
                                    Earth
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Referral Card */}
                    <div className="glass-purple rounded-[2rem] p-8">
                        <h4 className="font-black text-xl mb-4 text-gradient">Refer a Friend</h4>
                        <p className="text-xs text-white/50 mb-6">Give your friends 50 pts and earn 50 pts yourself when they log their first discovery.</p>
                        <div className="glass-inner rounded-xl p-3 flex items-center justify-between">
                            <code className="font-bold text-cosmic-purple">{profile.referral_code}</code>
                            <button className="text-[10px] font-black uppercase tracking-widest bg-cosmic-purple px-3 py-1 rounded-full">Copy</button>
                        </div>
                    </div>

                    {/* Guild Leader Status */}
                    <div className="glass-effect rounded-[2rem] p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="w-6 h-6 text-cosmic-purple" />
                            <h4 className="font-black text-xl">Guild Leader</h4>
                        </div>
                        
                        {profile.is_event_creator ? (
                            <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                                <div>
                                    <p className="font-bold text-green-400">Approved</p>
                                    <p className="text-xs text-white/50">You can create guilds and organize events</p>
                                </div>
                            </div>
                        ) : profile.guild_leader_application_status === 'pending' ? (
                            <div className="flex items-center gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                <Clock className="w-5 h-5 text-amber-400" />
                                <div>
                                    <p className="font-bold text-amber-400">Application Pending</p>
                                    <p className="text-xs text-white/50">We're reviewing your application</p>
                                </div>
                            </div>
                        ) : profile.guild_leader_application_status === 'rejected' ? (
                            <div>
                                <p className="text-sm text-white/50 mb-4">Your previous application was not approved. You can apply again.</p>
                                <button
                                    onClick={() => setShowApplicationModal(true)}
                                    className="w-full py-3 bg-cosmic-purple/20 text-cosmic-purple rounded-xl font-bold hover:bg-cosmic-purple/30 transition-all"
                                >
                                    Apply Again
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-white/50 mb-4">Become a Guild Leader to create astronomy groups and organize free stargazing events for the community.</p>
                                <button
                                    onClick={() => setShowApplicationModal(true)}
                                    className="w-full py-3 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-xl font-bold hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all"
                                >
                                    Apply to Become a Guild Leader
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Content / Edit Form */}
                <div className="lg:col-span-2 space-y-8">
                    {editing ? (
                        <div className="glass-effect rounded-[2.5rem] p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-black">Edit Your Profile</h2>

                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Display Name</label>
                                    <input
                                        type="text"
                                        className="w-full glass-inner rounded-2xl p-4 focus:ring-2 focus:ring-cosmic-purple/50 transition-all text-white"
                                        value={editForm.display_name}
                                        onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Experience Level</label>
                                    <select
                                        className="w-full glass-inner rounded-2xl p-4 focus:ring-2 focus:ring-cosmic-purple/50 transition-all text-white"
                                        value={editForm.experience_level}
                                        onChange={(e) => setEditForm({ ...editForm, experience_level: e.target.value })}
                                    >
                                        {EXPERIENCE_LEVELS.map(level => (
                                            <option key={level.value} value={level.value} className="bg-[#050810]">{level.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Bio</label>
                                <textarea
                                    rows={4}
                                    className="w-full glass-inner rounded-2xl p-4 focus:ring-2 focus:ring-cosmic-purple/50 transition-all resize-none text-white"
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Telescope / Equipment</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Celestron NexStar 8SE"
                                    className="w-full glass-inner rounded-2xl p-4 focus:ring-2 focus:ring-cosmic-purple/50 transition-all text-white placeholder:text-white/20"
                                    value={editForm.telescope_type}
                                    onChange={(e) => setEditForm({ ...editForm, telescope_type: e.target.value })}
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-4 bg-gradient-to-r from-cosmic-purple to-cosmic-blue rounded-2xl font-black text-xl hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Save Changes'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {/* Badges Section */}
                            <section>
                                <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                                    <Trophy className="w-6 h-6 text-cosmic-gold" />
                                    Badges Earned
                                    <span className="text-sm font-normal text-gray-500">({badges.length})</span>
                                </h3>

                                {badges.length === 0 ? (
                                    <div className="glass-effect rounded-3xl p-12 text-center">
                                        <p className="text-white/40 italic">Complete missions and log observations to earn badges!</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
                                        {badges.map(b => (
                                            <div key={b.id} className="group relative">
                                                <div className="aspect-square rounded-2xl glass-effect p-3 flex flex-col items-center justify-center group-hover:scale-105 transition-all cursor-help">
                                                    <div className="w-full h-full glass-gold rounded-xl mb-2 flex items-center justify-center">
                                                        <Star className="w-8 h-8 text-cosmic-gold fill-cosmic-gold" />
                                                    </div>
                                                </div>
                                                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-white text-black px-3 py-2 rounded-xl text-xs font-bold opacity-0 group-hover:opacity-100 transition-all z-30 pointer-events-none shadow-2xl w-32 text-center">
                                                    <p className="text-[10px] text-cosmic-purple font-black uppercase mb-1">{b.badges?.name}</p>
                                                    <p className="text-[9px] text-gray-600 leading-tight">{b.badges?.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Recent Activity Section */}
                            <section>
                                <h3 className="text-2xl font-black mb-8">Recent Discoveries</h3>
                                <div className="glass-effect rounded-3xl p-12 text-center">
                                    <p className="text-white/40 italic">No recent activity to show.</p>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>

            {/* Guild Leader Application Modal */}
            {showApplicationModal && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowApplicationModal(false)}
                >
                    <div 
                        className="glass-effect rounded-3xl p-8 max-w-md w-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="w-8 h-8 text-cosmic-purple" />
                            <h3 className="text-2xl font-black">Become a Guild Leader</h3>
                        </div>
                        
                        <p className="text-white/50 mb-6">
                            Guild Leaders can create astronomy groups and organize free stargazing events. 
                            Tell us why you'd like to become a Guild Leader.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">
                                    Why do you want to become a Guild Leader?
                                </label>
                                <textarea
                                    value={applicationReason}
                                    onChange={(e) => setApplicationReason(e.target.value)}
                                    className="w-full px-4 py-3 glass-inner rounded-xl resize-none text-white placeholder:text-white/30"
                                    rows={4}
                                    placeholder="Share your astronomy experience, what kind of events you'd like to organize, etc."
                                    required
                                />
                            </div>

                            <div className="glass-inner rounded-xl p-4 text-sm text-white/50">
                                <p className="font-bold text-white/70 mb-2">Requirements:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Active member with at least 5 observations</li>
                                    <li>Genuine interest in astronomy education</li>
                                    <li>Commitment to organizing quality events</li>
                                </ul>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowApplicationModal(false)}
                                    className="flex-1 py-3 glass-inner rounded-xl font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGuildLeaderApplication}
                                    disabled={applyingGuildLeader || !applicationReason.trim()}
                                    className="flex-1 py-3 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {applyingGuildLeader ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Submit Application'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
