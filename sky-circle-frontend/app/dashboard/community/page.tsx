'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { 
    Camera, Heart, MessageCircle, Share2, MoreHorizontal, User, Send, Loader2, 
    Image as ImageIcon, Sparkles, TrendingUp, Users, X, Bookmark, Flag,
    ChevronDown, ChevronUp, Clock, Flame, Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { STORAGE_BUCKETS } from '@/lib/constants'

// Portal-based dropdown menu component
function PostMenu({ 
    isOwner, 
    isBookmarked,
    anchorRect,
    onClose, 
    onDelete,
    onBookmark,
    onReport
}: { 
    isOwner: boolean
    isBookmarked: boolean
    anchorRect: DOMRect
    onClose: () => void
    onDelete: () => void
    onBookmark: () => void
    onReport: () => void
}) {
    const menuRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)
    const [position, setPosition] = useState({ top: 0, left: 0 })

    useEffect(() => {
        setMounted(true)
        // Position directly to the left of the button with small gap
        setPosition({
            top: anchorRect.top - 4,
            left: anchorRect.left - 142
        })
    }, [anchorRect])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }

        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside)
        }, 10)
        
        return () => {
            clearTimeout(timer)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [onClose])

    if (!mounted) return null

    return createPortal(
        <div 
            ref={menuRef}
            className="glass-effect rounded-xl py-2 z-[9999] shadow-2xl border border-white/10"
            style={{ 
                position: 'fixed',
                top: `${position.top}px`, 
                left: `${position.left}px` 
            }}
        >
            <button 
                onClick={onBookmark}
                className={cn(
                    "px-4 py-2.5 text-left text-sm hover:bg-white/5 flex items-center gap-3 transition-colors",
                    isBookmarked ? "text-cosmic-gold" : "text-white/70 hover:text-white"
                )}
            >
                <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} /> 
                {isBookmarked ? 'Saved' : 'Save'}
            </button>
            <button 
                onClick={onReport}
                className="px-4 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
            >
                <Flag className="w-4 h-4" /> Report
            </button>
            {isOwner && (
                <button 
                    onClick={onDelete}
                    className="px-4 py-2.5 text-left text-sm text-cosmic-pink hover:bg-white/5 flex items-center gap-3 transition-colors"
                >
                    <X className="w-4 h-4" /> Delete
                </button>
            )}
        </div>,
        document.body
    )
}

interface UserProfile {
    id: string
    display_name: string
    profile_photo_url: string | null
    level: number
    total_points: number
}

interface Comment {
    id: string
    content: string
    created_at: string
    user_id: string
    users: UserProfile
}

interface Post {
    id: string
    user_id: string
    caption: string
    image_url: string
    created_at: string
    users: UserProfile
    likes_count: number
    comments_count: number
    is_liked: boolean
    is_bookmarked: boolean
    comments?: Comment[]
}

type FeedFilter = 'latest' | 'trending' | 'following'

