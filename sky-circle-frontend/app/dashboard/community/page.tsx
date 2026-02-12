'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Heart, MessageCircle, Share2, MoreHorizontal, User, Send, Loader2, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STORAGE_BUCKETS } from '@/lib/constants'

interface Post {
    id: string
    user_id: string
    caption: string
    image_url: string
    created_at: string
    users: {
        display_name: string
        profile_photo_url: string
    }
    likes_count: number
    comments_count: number
    id_liked: boolean
}

export default function CommunityFeedPage() {
    const supabase = createClient()
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [newCaption, setNewCaption] = useState('')
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    useEffect(() => {
        fetchPosts()
    }, [])

    const fetchPosts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { data, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    users(display_name, profile_photo_url),
                    likes_count:likes(count),
                    comments_count:comments(count),
                    is_liked:likes!left(user_id)
                `)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false })

            if (error) throw error

            const formattedPosts = data.map(post => ({
                ...post,
                likes_count: post.likes_count[0]?.count || 0,
                comments_count: post.comments_count[0]?.count || 0,
                is_liked: post.is_liked?.some((l: any) => l.user_id === user?.id) || false
            }))

            setPosts(formattedPosts)
        } catch (error: any) {
            console.error('Error fetching posts:', error.message)
        } finally {
            setLoading(false)
        }
    }

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

            // Ensure user exists in users table
            const { data: userProfile } = await supabase
                .from('users')
                .select('id')
                .eq('id', user.id)
                .single()

            if (!userProfile) {
                throw new Error('Please complete your profile setup first')
            }

            const fileExt = selectedImage.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKETS.POST_IMAGES)
                .upload(fileName, selectedImage)

            if (uploadError) {
                if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket')) {
                    throw new Error(`Storage bucket "${STORAGE_BUCKETS.POST_IMAGES}" not found. Please create it in your Supabase dashboard under Storage.`)
                }
                throw uploadError
            }

            const { data: { publicUrl } } = supabase.storage
                .from(STORAGE_BUCKETS.POST_IMAGES)
                .getPublicUrl(fileName)

            const { error: insertError } = await supabase
                .from('posts')
                .insert({
                    user_id: user.id,
                    caption: newCaption,
                    image_url: publicUrl
                })

            if (insertError) throw insertError

            setNewCaption('')
            setSelectedImage(null)
            setImagePreview(null)
            fetchPosts()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setCreating(false)
        }
    }

    const toggleLike = async (postId: string, currentlyLiked: boolean) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            if (currentlyLiked) {
                await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id)
            } else {
                await supabase.from('likes').insert({ post_id: postId, user_id: user.id })
            }
            fetchPosts()
        } catch (error) {
            console.error('Error toggling like:', error)
        }
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 flex flex-col md:flex-row gap-8">
            {/* Feed */}
            <div className="flex-1 space-y-8">
                {/* Create Post */}
                <div className="glass-effect rounded-3xl p-6">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden glass-inner flex-shrink-0 flex items-center justify-center">
                            <User className="w-6 h-6 text-white/20" />
                        </div>
                        <div className="flex-1 space-y-4">
                            <textarea
                                value={newCaption}
                                onChange={(e) => setNewCaption(e.target.value)}
                                placeholder="Share a cosmic discovery or astrophotography..."
                                className="w-full bg-transparent border-none focus:ring-0 text-xl font-black resize-none placeholder:text-white/20 text-white tracking-tight"
                                rows={2}
                            />

                            {imagePreview && (
                                <div className="relative aspect-video rounded-2xl overflow-hidden glass-inner group">
                                    <img src={imagePreview} className="w-full h-full object-cover" alt="" />
                                    <button
                                        onClick={() => { setSelectedImage(null); setImagePreview(null) }}
                                        className="absolute top-4 right-4 p-2 glass-effect rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <MoreHorizontal className="w-5 h-5 rotate-45" />
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <button
                                    onClick={() => document.getElementById('feed-image-upload')?.click()}
                                    className="flex items-center gap-3 text-white/40 hover:text-cosmic-purple transition-all font-black text-[10px] uppercase tracking-widest"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                    <span>Sync Photo</span>
                                </button>
                                <input id="feed-image-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />

                                <button
                                    onClick={handleCreatePost}
                                    disabled={creating || !newCaption || !selectedImage}
                                    className="px-6 py-2 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
                                >
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Posts */}
                {loading ? (
                    <div className="space-y-8">
                        {[1, 2].map(i => (
                            <div key={i} className="glass-effect h-[500px] rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    posts.map(post => (
                        <div key={post.id} className="glass-effect rounded-3xl overflow-hidden">
                            {/* User Header */}
                            <div className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden glass-inner flex items-center justify-center">
                                        {post.users?.profile_photo_url ? (
                                            <img src={post.users.profile_photo_url} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <User className="w-5 h-5 text-white/20" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-black text-sm tracking-tight text-white">{post.users?.display_name || 'Observer'}</p>
                                        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-none mt-1">{new Date(post.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <button className="text-white/20 hover:text-white transition-colors">
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Caption */}
                            <div className="px-6 pb-4">
                                <p className="text-gray-200">{post.caption}</p>
                            </div>

                            {/* Image */}
                            <div className="aspect-square w-full bg-white/5">
                                <img
                                    src={post.image_url}
                                    className="w-full h-full object-cover"
                                    alt=""
                                    onDoubleClick={() => toggleLike(post.id, post.id_liked)}
                                />
                            </div>

                            {/* Actions */}
                            <div className="p-6">
                                <div className="flex items-center gap-6 mb-4">
                                    <button
                                        onClick={() => toggleLike(post.id, post.id_liked)}
                                        className={cn(
                                            "flex items-center gap-2 font-black transition-all active:scale-125",
                                            post.id_liked ? "text-cosmic-pink drop-shadow-[0_0_8px_rgba(244,114,182,0.4)]" : "text-white/40 hover:text-white"
                                        )}
                                    >
                                        <Heart className={cn("w-6 h-6", post.id_liked && "fill-current")} />
                                        <span className="text-xs">{post.likes_count}</span>
                                    </button>
                                    <button className="flex items-center gap-2 text-white/40 hover:text-white transition-colors font-black">
                                        <MessageCircle className="w-6 h-6" />
                                        <span className="text-xs">{post.comments_count}</span>
                                    </button>
                                    <button className="flex items-center gap-2 text-white/20 hover:text-white transition-colors ml-auto">
                                        <Share2 className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Sidebar (Community Stats/Trending) */}
            <div className="hidden lg:block w-80 space-y-6">
                <div className="glass-effect rounded-3xl p-8">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                        <Camera className="w-5 h-5 text-cosmic-purple" />
                        Photo of the Week
                    </h3>
                    <div className="aspect-square rounded-2xl overflow-hidden mb-4 glass-inner">
                        <img src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover" alt="" />
                    </div>
                </div>

                <div className="glass-effect rounded-3xl p-8">
                    <h3 className="text-xl font-black mb-6">Trending Tags</h3>
                    <div className="space-y-4">
                        {['#RaipurSkies', '#ChhattisgarhAstronomy', '#RaipurObserved', '#CGStarGaze'].map(tag => (
                            <div key={tag} className="flex items-center justify-between group cursor-pointer py-1">
                                <span className="text-white/40 group-hover:text-cosmic-purple transition-all font-black text-[10px] uppercase tracking-widest">{tag}</span>
                                <span className="text-[10px] glass-inner py-1 px-3 rounded-full font-black text-white/60">1.2k</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
