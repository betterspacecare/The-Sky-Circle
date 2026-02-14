'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Newspaper, Loader2, Users, Sparkles } from 'lucide-react'
import FeedContainer from '@/components/social/FeedContainer'
import { getFollowingIds, getUserInterestNames } from '@/lib/services/feedService'
import Link from 'next/link'

/**
 * Timeline Page
 * Displays a personalized feed of posts from followed users and trending content
 * 
 * Validates: Requirements 4.1, 4.6, 4.7
 */

export default function TimelinePage() {
    const router = useRouter()
    const supabase = createClient()
    
    // State
    const [userId, setUserId] = useState<string | null>(null)
    const [followingIds, setFollowingIds] = useState<string[]>([])
    const [userInterests, setUserInterests] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch user data on mount
    useEffect(() => {
        const initializeTimeline = async () => {
            setLoading(true)
            setError(null)

            try {
                // Get current user
                const { data: { user }, error: authError } = await supabase.auth.getUser()
                
                if (authError || !user) {
                    // Redirect to login if not authenticated
                    router.push('/login')
                    return
                }

                setUserId(user.id)

                // Fetch following IDs and user interests in parallel
                const [followingResult, interestsResult] = await Promise.all([
                    getFollowingIds(user.id),
                    getUserInterestNames(user.id),
                ])

                if (followingResult.error) {
                    console.error('Error fetching following IDs:', followingResult.error)
                }
                if (interestsResult.error) {
                    console.error('Error fetching user interests:', interestsResult.error)
                }

                setFollowingIds(followingResult.data || [])
                setUserInterests(interestsResult.data || [])
            } catch (err) {
                console.error('Error initializing timeline:', err)
                setError('Failed to load timeline data')
            } finally {
                setLoading(false)
            }
        }

        initializeTimeline()
    }, [supabase, router])

    // Loading state
    if (loading) {
        return (
            <div className="py-0">
                {/* Page Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl glass-effect flex items-center justify-center">
                            <Newspaper className="w-5 h-5 text-cosmic-purple" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black">Timeline</h1>
                    </div>
                    <p className="text-white/60 text-sm">
                        Your personalized astronomy feed
                    </p>
                </div>

                {/* Loading Spinner */}
                <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                    <div className="relative">
                        <Loader2 className="w-10 h-10 text-cosmic-purple animate-spin" />
                        <div className="absolute inset-0 blur-xl bg-cosmic-purple/30 animate-pulse" />
                    </div>
                    <p className="text-white/50 font-medium animate-pulse">Loading your timeline...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="py-0">
                {/* Page Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl glass-effect flex items-center justify-center">
                            <Newspaper className="w-5 h-5 text-cosmic-purple" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black">Timeline</h1>
                    </div>
                </div>

                {/* Error Message */}
                <div className="glass-effect rounded-2xl p-8 text-center border border-red-500/20">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-cosmic-purple hover:bg-cosmic-purple/80 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    // Not authenticated (should redirect, but show fallback)
    if (!userId) {
        return null
    }

    return (
        <div className="py-0">
            {/* Page Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl glass-effect flex items-center justify-center">
                        <Newspaper className="w-5 h-5 text-cosmic-purple" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black">Timeline</h1>
                </div>
                <p className="text-white/60 text-sm">
                    {followingIds.length > 0
                        ? `Posts from ${followingIds.length} ${followingIds.length === 1 ? 'person' : 'people'} you follow`
                        : 'Discover trending astronomy content'}
                </p>
            </div>

            {/* Empty State for users with no content - Requirement 4.6 */}
            {followingIds.length === 0 && userInterests.length === 0 && (
                <div className="glass-effect rounded-2xl p-8 mb-6 border border-white/10">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cosmic-purple/20 to-cosmic-blue/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-8 h-8 text-cosmic-purple" />
                        </div>
                        <div className="text-center sm:text-left flex-1">
                            <h3 className="text-lg font-semibold mb-2">Personalize your feed</h3>
                            <p className="text-white/60 text-sm mb-4">
                                Follow other astronomers and select your interests to see more relevant content in your timeline.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
                                <Link
                                    href="/dashboard/discover"
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-cosmic-purple hover:bg-cosmic-purple/80 rounded-lg transition-colors text-sm font-medium"
                                >
                                    <Users className="w-4 h-4" />
                                    Find People to Follow
                                </Link>
                                <Link
                                    href="/dashboard/profile"
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Set Your Interests
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Feed Container - Requirements 4.1, 4.7 */}
            <FeedContainer
                userId={userId}
                followingIds={followingIds}
                userInterests={userInterests}
            />
        </div>
    )
}
