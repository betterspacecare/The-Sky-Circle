'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Heart, MessageCircle, Loader2, ImageOff, RefreshCw, MoreHorizontal, Bookmark, Share2, Trash2 } from 'lucide-react'
import { TimelinePost } from '@/types/social.types'
import { fetchTimelineFeed, DEFAULT_FEED_CONFIG, FeedQuery } from '@/lib/services/feedService'
import { createClient } from '@/lib/supabase/client'
import CommentsSection from './CommentsSection'

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
 * Displays a single post in Instagram-style layout
 */
interface PostCardProps {
    post: TimelinePost;
    currentUserId: string;
    onDelete: (postId: string) => void;
}

function PostCard({ post, currentUserId, onDelete }: PostCardProps) {
    const supabase = createClient()
    const [imageError, setImageError] = useState(false)
    const [isLiked, setIsLiked] = useState(post.is_liked)
    const [likesCount, setLikesCount] = useState(post.likes_count)
    const [commentsCount, setCommentsCount] = useState(post.comments_count)
    const [showComments, setShowComments] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [isBookmarked, setIsBookmarked] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const menuRef = useRef<HTMLDivElement>(null)
    const carouselRef = useRef<HTMLDivElement>(null)

    // Get images array (use images if available, fallback to single image_url)
    const images = post.images && post.images.length > 0 ? post.images : [post.image_url]
    const hasMultipleImages = images.length > 1

    // Carousel navigation with smooth scroll
    const scrollToImage = (index: number) => {
        if (carouselRef.current) {
            const scrollWidth = carouselRef.current.scrollWidth
            const targetScroll = (scrollWidth / images.length) * index
            carouselRef.current.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            })
        }
        setCurrentImageIndex(index)
    }

    const nextImage = () => {
        const nextIndex = (currentImageIndex + 1) % images.length
        scrollToImage(nextIndex)
    }

    const prevImage = () => {
        const prevIndex = (currentImageIndex - 1 + images.length) % images.length
        scrollToImage(prevIndex)
    }

    // Update current index based on scroll position
    const handleScroll = () => {
        if (carouselRef.current) {
            const scrollLeft = carouselRef.current.scrollLeft
            const itemWidth = carouselRef.current.offsetWidth
            const index = Math.round(scrollLeft / itemWidth)
            setCurrentImageIndex(index)
        }
    }

    // Load bookmark status from localStorage
    useEffect(() => {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarked_posts') || '[]')
        setIsBookmarked(bookmarks.includes(post.id))
    }, [post.id])

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false)
            }
        }
        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showMenu])

    const handleLike = async () => {
        // Optimistic update
        const wasLiked = isLiked
        setIsLiked(!isLiked)
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
        
        try {
            if (wasLiked) {
                // Unlike
                await supabase
                    .from('likes')
                    .delete()
                    .eq('post_id', post.id)
                    .eq('user_id', currentUserId)
            } else {
                // Like
                await supabase
                    .from('likes')
                    .insert({
                        post_id: post.id,
                        user_id: currentUserId
                    })
            }
        } catch (error) {
            console.error('Error liking post:', error)
            // Revert on error
            setIsLiked(wasLiked)
            setLikesCount(post.likes_count)
        }
    }

    const handleBookmark = () => {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarked_posts') || '[]')
        let newBookmarks
        if (isBookmarked) {
            newBookmarks = bookmarks.filter((id: string) => id !== post.id)
        } else {
            newBookmarks = [...bookmarks, post.id]
        }
        localStorage.setItem('bookmarked_posts', JSON.stringify(newBookmarks))
        setIsBookmarked(!isBookmarked)
        setShowMenu(false)
    }

    const handleShare = async () => {
        const shareData = {
            title: `Check out this post by ${post.users?.display_name || 'Observer'}`,
            text: post.caption || 'Amazing astronomy photo!',
            url: `${window.location.origin}/dashboard/timeline?post=${post.id}`
        }

        try {
            if (navigator.share) {
                await navigator.share(shareData)
            } else {
                await navigator.clipboard.writeText(shareData.url)
                alert('Link copied to clipboard!')
            }
        } catch (error) {
            console.log('Share cancelled')
        }
        setShowMenu(false)
    }

    const handleDelete = async () => {
        if (!confirm('Delete this post?')) return
        
        setShowMenu(false)
        setIsDeleting(true)
        
        // Optimistically remove from UI immediately
        setTimeout(() => {
            onDelete(post.id)
        }, 300) // Wait for fade animation
        
        try {
            // Use hard delete for both posts and observations
            // This avoids RLS policy issues with UPDATE
            if (post.post_type === 'post') {
                const { error } = await supabase
                    .from('posts')
                    .delete()
                    .eq('id', post.id)
                    .eq('user_id', currentUserId)
                
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('observations')
                    .delete()
                    .eq('id', post.id)
                    .eq('user_id', currentUserId)
                
                if (error) throw error
            }
        } catch (error) {
            console.error('Error deleting post:', error)
            alert('Failed to delete post')
            setIsDeleting(false)
        }
    }

    return (
        <article className={`bg-[#0a0e17] border border-white/10 rounded-lg overflow-hidden mb-4 transition-all duration-300 ${
            isDeleting ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
        }`}>
            {/* Post Header */}
            <div className="p-3 flex items-center justify-between">
                <Link
                    href={`/dashboard/profile/${post.user_id}`}
                    className="flex items-center gap-3 flex-1 min-w-0 group"
                >
                    {/* User Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cosmic-purple to-cosmic-blue flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white/10 group-hover:ring-cosmic-purple/50 transition-all">
                        {post.users.profile_photo_url ? (
                            <img
                                src={post.users.profile_photo_url}
                                alt={post.users.display_name || 'User'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-xs font-bold">
                                {(post.users.display_name || 'U')[0].toUpperCase()}
                            </span>
                        )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate group-hover:text-cosmic-purple transition-colors">
                                {post.users.display_name || 'Anonymous'}
                            </span>
                            {/* Following Badge */}
                            {post.is_from_following && (
                                <span className="text-xs text-cosmic-purple">• Following</span>
                            )}
                            {/* Observation Badge */}
                            {post.post_type === 'observation' && post.category && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cosmic-blue/20 text-cosmic-blue font-medium">
                                    {post.category}
                                </span>
                            )}
                        </div>
                    </div>
                </Link>
                
                {/* 3-Dot Menu */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">
                        {formatDate(post.created_at)}
                    </span>
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1.5 hover:bg-white/5 rounded-full transition-colors"
                        >
                            <MoreHorizontal className="w-5 h-5 text-white/40" />
                        </button>

                        {/* Dropdown Menu */}
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-[#0a0e17] border border-white/10 rounded-lg shadow-xl z-50 py-1">
                                <button
                                    onClick={handleBookmark}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-3 transition-colors"
                                >
                                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-cosmic-gold' : ''}`} />
                                    {isBookmarked ? 'Saved' : 'Save'}
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-3 transition-colors"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </button>
                                {post.user_id === currentUserId && (
                                    <button
                                        onClick={handleDelete}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-3 transition-colors text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Post Image(s) - Animated Scrolling Carousel */}
            <div className="relative w-full bg-black group">
                {imageError ? (
                    <div className="w-full aspect-square flex flex-col items-center justify-center text-white/30">
                        <ImageOff className="w-12 h-12 mb-2" />
                        <span className="text-sm">Image unavailable</span>
                    </div>
                ) : (
                    <>
                        {/* Scrollable Container */}
                        <div 
                            ref={carouselRef}
                            onScroll={handleScroll}
                            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {images.map((imageUrl, index) => (
                                <div 
                                    key={index}
                                    className="w-full flex-shrink-0 snap-center snap-always aspect-square"
                                >
                                    <img
                                        src={imageUrl}
                                        alt={`${post.caption || 'Post'} - Image ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={() => setImageError(true)}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Navigation Arrows (only if multiple images) */}
                        {hasMultipleImages && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/70 hover:bg-black/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 backdrop-blur-sm"
                                    aria-label="Previous image"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/70 hover:bg-black/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 backdrop-blur-sm"
                                    aria-label="Next image"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                {/* Dots Indicator */}
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                    {images.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => scrollToImage(index)}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                index === currentImageIndex 
                                                    ? 'bg-white w-6 shadow-lg' 
                                                    : 'bg-white/50 w-1.5 hover:bg-white/70'
                                            }`}
                                            aria-label={`Go to image ${index + 1}`}
                                        />
                                    ))}
                                </div>

                                {/* Image Counter */}
                                <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-full text-white text-xs font-medium shadow-lg">
                                    {currentImageIndex + 1} / {images.length}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Action Buttons */}
            <div className="p-3">
                <div className="flex items-center gap-4 mb-2">
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 transition-all hover:scale-110 active:scale-95 ${
                            isLiked ? 'text-red-500' : 'text-white/80 hover:text-white'
                        }`}
                    >
                        <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center gap-1.5 text-white/80 hover:text-white transition-all hover:scale-110 active:scale-95"
                    >
                        <MessageCircle className="w-6 h-6" />
                    </button>
                </div>

                {/* Likes Count */}
                {likesCount > 0 && (
                    <div className="mb-2">
                        <span className="font-semibold text-sm">{formatCount(likesCount)} {likesCount === 1 ? 'like' : 'likes'}</span>
                    </div>
                )}

                {/* Caption */}
                {post.caption && (
                    <div className="text-sm mb-1">
                        <Link href={`/dashboard/profile/${post.user_id}`} className="font-semibold hover:text-cosmic-purple transition-colors">
                            {post.users.display_name || 'Anonymous'}
                        </Link>
                        <span className="ml-2 text-white/90">{post.caption}</span>
                    </div>
                )}

                {/* View Comments Button */}
                {commentsCount > 0 && !showComments && (
                    <button
                        onClick={() => setShowComments(true)}
                        className="text-sm text-white/40 hover:text-white/60 transition-colors"
                    >
                        View all {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
                    </button>
                )}
            </div>

            {/* Comments Section */}
            {showComments && (
                <CommentsSection
                    postId={post.id}
                    currentUserId={currentUserId}
                    initialCommentsCount={commentsCount}
                    onCommentsCountChange={setCommentsCount}
                />
            )}
        </article>
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
        // Subscribe to new posts and observations from followed users
        const channel = supabase
            .channel(`timeline-posts-${userId}`)
            // Posts table events
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
                    const updatedPostId = payload.new.id as string
                    // If post is marked as deleted, remove it from feed
                    if (payload.new.is_deleted) {
                        setPosts(prev => prev.filter(post => post.id !== updatedPostId))
                    } else {
                        // Update the post in the current feed if it exists
                        setPosts(prev => prev.map(post => 
                            post.id === updatedPostId 
                                ? { ...post, ...payload.new }
                                : post
                        ))
                    }
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
            // Observations table events
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'observations',
                },
                (payload) => {
                    // Check if the new observation is from a followed user
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
                    event: 'DELETE',
                    schema: 'public',
                    table: 'observations',
                },
                (payload) => {
                    // Remove the deleted observation from the feed
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
     * Handler to remove a post from the feed (optimistic delete)
     */
    const handleDeletePost = useCallback((postId: string) => {
        setPosts(prev => prev.filter(post => post.id !== postId))
    }, [])

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
        <div className="max-w-[470px] mx-auto">
            {/* New Posts Notification Banner */}
            {hasNewPosts && (
                <button
                    onClick={handleRefreshFeed}
                    className="w-full py-2.5 px-4 mb-4 bg-cosmic-purple/10 border border-cosmic-purple/30 rounded-lg flex items-center justify-center gap-2 text-cosmic-purple hover:bg-cosmic-purple/20 transition-all"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span className="font-medium text-sm">New posts available</span>
                </button>
            )}

            {/* Posts Feed - Single Column */}
            <div className="space-y-0">
                {posts.map((post) => (
                    <PostCard 
                        key={post.id} 
                        post={post} 
                        currentUserId={userId}
                        onDelete={handleDeletePost}
                    />
                ))}
            </div>

            {/* Load More Trigger / Loading More State */}
            <div ref={loadMoreRef} className="py-8">
                {isLoadingMore && (
                    <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-5 h-5 text-cosmic-purple animate-spin" />
                        <span className="text-white/50 text-sm">Loading more...</span>
                    </div>
                )}
                {!hasMore && posts.length > 0 && (
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-white/40 text-sm">
                            <div className="w-1 h-1 rounded-full bg-white/40"></div>
                            <span>You're all caught up</span>
                            <div className="w-1 h-1 rounded-full bg-white/40"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
