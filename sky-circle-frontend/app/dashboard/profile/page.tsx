'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Camera, Trophy, Star, MapPin, Telescope, Edit3, Loader2, LogOut, Shield, CheckCircle2, Clock, Eye, MessageSquare, Heart } from 'lucide-react'
import { EXPERIENCE_LEVELS } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import GearsList from '@/components/profile/GearsList'
import FollowStats from '@/components/social/FollowStats'
import InterestsTags from '@/components/social/InterestsTags'
import InterestsSelector from '@/components/social/InterestsSelector'
import AccountLinking from '@/components/profile/AccountLinking'
import { fetchUserGears } from '@/lib/services/gearService'
import { getFollowCounts } from '@/lib/services/followService'
import { fetchAllInterests, fetchUserInterests, updateUserInterests } from '@/lib/services/interestsService'
import { UserGear, Interest } from '@/types/social.types'

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

interface Observation {
    id: string
    object_name: string
    category: string
    notes: string | null
    photo_url: string | null
    observation_date: string
    created_at: string
}

interface Post {
    id: string
    caption: string | null
    image_url: string
    created_at: string
    likes_count: number
    comments_count: number
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
    const [gears, setGears] = useState<UserGear[]>([])
    const [gearsLoading, setGearsLoading] = useState(true)
    
    // Follow system state (Requirement 3.4)
    const [followerCount, setFollowerCount] = useState(0)
    const [followingCount, setFollowingCount] = useState(0)

    // Interests system state (Requirements 5.1, 5.3, 5.6)
    const [interests, setInterests] = useState<Interest[]>([])
    const [allInterests, setAllInterests] = useState<Interest[]>([])
    const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([])
    const [interestsLoading, setInterestsLoading] = useState(true)

    // User content state
    const [observations, setObservations] = useState<Observation[]>([])
    const [observationsLoading, setObservationsLoading] = useState(true)
    const [posts, setPosts] = useState<Post[]>([])
    const [postsLoading, setPostsLoading] = useState(true)

    const [editForm, setEditForm] = useState({
        display_name: '',
        bio: '',
        telescope_type: '',
        experience_level: ''
    })

    useEffect(() => {
        fetchProfile()
        
        // Check for linking success message
        const params = new URLSearchParams(window.location.search)
        if (params.get('linked') === 'success') {
            // Show success message
            alert('✅ Google account linked successfully!')
            // Remove the parameter from URL
            window.history.replaceState({}, '', '/dashboard/profile')
        }
    }, [])

