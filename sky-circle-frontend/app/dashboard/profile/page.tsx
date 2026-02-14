'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Camera, Trophy, Star, MapPin, Telescope, Edit3, Loader2, LogOut, Shield, CheckCircle2, Clock } from 'lucide-react'
import { EXPERIENCE_LEVELS } from '@/lib/constants'
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
    const [uploadingPhoto, setUploadingPhoto] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

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

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB')
            return
        }

        setUploadingPhoto(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
            // Store in user-specific folder: {user_id}/avatar.{ext}
            const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { 
                    upsert: true,
                    contentType: file.type
                })

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            // Update user profile
            const { error: updateError } = await supabase
                .from('users')
                .update({ profile_photo_url: publicUrl })
                .eq('id', user.id)

            if (updateError) throw updateError

            setProfile({ ...profile!, profile_photo_url: publicUrl })
        } catch (error: any) {
            console.error('Upload error:', error)
            alert('Failed to upload photo: ' + error.message)
        } finally {
            setUploadingPhoto(false)
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
            {/* Header Card */}
            <div className="glass-effect rounded-2xl sm:rounded-[2rem] overflow-hidden mb-6 sm:mb-8">
                {/* Banner */}
                <div className="relative h-24 sm:h-32">
                    <div className="absolute inset-0 bg-gradient-to-r from-cosmic-purple/60 via-cosmic-blue/40 to-cosmic-pink/60" />
                    <div className="absolute inset-0 bg-[#0a0e27] starfield opacity-50" />
                    
                    {/* Action buttons on banner */}
                    <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 flex gap-2">
                        <button
                            onClick={() => setEditing(!editing)}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-md rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 border border-white/20 hover:bg-white/20 transition-all"
                        >
                            {editing ? 'Cancel' : <><Edit3 className="w-3.5 h-3.5" /> Edit</>}
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="p-1.5 sm:p-2 bg-red-500/20 backdrop-blur-md rounded-lg text-red-400 border border-red-500/20 hover:bg-red-500/30 transition-all"
                            title="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Profile Info Section */}
                <div className="relative px-4 sm:px-6 pb-5 sm:pb-6">
                    {/* Profile Photo - positioned to overlap banner */}
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-[#0a0e17] overflow-hidden bg-white/5 shadow-xl">
                                {profile.profile_photo_url ? (
                                    <img src={profile.profile_photo_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cosmic-purple/20 to-cosmic-blue/20">
                                        <User className="w-10 h-10 sm:w-12 sm:h-12 text-white/30" />
                                    </div>
                                )}
                                {uploadingPhoto && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="hidden"
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingPhoto}
                                className="absolute -bottom-1 -right-1 p-1.5 bg-cosmic-purple rounded-lg text-white shadow-lg hover:bg-cosmic-purple/80 active:scale-90 transition-all disabled:opacity-50"
                            >
                                <Camera className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Name and quick stats */}
                        <div className="flex-1 min-w-0 sm:pb-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                                <div className="min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-black truncate">{profile.display_name || 'Cosmic Traveler'}</h1>
                                    <p className="text-cosmic-purple font-medium text-sm">@{profile.id.substring(0, 8)}</p>
                                </div>
                                
                                {/* Quick stats inline */}
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 glass-inner rounded-lg">
                                        <Star className="w-4 h-4 text-cosmic-gold fill-cosmic-gold" />
                                        <span className="font-bold text-sm">{profile.total_points.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 glass-inner rounded-lg">
                                        <Trophy className="w-4 h-4 text-cosmic-purple" />
                                        <span className="font-bold text-sm">Lvl {profile.level}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bio and tags */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-sm text-white/60 mb-3">{profile.bio || 'This observer hasn\'t written a bio yet.'}</p>
                        <div className="flex flex-wrap gap-2">
                            <div className="px-2.5 py-1 glass-inner rounded-full text-xs font-medium text-white/50 flex items-center gap-1.5">
                                <Telescope className="w-3 h-3" />
                                {profile.telescope_type || 'No Telescope'}
                            </div>
                            <div className="px-2.5 py-1 glass-purple text-cosmic-purple rounded-full text-xs font-medium flex items-center gap-1.5">
                                <MapPin className="w-3 h-3" />
                                Earth
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Left Column: Stats & Meta */}
                <div className="space-y-4 sm:space-y-6">
                    {/* Stats Card */}
                    <div className="glass-effect rounded-2xl p-5 sm:p-6">
                        <h4 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-4">Statistics</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl glass-inner flex items-center justify-center text-cosmic-gold">
                                    <Star className="w-5 h-5 fill-current" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-white/40">Total Points</p>
                                    <p className="text-lg font-black">{profile.total_points.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl glass-inner flex items-center justify-center text-cosmic-purple">
                                    <Trophy className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-white/40">Level</p>
                                    <p className="text-lg font-black">{profile.level}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Referral Card */}
                    <div className="glass-purple rounded-2xl p-5 sm:p-6">
                        <h4 className="font-bold text-base mb-3 text-gradient">Refer a Friend</h4>
                        <p className="text-xs text-white/50 mb-4">Give your friends 50 pts and earn 50 pts yourself when they log their first discovery.</p>
                        <div className="glass-inner rounded-lg p-2.5 flex items-center justify-between">
                            <code className="font-bold text-cosmic-purple text-sm">{profile.referral_code}</code>
                            <button className="text-[10px] font-bold uppercase tracking-wider bg-cosmic-purple px-2.5 py-1 rounded-full hover:bg-cosmic-purple/80 transition-all">Copy</button>
                        </div>
                    </div>

                    {/* Guild Leader Status */}
                    <div className="glass-effect rounded-2xl p-5 sm:p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Shield className="w-5 h-5 text-cosmic-purple" />
                            <h4 className="font-bold text-base">Guild Leader</h4>
                        </div>
                        
                        {profile.is_event_creator ? (
                            <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                <div>
                                    <p className="font-bold text-green-400 text-sm">Approved</p>
                                    <p className="text-[10px] text-white/50">You can create guilds and organize events</p>
                                </div>
                            </div>
                        ) : profile.guild_leader_application_status === 'pending' ? (
                            <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <Clock className="w-4 h-4 text-amber-400" />
                                <div>
                                    <p className="font-bold text-amber-400 text-sm">Application Pending</p>
                                    <p className="text-[10px] text-white/50">We're reviewing your application</p>
                                </div>
                            </div>
                        ) : profile.guild_leader_application_status === 'rejected' ? (
                            <div>
                                <p className="text-xs text-white/50 mb-3">Your previous application was not approved. You can apply again.</p>
                                <button
                                    onClick={() => setShowApplicationModal(true)}
                                    className="w-full py-2.5 bg-cosmic-purple/20 text-cosmic-purple rounded-lg text-sm font-bold hover:bg-cosmic-purple/30 transition-all"
                                >
                                    Apply Again
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p className="text-xs text-white/50 mb-3">Become a Guild Leader to create astronomy groups and organize free stargazing events.</p>
                                <button
                                    onClick={() => setShowApplicationModal(true)}
                                    className="w-full py-2.5 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-lg text-sm font-bold hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all"
                                >
                                    Apply to Become a Guild Leader
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Content / Edit Form */}
                <div className="lg:col-span-2 space-y-6">
                    {editing ? (
                        <div className="glass-effect rounded-2xl p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-xl font-bold">Edit Your Profile</h2>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Display Name</label>
                                    <input
                                        type="text"
                                        className="w-full glass-inner rounded-xl p-3 focus:ring-2 focus:ring-cosmic-purple/50 transition-all text-sm text-white"
                                        value={editForm.display_name}
                                        onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Experience Level</label>
                                    <select
                                        className="w-full glass-inner rounded-xl p-3 focus:ring-2 focus:ring-cosmic-purple/50 transition-all text-sm text-white"
                                        value={editForm.experience_level}
                                        onChange={(e) => setEditForm({ ...editForm, experience_level: e.target.value })}
                                    >
                                        {EXPERIENCE_LEVELS.map(level => (
                                            <option key={level.value} value={level.value} className="bg-[#050810]">{level.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Bio</label>
                                <textarea
                                    rows={3}
                                    className="w-full glass-inner rounded-xl p-3 focus:ring-2 focus:ring-cosmic-purple/50 transition-all resize-none text-sm text-white"
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Telescope / Equipment</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Celestron NexStar 8SE"
                                    className="w-full glass-inner rounded-xl p-3 focus:ring-2 focus:ring-cosmic-purple/50 transition-all text-sm text-white placeholder:text-white/20"
                                    value={editForm.telescope_type}
                                    onChange={(e) => setEditForm({ ...editForm, telescope_type: e.target.value })}
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-3 bg-gradient-to-r from-cosmic-purple to-cosmic-blue rounded-xl font-bold hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Badges Section */}
                            <section>
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-cosmic-gold" />
                                    Badges Earned
                                    <span className="text-xs font-normal text-white/40">({badges.length})</span>
                                </h3>

                                {badges.length === 0 ? (
                                    <div className="glass-effect rounded-2xl p-8 text-center">
                                        <p className="text-sm text-white/40">Complete missions and log observations to earn badges!</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                        {badges.map(b => (
                                            <div key={b.id} className="group relative">
                                                <div className="aspect-square rounded-xl glass-effect p-2 flex flex-col items-center justify-center group-hover:scale-105 transition-all cursor-help">
                                                    <div className="w-full h-full glass-gold rounded-lg flex items-center justify-center">
                                                        <Star className="w-6 h-6 text-cosmic-gold fill-cosmic-gold" />
                                                    </div>
                                                </div>
                                                <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 bg-white text-black px-2.5 py-1.5 rounded-lg text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-all z-30 pointer-events-none shadow-xl w-28 text-center">
                                                    <p className="text-[9px] text-cosmic-purple font-bold uppercase mb-0.5">{b.badges?.name}</p>
                                                    <p className="text-[8px] text-gray-600 leading-tight">{b.badges?.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Recent Activity Section */}
                            <section>
                                <h3 className="text-lg font-bold mb-4">Recent Discoveries</h3>
                                <div className="glass-effect rounded-2xl p-8 text-center">
                                    <p className="text-sm text-white/40">No recent activity to show.</p>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>

            {/* Guild Leader Application Modal */}
            {showApplicationModal && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                    onClick={() => setShowApplicationModal(false)}
                >
                    <div 
                        className="glass-effect rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-md"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-6 h-6 text-cosmic-purple" />
                            <h3 className="text-xl font-bold">Become a Guild Leader</h3>
                        </div>
                        
                        <p className="text-sm text-white/50 mb-4">
                            Guild Leaders can create astronomy groups and organize free stargazing events. 
                            Tell us why you'd like to become a Guild Leader.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-white/60 mb-1.5">
                                    Why do you want to become a Guild Leader?
                                </label>
                                <textarea
                                    value={applicationReason}
                                    onChange={(e) => setApplicationReason(e.target.value)}
                                    className="w-full px-3 py-2.5 glass-inner rounded-lg resize-none text-sm text-white placeholder:text-white/30"
                                    rows={4}
                                    placeholder="Share your astronomy experience, what kind of events you'd like to organize, etc."
                                    required
                                />
                            </div>

                            <div className="glass-inner rounded-lg p-3 text-xs text-white/50">
                                <p className="font-medium text-white/70 mb-1.5">Requirements:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    <li>Active member with at least 5 observations</li>
                                    <li>Genuine interest in astronomy education</li>
                                    <li>Commitment to organizing quality events</li>
                                </ul>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowApplicationModal(false)}
                                    className="flex-1 py-2.5 glass-inner rounded-lg text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGuildLeaderApplication}
                                    disabled={applyingGuildLeader || !applicationReason.trim()}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {applyingGuildLeader ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
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
