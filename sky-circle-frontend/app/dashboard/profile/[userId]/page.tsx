'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Star, MapPin, Telescope, Loader2, Trophy } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import GearsList from '@/components/profile/GearsList'
import FollowButton from '@/components/social/FollowButton'
import FollowStats from '@/components/social/FollowStats'
import InterestsTags from '@/components/social/InterestsTags'
import { fetchUserGears } from '@/lib/services/gearService'
import { getFollowCounts, getFollowStatus } from '@/lib/services/followService'
import { fetchUserInterests } from '@/lib/services/interestsService'
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
}

/**
 * Validates if a string is a valid UUID format
 */
function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
}

/**
 * Dynamic Profile Page for viewing other users' profiles
 * Integrates FollowButton and FollowStats components
 * 
 * Validates: Requirements 3.4, 3.7
 */
export default function UserProfilePage() {
    const params = useParams()
    const router = useRouter()
    const userId = params.userId as string
    
    const supabase = createClient()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [invalidUserId, setInvalidUserId] = useState(false)
    const [badges, setBadges] = useState<any[]>([])
    const [gears, setGears] = useState<UserGear[]>([])
    const [gearsLoading, setGearsLoading] = useState(true)
    
    // Follow system state
    const [followerCount, setFollowerCount] = useState(0)
    const [followingCount, setFollowingCount] = useState(0)
    const [isFollowing, setIsFollowing] = useState(false)
    const [followLoading, setFollowLoading] = useState(true)

    // Interests state (Requirement 5.6)
    const [interests, setInterests] = useState<Interest[]>([])
    const [interestsLoading, setInterestsLoading] = useState(true)

    // Check if viewing own profile
    const isOwnProfile = currentUserId === userId

    useEffect(() => {
        // Validate UUID format before making any API calls
        if (!isValidUUID(userId)) {
            setInvalidUserId(true)
            setLoading(false)
            return
        }
        fetchCurrentUser()
    }, [userId])

    useEffect(() => {
        if (userId && !invalidUserId && isValidUUID(userId)) {
            fetchProfile()
            fetchFollowData()
        }
    }, [userId, currentUserId, invalidUserId])

    const fetchCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            setCurrentUserId(user.id)
            // If viewing own profile, redirect to main profile page
            if (user.id === userId) {
                router.replace('/dashboard/profile')
                return
            }
        }
    }

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) throw error
            setProfile(data)

            // Fetch badges
            const { data: badgeData } = await supabase
                .from('user_badges')
                .select('*, badges(*)')
                .eq('user_id', userId)

            setBadges(badgeData || [])

            // Fetch gears
            setGearsLoading(true)
            const gearsResult = await fetchUserGears(userId)
            if (gearsResult.data) {
                setGears(gearsResult.data)
            }
            setGearsLoading(false)

            // Fetch interests (Requirement 5.6)
            setInterestsLoading(true)
            const interestsResult = await fetchUserInterests(userId)
            if (interestsResult.data) {
                setInterests(interestsResult.data)
            }
            setInterestsLoading(false)
        } catch (error: any) {
            console.error('Error fetching profile:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchFollowData = async () => {
        setFollowLoading(true)
        try {
            // Fetch follow counts (Requirement 3.4)
            const countsResult = await getFollowCounts(userId)
            if (countsResult.data) {
                setFollowerCount(countsResult.data.followerCount)
                setFollowingCount(countsResult.data.followingCount)
            }

            // Fetch follow status if logged in (Requirement 3.7)
            if (currentUserId && currentUserId !== userId) {
                const statusResult = await getFollowStatus(currentUserId, userId)
                if (statusResult.data !== null) {
                    setIsFollowing(statusResult.data)
                }
            }
        } catch (error) {
            console.error('Error fetching follow data:', error)
        } finally {
            setFollowLoading(false)
        }
    }

    // Set up realtime subscription for follow count updates
    useEffect(() => {
        if (!userId) return

        const channel = supabase
            .channel(`profile-follows-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'follows',
                    filter: `following_id=eq.${userId}`,
                },
                () => {
                    // Refetch follower count when someone follows/unfollows this user
                    fetchFollowData()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'follows',
                    filter: `follower_id=eq.${userId}`,
                },
                () => {
                    // Refetch following count when this user follows/unfollows someone
                    fetchFollowData()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, supabase])

    // Handle follow/unfollow callback to update counts
    const handleFollowChange = useCallback((newIsFollowing: boolean) => {
        setIsFollowing(newIsFollowing)
        // Update follower count optimistically
        setFollowerCount(prev => newIsFollowing ? prev + 1 : Math.max(0, prev - 1))
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-10 h-10 text-cosmic-purple animate-spin" />
        </div>
    )

    if (!profile) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <p className="text-white/60">{invalidUserId ? 'Invalid user ID format' : 'User not found'}</p>
            <button 
                onClick={() => router.push('/dashboard/discover')}
                className="px-4 py-2 bg-cosmic-purple/20 text-cosmic-purple rounded-lg hover:bg-cosmic-purple/30 transition-colors"
            >
                Discover Users
            </button>
        </div>
    )

    return (
        <div className="py-0">
            {/* Header Card */}
            <div className="glass-effect rounded-2xl sm:rounded-[2rem] overflow-hidden mb-6 sm:mb-8">
                {/* Banner */}
                <div className="relative h-24 sm:h-32">
                    <div className="absolute inset-0 bg-gradient-to-r from-cosmic-purple/60 via-cosmic-blue/40 to-cosmic-pink/60" />
                    <div className="absolute inset-0 bg-[#0a0e27] starfield opacity-50" />
                </div>

                {/* Profile Info Section */}
                <div className="relative px-4 sm:px-6 pb-5 sm:pb-6">
                    {/* Profile Photo and Info */}
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
                            </div>
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

                    {/* Follow Stats and Button Row */}
                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* FollowStats Component (Requirement 3.4) */}
                        {!followLoading && (
                            <FollowStats
                                userId={userId}
                                followerCount={followerCount}
                                followingCount={followingCount}
                            />
                        )}
                        
                        {/* FollowButton for other users (Requirement 3.7) */}
                        {currentUserId && !isOwnProfile && (
                            <FollowButton
                                targetUserId={userId}
                                currentUserId={currentUserId}
                                isFollowing={isFollowing}
                                onFollowChange={handleFollowChange}
                                size="md"
                            />
                        )}
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

                    {/* Interests Section (Requirement 5.6) */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <h4 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-3">Interests</h4>
                        {interestsLoading ? (
                            <div className="flex items-center justify-center py-2">
                                <Loader2 className="w-5 h-5 text-cosmic-purple animate-spin" />
                            </div>
                        ) : (
                            <InterestsTags interests={interests} />
                        )}
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Left Column: Stats & Gears */}
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

                    {/* Equipment/Gears Section (Read-only for other users) */}
                    {gearsLoading ? (
                        <div className="glass-effect rounded-2xl p-5 sm:p-6 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-cosmic-purple animate-spin" />
                        </div>
                    ) : (
                        <GearsList
                            userId={userId}
                            isOwnProfile={false}
                            gears={gears}
                        />
                    )}
                </div>

                {/* Right Column: Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Badges Section */}
                    <section>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-cosmic-gold" />
                            Badges Earned
                            <span className="text-xs font-normal text-white/40">({badges.length})</span>
                        </h3>

                        {badges.length === 0 ? (
                            <div className="glass-effect rounded-2xl p-8 text-center">
                                <p className="text-sm text-white/40">No badges earned yet.</p>
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
            </div>
        </div>
    )
}