    // Set up realtime subscription for follow count updates
    useEffect(() => {
        if (!profile?.id) return

        const channel = supabase
            .channel(`own-profile-follows-${profile.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'follows',
                    filter: `following_id=eq.${profile.id}`,
                },
                async () => {
                    // Refetch follower count when someone follows/unfollows this user
                    const countsResult = await getFollowCounts(profile.id)
                    if (countsResult.data) {
                        setFollowerCount(countsResult.data.followerCount)
                        setFollowingCount(countsResult.data.followingCount)
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'follows',
                    filter: `follower_id=eq.${profile.id}`,
                },
                async () => {
                    // Refetch following count when this user follows/unfollows someone
                    const countsResult = await getFollowCounts(profile.id)
                    if (countsResult.data) {
                        setFollowerCount(countsResult.data.followerCount)
                        setFollowingCount(countsResult.data.followingCount)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [profile?.id, supabase])

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .maybeSingle()

            if (error) throw error
            
            // Handle case where user doesn't exist in users table yet
            if (!data) {
                // Redirect to profile setup page
                console.warn('User profile not found, redirecting to setup')
                router.push('/setup-profile')
                return
            }
            
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

            // Fetch gears
            setGearsLoading(true)
            const gearsResult = await fetchUserGears(user.id)
            if (gearsResult.data) {
                setGears(gearsResult.data)
            }
            setGearsLoading(false)
            
            // Fetch follow counts (Requirement 3.4)
            const countsResult = await getFollowCounts(user.id)
            if (countsResult.data) {
                setFollowerCount(countsResult.data.followerCount)
                setFollowingCount(countsResult.data.followingCount)
            }

            // Fetch interests (Requirements 5.1, 5.6)
            setInterestsLoading(true)
            const [allInterestsResult, userInterestsResult] = await Promise.all([
                fetchAllInterests(),
                fetchUserInterests(user.id)
            ])
            if (allInterestsResult.data) {
                setAllInterests(allInterestsResult.data)
            }
            if (userInterestsResult.data) {
                setInterests(userInterestsResult.data)
                setSelectedInterestIds(userInterestsResult.data.map(i => i.id))
            }
            setInterestsLoading(false)

            // Fetch recent observations
            setObservationsLoading(true)
            const { data: observationsData } = await supabase
                .from('observations')
                .select('id, object_name, category, notes, photo_url, observation_date, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(6)
            
            if (observationsData) {
                setObservations(observationsData)
            }
            setObservationsLoading(false)

            // Fetch recent posts
            setPostsLoading(true)
            const { data: postsData } = await supabase
                .from('posts')
                .select('id, caption, image_url, created_at')
                .eq('user_id', user.id)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false })
                .limit(6)
            
            if (postsData) {
                // Get likes and comments counts for posts
                const postsWithCounts = await Promise.all(
                    postsData.map(async (post) => {
                        const [{ count: likesCount }, { count: commentsCount }] = await Promise.all([
                            supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
                            supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id)
                        ])
                        return { ...post, likes_count: likesCount || 0, comments_count: commentsCount || 0 }
                    })
                )
                setPosts(postsWithCounts)
            }
            setPostsLoading(false)
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

            // Save interests (Requirement 5.3)
            const interestsResult = await updateUserInterests(user.id, selectedInterestIds)
            if (interestsResult.error) {
                throw new Error(interestsResult.error)
            }
            if (interestsResult.data) {
                setInterests(interestsResult.data)
            }

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

    // Gear CRUD handlers
    const handleGearAdded = (gear: UserGear) => {
        setGears(prev => [gear, ...prev])
    }

    const handleGearUpdated = (updatedGear: UserGear) => {
        setGears(prev => prev.map(g => g.id === updatedGear.id ? updatedGear : g))
    }

    const handleGearDeleted = (gearId: string) => {
        setGears(prev => prev.filter(g => g.id !== gearId))
    }

    // Interest selection handler (Requirement 5.1)
    const handleInterestSelectionChange = (newSelectedIds: string[]) => {
        setSelectedInterestIds(newSelectedIds)
    }

    // Reset interests when canceling edit
    const handleCancelEdit = () => {
        setEditing(false)
        // Reset selected interests to current saved interests
        setSelectedInterestIds(interests.map(i => i.id))
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-10 h-10 text-cosmic-purple animate-spin" />
        </div>
    )

    if (!profile) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="text-center">
                <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
                <p className="text-white/60 mb-4">Your user profile hasn't been set up yet.</p>
                <p className="text-white/40 text-sm">Please complete the profile setup process or contact support.</p>
            </div>
            <button 
                onClick={() => window.location.href = '/setup-profile'}
                className="px-6 py-3 bg-gradient-to-r from-cosmic-purple to-cosmic-blue rounded-xl font-bold hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all"
            >
                Set Up Profile
            </button>
        </div>
    )

    return (
        <div className="py-4">
            {/* Header Card */}
            <div className="glass-effect rounded-2xl sm:rounded-[2rem] overflow-hidden mb-8 sm:mb-10">
                {/* Banner - taller for better visual impact */}
                <div className="relative h-32 sm:h-40">
                    <div className="absolute inset-0 bg-gradient-to-r from-cosmic-purple/60 via-cosmic-blue/40 to-cosmic-pink/60" />
                    <div className="absolute inset-0 bg-[#0a0e27] starfield opacity-50" />
                    
                    {/* Action buttons on banner */}
                    <div className="absolute top-4 sm:top-5 right-4 sm:right-5 z-10 flex gap-3">
                        <button
                            onClick={() => editing ? handleCancelEdit() : setEditing(true)}
                            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-white/10 backdrop-blur-md rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 border border-white/20 hover:bg-white/20 transition-all"
                        >
                            {editing ? 'Cancel' : <><Edit3 className="w-4 h-4" /> Edit</>}
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="p-2 sm:p-2.5 bg-red-500/20 backdrop-blur-md rounded-xl text-red-400 border border-red-500/20 hover:bg-red-500/30 transition-all"
                            title="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Profile Info Section */}
                <div className="relative px-5 sm:px-8 pb-6 sm:pb-8">
                    {/* Profile Photo - overlaps banner */}
                    <div className="flex items-start gap-5 sm:gap-6 -mt-12 sm:-mt-16">
                        <div className="relative shrink-0">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-[#0a0e17] overflow-hidden bg-white/5 shadow-2xl">
                                {profile.profile_photo_url ? (
                                    <img src={profile.profile_photo_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cosmic-purple/20 to-cosmic-blue/20">
                                        <User className="w-12 h-12 sm:w-14 sm:h-14 text-white/30" />
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
                                className="absolute -bottom-2 -right-2 p-2 bg-cosmic-purple rounded-xl text-white shadow-lg hover:bg-cosmic-purple/80 active:scale-90 transition-all disabled:opacity-50"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Name and quick stats - with top padding to create gap from banner */}
                        <div className="flex-1 min-w-0 pt-14 sm:pt-20">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
                                <div className="min-w-0">
                                    <h1 className="text-2xl sm:text-3xl font-black truncate mb-1">{profile.display_name || 'Cosmic Traveler'}</h1>
                                    <p className="text-cosmic-purple font-medium text-sm sm:text-base mb-3">@{profile.id.substring(0, 8)}</p>
                                    
                                    {/* Badges inline below name */}
                                    {badges.length > 0 && (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {badges.slice(0, 5).map(b => (
                                                <div key={b.id} className="group relative">
                                                    <div className="w-7 h-7 rounded-lg glass-gold flex items-center justify-center cursor-help hover:scale-110 transition-all">
                                                        <Star className="w-4 h-4 text-cosmic-gold fill-cosmic-gold" />
                                                    </div>
                                                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-white text-black px-2 py-1 rounded-lg text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-all z-30 pointer-events-none shadow-xl whitespace-nowrap">
                                                        {b.badges?.name}
                                                    </div>
                                                </div>
                                            ))}
                                            {badges.length > 5 && (
                                                <span className="text-xs text-white/40 ml-1">+{badges.length - 5} more</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Quick stats inline */}
                                <div className="flex items-center gap-4 sm:gap-5">
                                    <div className="flex items-center gap-2 px-4 py-2.5 glass-inner rounded-xl">
                                        <Star className="w-5 h-5 text-cosmic-gold fill-cosmic-gold" />
                                        <span className="font-bold text-base">{profile.total_points.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2.5 glass-inner rounded-xl">
                                        <Trophy className="w-5 h-5 text-cosmic-purple" />
                                        <span className="font-bold text-base">Lvl {profile.level}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Follow Stats Section (Requirement 3.4) */}
                    <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/10">
                        <FollowStats
                            userId={profile.id}
                            followerCount={followerCount}
                            followingCount={followingCount}
                        />
                    </div>

                    {/* Bio and tags */}
                    <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/10">
                        <p className="text-sm sm:text-base text-white/60 mb-4 leading-relaxed">{profile.bio || 'This observer hasn\'t written a bio yet.'}</p>
                        <div className="flex flex-wrap gap-3">
                            <div className="px-3 py-1.5 glass-inner rounded-full text-xs sm:text-sm font-medium text-white/50 flex items-center gap-2">
                                <Telescope className="w-4 h-4" />
                                {profile.telescope_type || 'No Telescope'}
                            </div>
                            <div className="px-3 py-1.5 glass-purple text-cosmic-purple rounded-full text-xs sm:text-sm font-medium flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Earth
                            </div>
                        </div>
                    </div>

                    {/* Interests Section (Requirement 5.6) */}
                    <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/10">
                        <h4 className="text-xs sm:text-sm font-bold text-white/40 uppercase tracking-wider mb-4">Interests</h4>
                        {interestsLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-6 h-6 text-cosmic-purple animate-spin" />
                            </div>
                        ) : (
                            <InterestsTags interests={interests} />
                        )}
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

                    {/* Equipment/Gears Section - moved up for better hierarchy */}
                    {gearsLoading ? (
                        <div className="glass-effect rounded-2xl p-5 sm:p-6 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-cosmic-purple animate-spin" />
                        </div>
                    ) : (
                        <GearsList
                            userId={profile.id}
                            isOwnProfile={true}
                            gears={gears}
                            onGearAdded={handleGearAdded}
                            onGearUpdated={handleGearUpdated}
                            onGearDeleted={handleGearDeleted}
                        />
                    )}

                    {/* Account Linking Section */}
                    <AccountLinking />

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

                    {/* Referral Card - moved to bottom */}
                    <div className="glass-purple rounded-2xl p-5 sm:p-6">
                        <h4 className="font-bold text-base mb-3 text-gradient">Refer a Friend</h4>
                        <p className="text-xs text-white/50 mb-4">Give your friends 50 pts and earn 50 pts yourself when they log their first discovery.</p>
                        <div className="glass-inner rounded-lg p-2.5 flex items-center justify-between">
                            <code className="font-bold text-cosmic-purple text-sm">{profile.referral_code}</code>
                            <button className="text-[10px] font-bold uppercase tracking-wider bg-cosmic-purple px-2.5 py-1 rounded-full hover:bg-cosmic-purple/80 transition-all">Copy</button>
                        </div>
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

                            {/* Interests Selector (Requirements 5.1, 5.3) */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Interests</label>
                                <p className="text-xs text-white/50 mb-2">Select your astronomy interests to get personalized content recommendations</p>
                                {interestsLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="w-5 h-5 text-cosmic-purple animate-spin" />
                                    </div>
                                ) : (
                                    <InterestsSelector
                                        allInterests={allInterests}
                                        selectedInterestIds={selectedInterestIds}
                                        onSelectionChange={handleInterestSelectionChange}
                                        editMode={true}
                                    />
                                )}
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
                            {/* Recent Observations Section */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <Eye className="w-5 h-5 text-cosmic-blue" />
                                        Recent Observations
                                    </h3>
                                    <Link href="/dashboard/observations" className="text-xs text-cosmic-purple hover:text-cosmic-pink transition-colors">
                                        View All →
                                    </Link>
                                </div>

                                {observationsLoading ? (
                                    <div className="glass-effect rounded-2xl p-8 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-cosmic-purple animate-spin" />
                                    </div>
                                ) : observations.length === 0 ? (
                                    <div className="glass-effect rounded-2xl p-8 text-center">
                                        <Eye className="w-10 h-10 text-white/20 mx-auto mb-3" />
                                        <p className="text-sm text-white/40 mb-3">No observations yet</p>
                                        <Link 
                                            href="/dashboard/observations/new"
                                            className="inline-block px-4 py-2 bg-cosmic-purple/20 text-cosmic-purple rounded-lg text-sm font-medium hover:bg-cosmic-purple/30 transition-all"
                                        >
                                            Log Your First Observation
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {observations.map(obs => (
                                            <Link 
                                                key={obs.id} 
                                                href={`/dashboard/observations`}
                                                className="group glass-effect rounded-xl overflow-hidden hover:scale-[1.02] transition-all"
                                            >
                                                <div className="aspect-square bg-gradient-to-br from-cosmic-purple/20 to-cosmic-blue/20 relative">
                                                    {obs.photo_url ? (
                                                        <img src={obs.photo_url} alt={obs.object_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Telescope className="w-8 h-8 text-white/20" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <div className="p-3">
                                                    <p className="text-sm font-medium truncate">{obs.object_name}</p>
                                                    <p className="text-xs text-white/40 mt-0.5">{obs.category}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Feed Posts Section */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-cosmic-pink" />
                                        Feed Posts
                                    </h3>
                                    <Link href="/dashboard/timeline" className="text-xs text-cosmic-purple hover:text-cosmic-pink transition-colors">
                                        View Timeline →
                                    </Link>
                                </div>

                                {postsLoading ? (
                                    <div className="glass-effect rounded-2xl p-8 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-cosmic-purple animate-spin" />
                                    </div>
                                ) : posts.length === 0 ? (
                                    <div className="glass-effect rounded-2xl p-8 text-center">
                                        <MessageSquare className="w-10 h-10 text-white/20 mx-auto mb-3" />
                                        <p className="text-sm text-white/40">No posts yet. Share your astronomy journey!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {posts.map(post => (
                                            <div key={post.id} className="glass-effect rounded-xl p-4 hover:bg-white/[0.03] transition-all">
                                                {post.image_url && (
                                                    <div className="rounded-lg overflow-hidden mb-3 max-h-40">
                                                        <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                {post.caption && (
                                                    <p className="text-sm text-white/80 line-clamp-2 mb-2">{post.caption}</p>
                                                )}
                                                <div className="flex items-center justify-between text-white/40">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex items-center gap-1 text-xs">
                                                            <Heart className="w-3 h-3" /> {post.likes_count}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-xs">
                                                            <MessageSquare className="w-3 h-3" /> {post.comments_count}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs">
                                                        {new Date(post.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