export default function CommunityFeedPage() {
    const supabase = createClient()
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [newCaption, setNewCaption] = useState('')
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [feedFilter, setFeedFilter] = useState<FeedFilter>('latest')
    const [onlineUsers, setOnlineUsers] = useState<UserProfile[]>([])
    const [trendingPosts, setTrendingPosts] = useState<Post[]>([])
    const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([])
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
    const [submittingComment, setSubmittingComment] = useState<string | null>(null)
    const [showPostMenu, setShowPostMenu] = useState<string | null>(null)
    const [menuAnchorRect, setMenuAnchorRect] = useState<DOMRect | null>(null)
    const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set())
    const [reportingPost, setReportingPost] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Load bookmarks from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('bookmarked_posts')
        if (saved) {
            setBookmarkedPosts(new Set(JSON.parse(saved)))
        }
    }, [])

    // Initialize and fetch data
    useEffect(() => {
        initializeUser()
        fetchPosts()
        fetchTrendingPosts()
        fetchSuggestedUsers()
    }, [feedFilter])

    // Real-time subscriptions
    useEffect(() => {
        const postsChannel = supabase
            .channel('posts-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, handleNewPost)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, handlePostUpdate)
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, handlePostDelete)
            .subscribe()

        const likesChannel = supabase
            .channel('likes-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, handleLikeChange)
            .subscribe()

        const commentsChannel = supabase
            .channel('comments-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, handleNewComment)
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments' }, handleCommentDelete)
            .subscribe()

        // Presence for online users
        const presenceChannel = supabase.channel('online-users')
        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState()
                const users = Object.values(state).flat() as any[]
                setOnlineUsers(users.map(u => u.user).filter(Boolean))
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED' && currentUser) {
                    await presenceChannel.track({ user: currentUser })
                }
            })

        return () => {
            supabase.removeChannel(postsChannel)
            supabase.removeChannel(likesChannel)
            supabase.removeChannel(commentsChannel)
            supabase.removeChannel(presenceChannel)
        }
    }, [currentUser])

    const initializeUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase
                .from('users')
                .select('id, display_name, profile_photo_url, level, total_points')
                .eq('id', user.id)
                .single()
            if (data) setCurrentUser(data)
        }
    }

    const fetchPosts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            let query = supabase
                .from('posts')
                .select(`
                    *,
                    users(id, display_name, profile_photo_url, level, total_points),
                    likes_count:likes(count),
                    comments_count:comments(count),
                    is_liked:likes!left(user_id)
                `)
                .eq('is_deleted', false)

            if (feedFilter === 'trending') {
                query = query.order('created_at', { ascending: false }).limit(50)
            } else {
                query = query.order('created_at', { ascending: false })
            }

            const { data, error } = await query
            if (error) throw error

            let formattedPosts = data.map(post => ({
                ...post,
                likes_count: post.likes_count[0]?.count || 0,
                comments_count: post.comments_count[0]?.count || 0,
                is_liked: post.is_liked?.some((l: any) => l.user_id === user?.id) || false,
                is_bookmarked: false
            }))

            if (feedFilter === 'trending') {
                formattedPosts = formattedPosts.sort((a, b) => 
                    (b.likes_count + b.comments_count * 2) - (a.likes_count + a.comments_count * 2)
                )
            }

            setPosts(formattedPosts)
        } catch (error: any) {
            console.error('Error fetching posts:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchTrendingPosts = async () => {
        const { data } = await supabase
            .from('posts')
            .select(`*, users(display_name, profile_photo_url), likes_count:likes(count)`)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(20)

        if (data) {
            const sorted = data
                .map(p => ({ ...p, likes_count: p.likes_count[0]?.count || 0 }))
                .sort((a, b) => b.likes_count - a.likes_count)
                .slice(0, 3)
            setTrendingPosts(sorted as any)
        }
    }

    const fetchSuggestedUsers = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        const { data } = await supabase
            .from('users')
            .select('id, display_name, profile_photo_url, level, total_points')
            .neq('id', user?.id || '')
            .order('total_points', { ascending: false })
            .limit(5)
        if (data) setSuggestedUsers(data)
    }

    // Real-time handlers
    const handleNewPost = async (payload: any) => {
        const { data } = await supabase
            .from('posts')
            .select(`*, users(id, display_name, profile_photo_url, level, total_points)`)
            .eq('id', payload.new.id)
            .single()
        if (data) {
            setPosts(prev => [{ ...data, likes_count: 0, comments_count: 0, is_liked: false, is_bookmarked: false }, ...prev])
        }
    }

    const handlePostUpdate = (payload: any) => {
        setPosts(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p))
    }

    const handlePostDelete = (payload: any) => {
        setPosts(prev => prev.filter(p => p.id !== payload.old.id))
    }

    const handleLikeChange = async (payload: any) => {
        const postId = payload.new?.post_id || payload.old?.post_id
        if (!postId) return
        
        const { data: { user } } = await supabase.auth.getUser()
        const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', postId)
        const { data: userLike } = await supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', user?.id || '').single()
        
        setPosts(prev => prev.map(p => 
            p.id === postId ? { ...p, likes_count: count || 0, is_liked: !!userLike } : p
        ))
    }

    const handleNewComment = async (payload: any) => {
        const { data } = await supabase
            .from('comments')
            .select(`*, users(id, display_name, profile_photo_url, level, total_points)`)
            .eq('id', payload.new.id)
            .single()
        
        if (data) {
            setPosts(prev => prev.map(p => {
                if (p.id === payload.new.post_id) {
                    return {
                        ...p,
                        comments_count: p.comments_count + 1,
                        comments: p.comments ? [...p.comments, data] : [data]
                    }
                }
                return p
            }))
        }
    }

    const handleCommentDelete = (payload: any) => {
        setPosts(prev => prev.map(p => {
            if (p.comments?.some(c => c.id === payload.old.id)) {
                return {
                    ...p,
                    comments_count: Math.max(0, p.comments_count - 1),
                    comments: p.comments?.filter(c => c.id !== payload.old.id)
                }
            }
            return p
        }))
    }

    // Actions
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedImage(file)
            const reader = new FileReader()
            reader.onloadend = () => setImagePreview(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    const handleCreatePost = async () => {
        if (!newCaption || !selectedImage) return
        setCreating(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not logged in')

            const { data: userProfile } = await supabase
                .from('users')
                .select('id')
                .eq('id', user.id)
                .single()

            if (!userProfile) throw new Error('Please complete your profile setup first')

            const fileExt = selectedImage.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKETS.POST_IMAGES)
                .upload(fileName, selectedImage)

            if (uploadError) {
                if (uploadError.message.includes('Bucket not found')) {
                    throw new Error(`Storage bucket "${STORAGE_BUCKETS.POST_IMAGES}" not found. Please create it in Supabase dashboard.`)
                }
                throw uploadError
            }

            const { data: { publicUrl } } = supabase.storage
                .from(STORAGE_BUCKETS.POST_IMAGES)
                .getPublicUrl(fileName)

            const { data: newPost, error: insertError } = await supabase.from('posts').insert({
                user_id: user.id,
                caption: newCaption,
                image_url: publicUrl
            }).select().single()

            if (insertError) throw insertError

            // Trigger webhook for post.created event
            if (newPost) {
                try {
                    const { triggerWebhookAction } = await import('@/app/actions/webhooks')
                    await triggerWebhookAction('post.created', {
                        post_id: newPost.id,
                        user_id: newPost.user_id,
                        caption: newPost.caption,
                        image_url: newPost.image_url,
                        created_at: newPost.created_at
                    })
                } catch (webhookError) {
                    console.error('Webhook trigger failed:', webhookError)
                    // Don't fail the post creation if webhook fails
                }
            }

            setNewCaption('')
            setSelectedImage(null)
            setImagePreview(null)
        } catch (error: any) {
            alert(error.message)
        } finally {
            setCreating(false)
        }
    }

    const toggleLike = async (postId: string, currentlyLiked: boolean) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Optimistic update
        setPosts(prev => prev.map(p => 
            p.id === postId ? { 
                ...p, 
                is_liked: !currentlyLiked, 
                likes_count: currentlyLiked ? p.likes_count - 1 : p.likes_count + 1 
            } : p
        ))

        if (currentlyLiked) {
            await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id)
        } else {
            const { data: newLike } = await supabase.from('likes').insert({ 
                post_id: postId, 
                user_id: user.id 
            }).select().single()

            // Trigger webhook for like.created event
            if (newLike) {
                try {
                    const { triggerWebhookAction } = await import('@/app/actions/webhooks')
                    await triggerWebhookAction('like.created', {
                        like_id: newLike.id,
                        post_id: postId,
                        user_id: user.id,
                        created_at: newLike.created_at
                    })
                } catch (error) {
                    console.error('Webhook trigger failed:', error)
                }
            }
        }
    }

    const toggleComments = async (postId: string) => {
        const newExpanded = new Set(expandedComments)
        if (newExpanded.has(postId)) {
            newExpanded.delete(postId)
        } else {
            newExpanded.add(postId)
            // Fetch comments if not loaded
            const post = posts.find(p => p.id === postId)
            if (!post?.comments) {
                const { data } = await supabase
                    .from('comments')
                    .select(`*, users(id, display_name, profile_photo_url, level, total_points)`)
                    .eq('post_id', postId)
                    .order('created_at', { ascending: true })
                
                if (data) {
                    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: data } : p))
                }
            }
        }
        setExpandedComments(newExpanded)
    }

    const submitComment = async (postId: string) => {
        const content = commentInputs[postId]?.trim()
        if (!content) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setSubmittingComment(postId)
        const { data: newComment } = await supabase.from('comments').insert({ 
            post_id: postId, 
            user_id: user.id, 
            content 
        }).select().single()

        // Trigger webhook for comment.created event
        if (newComment) {
            try {
                const { triggerWebhookAction } = await import('@/app/actions/webhooks')
                await triggerWebhookAction('comment.created', {
                    comment_id: newComment.id,
                    post_id: postId,
                    user_id: user.id,
                    content: content,
                    created_at: newComment.created_at
                })
            } catch (error) {
                console.error('Webhook trigger failed:', error)
            }
        }

        setCommentInputs(prev => ({ ...prev, [postId]: '' }))
        setSubmittingComment(null)
    }

    const deletePost = async (postId: string) => {
        await supabase.from('posts').update({ is_deleted: true }).eq('id', postId)
        setShowPostMenu(null)
        setMenuAnchorRect(null)
    }

    const toggleBookmark = (postId: string) => {
        setBookmarkedPosts(prev => {
            const newSet = new Set(prev)
            if (newSet.has(postId)) {
                newSet.delete(postId)
            } else {
                newSet.add(postId)
            }
            localStorage.setItem('bookmarked_posts', JSON.stringify([...newSet]))
            return newSet
        })
        setShowPostMenu(null)
        setMenuAnchorRect(null)
    }

    const reportPost = async (postId: string) => {
        setReportingPost(postId)
        try {
            await supabase.from('posts').update({ is_reported: true }).eq('id', postId)
            alert('Post reported successfully. Our team will review it.')
        } catch (error) {
            alert('Failed to report post. Please try again.')
        } finally {
            setReportingPost(null)
            setShowPostMenu(null)
            setMenuAnchorRect(null)
        }
    }

    const sharePost = async (post: Post) => {
        const shareData = {
            title: `Check out this post by ${post.users?.display_name || 'Observer'}`,
            text: post.caption || 'Amazing astronomy photo!',
            url: `${window.location.origin}/dashboard/community?post=${post.id}`
        }

        try {
            if (navigator.share) {
                await navigator.share(shareData)
            } else {
                await navigator.clipboard.writeText(shareData.url)
                alert('Link copied to clipboard!')
            }
        } catch (error) {
            // User cancelled or error
            console.log('Share cancelled')
        }
    }

    const deleteComment = async (commentId: string, postId: string) => {
        await supabase.from('comments').delete().eq('id', commentId)
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    comments_count: Math.max(0, p.comments_count - 1),
                    comments: p.comments?.filter(c => c.id !== commentId)
                }
            }
            return p
        }))
    }

    const formatTimeAgo = (date: string) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
        if (seconds < 60) return 'just now'
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
        return `${Math.floor(seconds / 86400)}d ago`
    }

    return (
        <div className="py-0">
            <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                {/* Main Feed */}
                <div className="flex-1 space-y-4 sm:space-y-6 max-w-2xl">
                    {/* Create Post Card */}
                    <div className="glass-effect rounded-2xl sm:rounded-3xl p-4 sm:p-6">
                        <div className="flex gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden glass-inner flex-shrink-0 flex items-center justify-center">
                                {currentUser?.profile_photo_url ? (
                                    <img src={currentUser.profile_photo_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-white/30" />
                                )}
                            </div>
                            <div className="flex-1 space-y-3 sm:space-y-4">
                                <textarea
                                    value={newCaption}
                                    onChange={(e) => setNewCaption(e.target.value)}
                                    placeholder="Share your cosmic discovery..."
                                    className="w-full bg-transparent border-none focus:ring-0 text-sm sm:text-lg resize-none placeholder:text-white/30 text-white"
                                    rows={2}
                                />

                                {imagePreview && (
                                    <div className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden glass-inner group">
                                        <img src={imagePreview} className="w-full h-full object-cover" alt="" />
                                        <button
                                            onClick={() => { setSelectedImage(null); setImagePreview(null) }}
                                            className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 glass-effect rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-1.5 sm:gap-2 text-white/40 hover:text-cosmic-blue transition-all text-xs sm:text-sm"
                                    >
                                        <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span>Add Photo</span>
                                    </button>
                                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />

                                    <button
                                        onClick={handleCreatePost}
                                        disabled={creating || !newCaption || !selectedImage}
                                        className="px-4 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-lg sm:rounded-xl font-semibold flex items-center gap-1.5 sm:gap-2 disabled:opacity-40 hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm"
                                    >
                                        {creating ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                        Post
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feed Filter Tabs */}
                    <div className="glass-effect rounded-xl sm:rounded-2xl p-1 sm:p-1.5 flex gap-1">
                        {[
                            { key: 'latest', label: 'Latest', icon: Clock },
                            { key: 'trending', label: 'Trending', icon: Flame },
                        ].map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setFeedFilter(key as FeedFilter)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all",
                                    feedFilter === key 
                                        ? "bg-gradient-to-r from-cosmic-purple/30 to-cosmic-pink/30 text-white" 
                                        : "text-white/50 hover:text-white/80"
                                )}
                            >
                                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Posts */}
                    {loading ? (
                        <div className="space-y-4 sm:space-y-6">
                            {[1, 2].map(i => (
                                <div key={i} className="glass-effect h-[350px] sm:h-[450px] rounded-2xl sm:rounded-3xl animate-pulse" />
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="glass-effect rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
                            <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-cosmic-purple mx-auto mb-3 sm:mb-4" />
                            <h3 className="text-lg sm:text-xl font-bold mb-2">No posts yet</h3>
                            <p className="text-sm sm:text-base text-white/50">Be the first to share a cosmic discovery!</p>
                        </div>
                    ) : (
                        posts.map(post => (
                            <div key={post.id} className="glass-effect rounded-2xl sm:rounded-3xl relative">
                                {/* Post Header */}
                                <div className="p-3 sm:p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="relative">
                                            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden glass-inner flex items-center justify-center">
                                                {post.users?.profile_photo_url ? (
                                                    <img src={post.users.profile_photo_url} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white/30" />
                                                )}
                                            </div>
                                            {onlineUsers.some(u => u.id === post.user_id) && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-cosmic-gold rounded-full border-2 border-dark-50" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                <p className="font-semibold text-sm sm:text-base text-white">{post.users?.display_name || 'Observer'}</p>
                                                {post.users?.level && post.users.level >= 5 && (
                                                    <span className="px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded text-white">
                                                        LVL {post.users.level}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] sm:text-xs text-white/40">{formatTimeAgo(post.created_at)}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (showPostMenu === post.id) {
                                                setShowPostMenu(null)
                                                setMenuAnchorRect(null)
                                            } else {
                                                setShowPostMenu(post.id)
                                                setMenuAnchorRect(e.currentTarget.getBoundingClientRect())
                                            }
                                        }}
                                        className="text-white/30 hover:text-white transition-colors p-1.5 sm:p-2"
                                    >
                                        <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                    {showPostMenu === post.id && menuAnchorRect && (
                                        <PostMenu
                                            isOwner={currentUser?.id === post.user_id}
                                            isBookmarked={bookmarkedPosts.has(post.id)}
                                            anchorRect={menuAnchorRect}
                                            onClose={() => {
                                                setShowPostMenu(null)
                                                setMenuAnchorRect(null)
                                            }}
                                            onDelete={() => deletePost(post.id)}
                                            onBookmark={() => toggleBookmark(post.id)}
                                            onReport={() => reportPost(post.id)}
                                        />
                                    )}
                                </div>

                                {/* Caption */}
                                {post.caption && (
                                    <div className="px-3 sm:px-5 pb-2 sm:pb-3">
                                        <p className="text-white/90 text-sm sm:text-[15px] leading-relaxed">{post.caption}</p>
                                    </div>
                                )}

                                {/* Image */}
                                <div className="aspect-square w-full bg-white/5 relative group overflow-hidden rounded-none">
                                    <img
                                        src={post.image_url}
                                        className="w-full h-full object-cover"
                                        alt=""
                                        onDoubleClick={() => toggleLike(post.id, post.is_liked)}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                {/* Actions */}
                                <div className="p-3 sm:p-5">
                                    <div className="flex items-center gap-4 sm:gap-5 mb-2 sm:mb-3">
                                        <button
                                            onClick={() => toggleLike(post.id, post.is_liked)}
                                            className={cn(
                                                "flex items-center gap-1.5 sm:gap-2 transition-all active:scale-125",
                                                post.is_liked ? "text-cosmic-pink" : "text-white/50 hover:text-white"
                                            )}
                                        >
                                            <Heart className={cn("w-5 h-5 sm:w-6 sm:h-6", post.is_liked && "fill-current")} />
                                            <span className="text-xs sm:text-sm font-medium">{post.likes_count}</span>
                                        </button>
                                        <button 
                                            onClick={() => toggleComments(post.id)}
                                            className="flex items-center gap-1.5 sm:gap-2 text-white/50 hover:text-white transition-colors"
                                        >
                                            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                            <span className="text-xs sm:text-sm font-medium">{post.comments_count}</span>
                                        </button>
                                        <button 
                                            onClick={() => sharePost(post)}
                                            className="flex items-center gap-1.5 sm:gap-2 text-white/30 hover:text-white transition-colors ml-auto"
                                        >
                                            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                        <button 
                                            onClick={() => toggleBookmark(post.id)}
                                            className={cn(
                                                "transition-colors",
                                                bookmarkedPosts.has(post.id) ? "text-cosmic-gold" : "text-white/30 hover:text-cosmic-gold"
                                            )}
                                        >
                                            <Bookmark className={cn("w-4 h-4 sm:w-5 sm:h-5", bookmarkedPosts.has(post.id) && "fill-current")} />
                                        </button>
                                    </div>

                                    {/* Comments Section */}
                                    {expandedComments.has(post.id) && (
                                        <div className="border-t border-white/5 pt-3 sm:pt-4 mt-2 sm:mt-3 space-y-3 sm:space-y-4">
                                            {/* Comments List */}
                                            <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                                                {post.comments?.map(comment => (
                                                    <div key={comment.id} className="flex gap-2 sm:gap-3 group">
                                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden glass-inner flex-shrink-0 flex items-center justify-center">
                                                            {comment.users?.profile_photo_url ? (
                                                                <img src={comment.users.profile_photo_url} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/30" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 glass-inner rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 relative">
                                                            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                                                                <span className="text-xs sm:text-sm font-medium text-white">{comment.users?.display_name || 'User'}</span>
                                                                <span className="text-[10px] sm:text-xs text-white/30">{formatTimeAgo(comment.created_at)}</span>
                                                            </div>
                                                            <p className="text-xs sm:text-sm text-white/80">{comment.content}</p>
                                                            {currentUser?.id === comment.user_id && (
                                                                <button
                                                                    onClick={() => deleteComment(comment.id, post.id)}
                                                                    className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 p-1 text-white/20 hover:text-cosmic-pink opacity-0 group-hover:opacity-100 transition-all"
                                                                >
                                                                    <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!post.comments || post.comments.length === 0) && (
                                                    <p className="text-center text-white/30 text-xs sm:text-sm py-3 sm:py-4">No comments yet. Be the first!</p>
                                                )}
                                            </div>

                                            {/* Comment Input */}
                                            <div className="flex gap-2 sm:gap-3 items-center">
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden glass-inner flex-shrink-0 flex items-center justify-center">
                                                    {currentUser?.profile_photo_url ? (
                                                        <img src={currentUser.profile_photo_url} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/30" />
                                                    )}
                                                </div>
                                                <div className="flex-1 flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={commentInputs[post.id] || ''}
                                                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                        onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)}
                                                        placeholder="Write a comment..."
                                                        className="flex-1 glass-input rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-white placeholder:text-white/30"
                                                    />
                                                    <button
                                                        onClick={() => submitComment(post.id)}
                                                        disabled={!commentInputs[post.id]?.trim() || submittingComment === post.id}
                                                        className="p-1.5 sm:p-2 bg-cosmic-purple/30 hover:bg-cosmic-purple/50 rounded-lg sm:rounded-xl disabled:opacity-40 transition-all"
                                                    >
                                                        {submittingComment === post.id ? (
                                                            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                                                        ) : (
                                                            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Show/Hide Comments Toggle */}
                                    {post.comments_count > 0 && !expandedComments.has(post.id) && (
                                        <button 
                                            onClick={() => toggleComments(post.id)}
                                            className="text-white/40 text-xs sm:text-sm hover:text-white/60 transition-colors"
                                        >
                                            View all {post.comments_count} comments
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Sidebar */}
                <div className="hidden lg:block w-80 space-y-6">
                    {/* Online Users */}
                    {onlineUsers.length > 0 && (
                        <div className="glass-effect rounded-3xl p-5">
                            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-white/70">
                                <div className="w-2 h-2 bg-cosmic-gold rounded-full animate-pulse" />
                                Online Now ({onlineUsers.length})
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {onlineUsers.slice(0, 8).map(user => (
                                    <div key={user.id} className="relative group">
                                        <div className="w-10 h-10 rounded-full overflow-hidden glass-inner flex items-center justify-center">
                                            {user.profile_photo_url ? (
                                                <img src={user.profile_photo_url} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <User className="w-5 h-5 text-white/30" />
                                            )}
                                        </div>
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 glass-effect px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            {user.display_name}
                                        </div>
                                    </div>
                                ))}
                                {onlineUsers.length > 8 && (
                                    <div className="w-10 h-10 rounded-full glass-inner flex items-center justify-center text-xs font-medium text-white/50">
                                        +{onlineUsers.length - 8}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Trending Posts */}
                    <div className="glass-effect rounded-3xl p-5">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-white/70">
                            <TrendingUp className="w-4 h-4 text-cosmic-pink" />
                            Trending This Week
                        </h3>
                        <div className="space-y-3">
                            {trendingPosts.map((post, i) => (
                                <div key={post.id} className="flex gap-3 items-center group cursor-pointer">
                                    <span className="text-lg font-bold text-white/20 w-5">{i + 1}</span>
                                    <div className="w-12 h-12 rounded-xl overflow-hidden glass-inner flex-shrink-0">
                                        <img src={post.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white/80 truncate">{post.caption || 'Untitled'}</p>
                                        <p className="text-xs text-white/40 flex items-center gap-1">
                                            <Heart className="w-3 h-3" /> {post.likes_count}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Suggested Users */}
                    <div className="glass-effect rounded-3xl p-5">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-white/70">
                            <Users className="w-4 h-4 text-cosmic-blue" />
                            Top Observers
                        </h3>
                        <div className="space-y-3">
                            {suggestedUsers.map(user => (
                                <div key={user.id} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden glass-inner flex items-center justify-center">
                                        {user.profile_photo_url ? (
                                            <img src={user.profile_photo_url} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <User className="w-5 h-5 text-white/30" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{user.display_name}</p>
                                        <p className="text-xs text-white/40 flex items-center gap-1">
                                            <Star className="w-3 h-3 text-cosmic-gold" /> {user.total_points} pts
                                        </p>
                                    </div>
                                    <span className="text-xs px-2 py-1 glass-inner rounded-lg text-white/50">
                                        Lvl {user.level}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Photo of the Week */}
                    <div className="glass-effect rounded-3xl p-5">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-white/70">
                            <Camera className="w-4 h-4 text-cosmic-purple" />
                            Photo of the Week
                        </h3>
                        <div className="aspect-square rounded-2xl overflow-hidden glass-inner">
                            <img 
                                src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=500" 
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                                alt="Featured" 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
