'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Heart, MessageCircle, Loader2, Users, ImageOff, RefreshCw } from 'lucide-react'
import { TimelinePost } from '@/types/social.types'
import { fetchTimelineFeed, DEFAULT_FEED_CONFIG, FeedQuery } from '@/lib/services/feedService'
import { createClient } from '@/lib/supabase/client'

/**
 * FeedContainer Component
 * Displays a personalized timeline feed with infinite scroll
 * 
 * Validates: Requirements 4.1, 4.2, 4.7
 */

interface FeedContainerProps {
    userId: string;
    followingIds: string[];
    userInterests: string[];
}

/**
 * Formats a date for display
 */
function formatDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`
    }
    if (diffHours < 24) {
        return `${diffHours}h ago`
    }
    if (diffDays < 7) {
        return `${diffDays}d ago`
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Formats large numbers for display
 */
function formatCount(count: number): string {
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1).replace(/\.0$/, '')}M`
    }
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`
    }
    return count.toString()
}


/**
 * PostCard Component
 * Displays a single post in the feed
 */
interface PostCardProps {
    post: TimelinePost;
}

function PostCard({ post }: PostCardProps) {
    const [imageError, setImageError] = useState(false)

    return (
        <div className="glass-effect rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-200">
            {/* Post Header */}
            <div className="p-4 flex items-center gap-3">
                <Link
                    href={`/dashboard/profile/${post.user_id}`}
                    className="flex items-center gap-3 flex-1 min-w-0 group"
                >
                    {/* User Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cosmic-purple to-cosmic-blue flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white/10 group-hover:ring-white/20 transition-all">
                        {post.users.profile_photo_url ? (
                            <img
                                src={post.users.profile_photo_url}
                                alt={post.users.display_name || 'User'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-sm font-bold">
                                {(post.users.display_name || 'U')[0].toUpperCase()}
                            </span>
                        )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold truncate group-hover:text-cosmic-purple transition-colors">
                                {post.users.display_name || 'Anonymous'}
                            </span>
                            {/* Following Badge - Requirement 4.1 */}
                            {post.is_from_following && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-cosmic-purple/20 text-cosmic-purple border border-cosmic-purple/30">
                                    <Users className="w-3 h-3" />
                                    Following
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-white/50">
                            {formatDate(post.created_at)}
                        </span>
                    </div>
                </Link>
            </div>

            {/* Post Image */}
            <div className="relative aspect-square bg-black/20">
                {imageError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/30">
                        <ImageOff className="w-12 h-12 mb-2" />
                        <span className="text-sm">Image unavailable</span>
                    </div>
                ) : (
                    <img
                        src={post.image_url}
                        alt={post.caption || 'Observation'}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                )}
            </div>

            {/* Post Footer */}
            <div className="p-4">
                {/* Engagement Stats */}
                <div className="flex items-center gap-4 mb-3">
                    <div className={`flex items-center gap-1.5 ${post.is_liked ? 'text-red-400' : 'text-white/60'}`}>
                        <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                        <span className="text-sm font-medium">{formatCount(post.likes_count)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/60">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{formatCount(post.comments_count)}</span>
                    </div>
                </div>

                {/* Caption */}
                {post.caption && (
                    <p className="text-sm text-white/80 line-clamp-3">
                        <span className="font-semibold mr-2">{post.users.display_name || 'Anonymous'}</span>
                        {post.caption}
                    </p>
                )}
            </div>
        </div>
    )
}


/**
 * FeedContainer Component
 * Main container for the timeline feed with infinite scroll
 * 
 * Validates: Requirements 4.1, 4.2, 4.7
 */
export default function FeedContainer({
    userId,
    followingIds,
    userInterests,
}: FeedContainerProps) {
    const supabase = createClient()
    const [posts, setPosts] = useState<TimelinePost[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [hasNewPosts, setHasNewPosts] = useState(false)
    
    // Ref for infinite scroll observer
    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadMoreRef = useRef<HTMLDivElement | null>(null)

    /**
     * Fetches posts from the feed service
     */
    const fetchPosts = useCallback(async (pageNum: number, append: boolean = false) => {
        if (append) {
            setIsLoadingMore(true)
        } else {
            setIsLoading(true)
        }
        setError(null)

        const query: FeedQuery = {
            userId,
            userInterests,
            followingIds,
            page: pageNum,
            pageSize: DEFAULT_FEED_CONFIG.pageSize,
        }

        const result = await fetchTimelineFeed(query)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
            setIsLoadingMore(false)
            return
        }

        if (result.data) {
            if (append) {
                setPosts(prev => [...prev, ...result.data!.posts])
            } else {
                setPosts(result.data.posts)
            }
            setHasMore(result.data.hasMore)
            setPage(result.data.nextPage)
        }

        setIsLoading(false)
        setIsLoadingMore(false)
    }, [userId, userInterests, followingIds])

    /**
     * Initial fetch on mount
     */
    useEffect(() => {
        fetchPosts(1, false)
    }, [fetchPosts])

    /**
     * Set up realtime subscription for live timeline updates
     * Validates: Requirements 3.5, 3.6 - Live updates for posts
     */
    useEffect(() => {
        // Subscribe to new posts from followed users
        const channel = supabase
            .channel(`timeline-posts-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'posts',
                },
                (payload) => {
                    // Check if the new post is from a followed user
                    const newPostUserId = payload.new.user_id as string
                    if (followingIds.includes(newPostUserId)) {
                        // Show notification that new posts are available
                        setHasNewPosts(true)
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'posts',
                },
                (payload) => {
                    // Update the post in the current feed if it exists
                    const updatedPostId = payload.new.id as string
                    setPosts(prev => prev.map(post => 
                        post.id === updatedPostId 
                            ? { ...post, ...payload.new }
                            : post
                    ))
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'posts',
                },
                (payload) => {
                    // Remove the deleted post from the feed
                    const deletedPostId = payload.old.id as string
                    setPosts(prev => prev.filter(post => post.id !== deletedPostId))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, followingIds, supabase])

    /**
     * Handler to refresh feed when new posts are available
     */
    const handleRefreshFeed = useCallback(() => {
        setHasNewPosts(false)
        fetchPosts(1, false)
    }, [fetchPosts])

    /**
     * Set up infinite scroll observer
     * Validates: Requirement 4.7 - Infinite scroll pagination
     */
    useEffect(() => {
        // Disconnect previous observer
        if (observerRef.current) {
            observerRef.current.disconnect()
        }

        // Create new observer
        observerRef.current = new IntersectionObserver(
            (entries) => {
                const [entry] = entries
                if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
                    fetchPosts(page, true)
                }
            },
            {
                root: null,
                rootMargin: '100px',
                threshold: 0.1,
            }
        )

        // Observe the load more element
        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current)
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [hasMore, isLoadingMore, isLoading, page, fetchPosts])

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative">
                    <Loader2 className="w-10 h-10 text-cosmic-purple animate-spin" />
                    <div className="absolute inset-0 blur-xl bg-cosmic-purple/30 animate-pulse" />
                </div>
                <p className="text-white/50 font-medium animate-pulse">Loading your feed...</p>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="glass-effect rounded-2xl p-8 text-center">
                <p className="text-red-400 mb-4">Failed to load feed: {error}</p>
                <button
                    onClick={() => fetchPosts(1, false)}
                    className="px-4 py-2 bg-cosmic-purple hover:bg-cosmic-purple/80 rounded-lg transition-colors"
                >
                    Try Again
                </button>
            </div>
        )
    }

    // Empty state
    if (posts.length === 0) {
        return (
            <div className="glass-effect rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <ImageOff className="w-8 h-8 text-white/30" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-white/50 mb-4">
                    {followingIds.length === 0
                        ? 'Follow some users to see their posts in your feed!'
                        : 'No posts to show. Check back later for new content!'}
                </p>
                <Link
                    href="/dashboard/discover"
                    className="inline-block px-4 py-2 bg-cosmic-purple hover:bg-cosmic-purple/80 rounded-lg transition-colors"
                >
                    Discover Users
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* New Posts Notification Banner */}
            {hasNewPosts && (
                <button
                    onClick={handleRefreshFeed}
                    className="w-full py-3 px-4 glass-effect rounded-xl border border-cosmic-purple/30 flex items-center justify-center gap-2 text-cosmic-purple hover:bg-cosmic-purple/10 transition-all animate-in fade-in slide-in-from-top-2 duration-300"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span className="font-medium">New posts available - Click to refresh</span>
                </button>
            )}

            {/* Posts Grid/List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>

            {/* Load More Trigger / Loading More State */}
            <div ref={loadMoreRef} className="py-4">
                {isLoadingMore && (
                    <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 text-cosmic-purple animate-spin" />
                        <span className="text-white/50">Loading more posts...</span>
                    </div>
                )}
                {!hasMore && posts.length > 0 && (
                    <p className="text-center text-white/40 text-sm">
                        You've reached the end of your feed
                    </p>
                )}
            </div>
        </div>
    )
}
