'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Newspaper, Loader2, Users, Sparkles, Camera, Send, X, User, Clock, Flame, UserCheck } from 'lucide-react'
import FeedContainer from '@/components/social/FeedContainer'
import { getFollowingIds, getUserInterestNames } from '@/lib/services/feedService'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { STORAGE_BUCKETS } from '@/lib/constants'

/**
 * Timeline Page
 * Displays a personalized feed of posts from followed users and trending content
 * 
 * Validates: Requirements 4.1, 4.6, 4.7
 */

type FeedFilter = 'latest' | 'trending' | 'following'

export default function TimelinePage() {
    const router = useRouter()
    const supabase = createClient()
    
    // State
    const [userId, setUserId] = useState<string | null>(null)
    const [followingIds, setFollowingIds] = useState<string[]>([])
    const [userInterests, setUserInterests] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [feedFilter, setFeedFilter] = useState<FeedFilter>('latest')
    
    // Create post state
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [creating, setCreating] = useState(false)
    const [newCaption, setNewCaption] = useState('')
    const [selectedImages, setSelectedImages] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

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

                // Fetch user profile
                const { data: profile } = await supabase
                    .from('users')
                    .select('id, display_name, profile_photo_url, level, total_points')
                    .eq('id', user.id)
                    .single()
                
                if (profile) setCurrentUser(profile)

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

    // Memoize feed props to prevent re-renders when typing
    const feedProps = useMemo(() => ({
        userId: userId || '',
        followingIds: feedFilter === 'following' ? followingIds : [],
        userInterests: userInterests
    }), [userId, feedFilter, followingIds, userInterests])

    // Handle file selection (multiple images)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        setSelectedImages(files)
        setCurrentImageIndex(0)

        // Create previews for all images
        const previews: string[] = []
        let loadedCount = 0

        files.forEach((file) => {
            const reader = new FileReader()
            reader.onloadend = () => {
                previews.push(reader.result as string)
                loadedCount++
                if (loadedCount === files.length) {
                    setImagePreviews(previews)
                }
            }
            reader.readAsDataURL(file)
        })
    }

    // Remove a specific image
    const removeImage = (index: number) => {
        const newImages = selectedImages.filter((_, i) => i !== index)
        const newPreviews = imagePreviews.filter((_, i) => i !== index)
        setSelectedImages(newImages)
        setImagePreviews(newPreviews)
        
        // Adjust current index if needed
        if (currentImageIndex >= newImages.length && newImages.length > 0) {
            setCurrentImageIndex(newImages.length - 1)
        } else if (newImages.length === 0) {
            setCurrentImageIndex(0)
        }
    }

    // Navigate carousel
    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % imagePreviews.length)
    }

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + imagePreviews.length) % imagePreviews.length)
    }

    // Handle create post - creates in posts table
    const handleCreatePost = async () => {
        if (!newCaption || selectedImages.length === 0) return
        setCreating(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not logged in')

            // Upload first image
            const firstImage = selectedImages[0]
            const fileExt = firstImage.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}.${fileExt}`

            console.log('Uploading image to:', STORAGE_BUCKETS.POST_IMAGES, fileName)

            const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKETS.POST_IMAGES)
                .upload(fileName, firstImage)

            if (uploadError) {
                console.error('Upload error:', uploadError)
                if (uploadError.message.includes('Bucket not found')) {
                    throw new Error(`Storage bucket "${STORAGE_BUCKETS.POST_IMAGES}" not found. Please create it in Supabase dashboard.`)
                }
                throw uploadError
            }

            const { data: { publicUrl } } = supabase.storage
                .from(STORAGE_BUCKETS.POST_IMAGES)
                .getPublicUrl(fileName)

            console.log('Image uploaded, creating post with URL:', publicUrl)

            // Create post in posts table
            const { data: newPost, error: insertError } = await supabase
                .from('posts')
                .insert({
                    user_id: user.id,
                    caption: newCaption,
                    image_url: publicUrl,
                    is_deleted: false,
                    is_reported: false
                })
                .select()
                .single()

            if (insertError) {
                console.error('Insert error:', insertError)
                throw insertError
            }

            console.log('Post created successfully:', newPost)

            // Clear form
            setNewCaption('')
            setSelectedImages([])
            setImagePreviews([])
            setCurrentImageIndex(0)
            
            // Force reload to show new post
            window.location.reload()
        } catch (error: any) {
            console.error('Error creating post:', error)
            alert(`Failed to create post: ${error.message}`)
        } finally {
            setCreating(false)
        }
    }

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
            <div className="max-w-[630px] mx-auto">
                {/* Page Header - Instagram Style */}
                <div className="mb-6 pb-4 border-b border-white/10">
                    <h1 className="text-2xl font-bold">Timeline</h1>
                </div>

                {/* Create Post Card */}
                <div className="bg-[#0a0e17] border border-white/10 rounded-lg p-4 mb-4">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
                            {currentUser?.profile_photo_url ? (
                                <img src={currentUser.profile_photo_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <User className="w-5 h-5 text-white/30" />
                            )}
                        </div>
                        <div className="flex-1 space-y-3">
                            <textarea
                                value={newCaption}
                                onChange={(e) => setNewCaption(e.target.value)}
                                placeholder="Share your cosmic discovery..."
                                className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none placeholder:text-white/30 text-white"
                                rows={2}
                            />

                            {imagePreviews.length > 0 && (
                                <div className="relative aspect-video rounded-lg overflow-hidden bg-white/5 group">
                                    {/* Current Image */}
                                    <img 
                                        src={imagePreviews[currentImageIndex]} 
                                        className="w-full h-full object-cover" 
                                        alt="" 
                                    />
                                    
                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeImage(currentImageIndex)}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>

                                    {/* Navigation Arrows (only if multiple images) */}
                                    {imagePreviews.length > 1 && (
                                        <>
                                            <button
                                                onClick={prevImage}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={nextImage}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>

                                            {/* Dots Indicator */}
                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                                {imagePreviews.map((_, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => setCurrentImageIndex(index)}
                                                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                                                            index === currentImageIndex 
                                                                ? 'bg-white w-6' 
                                                                : 'bg-white/50'
                                                        }`}
                                                    />
                                                ))}
                                            </div>

                                            {/* Image Counter */}
                                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded-full text-white text-xs">
                                                {currentImageIndex + 1} / {imagePreviews.length}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-1.5 text-white/40 hover:text-cosmic-blue transition-all text-xs"
                                >
                                    <Camera className="w-4 h-4" />
                                    <span>Add Photo{imagePreviews.length > 0 ? 's' : ''}</span>
                                </button>
                                <input 
                                    ref={fileInputRef} 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*" 
                                    multiple
                                    onChange={handleFileChange} 
                                />

                                <button
                                    onClick={handleCreatePost}
                                    disabled={creating || !newCaption || selectedImages.length === 0}
                                    className="px-4 py-1.5 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-40 hover:scale-105 active:scale-95 transition-all text-xs"
                                >
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feed Filter Tabs */}
                <div className="bg-[#0a0e17] border border-white/10 rounded-lg p-1 flex gap-1 mb-4">
                    {[
                        { key: 'latest', label: 'Latest', icon: Clock },
                        { key: 'trending', label: 'Trending', icon: Flame },
                        { key: 'following', label: 'Following', icon: UserCheck },
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setFeedFilter(key as FeedFilter)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                                feedFilter === key 
                                    ? "bg-gradient-to-r from-cosmic-purple/30 to-cosmic-pink/30 text-white" 
                                    : "text-white/50 hover:text-white/80"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Feed Container - Requirements 4.1, 4.7 */}
            <FeedContainer
                userId={feedProps.userId}
                followingIds={feedProps.followingIds}
                userInterests={feedProps.userInterests}
            />
        </div>
    )
}
