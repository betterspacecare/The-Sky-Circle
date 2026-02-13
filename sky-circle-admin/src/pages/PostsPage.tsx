import { useEffect, useState } from 'react'
import { useAdminStore } from '../store/adminStore'
import { Loader2, AlertTriangle, Check, Trash2, ExternalLink } from 'lucide-react'

export function PostsPage() {
    const { posts, fetchPosts, moderatePost, isLoading } = useAdminStore()
    const [filter, setFilter] = useState<'all' | 'reported'>('all')

    useEffect(() => {
        fetchPosts()
    }, [fetchPosts])

    const filteredPosts = filter === 'reported' 
        ? posts.filter(p => p.is_reported) 
        : posts

    const handleModerate = async (id: string, action: 'approve' | 'delete') => {
        if (action === 'delete' && !confirm('Are you sure you want to delete this post?')) {
            return
        }
        await moderatePost(id, action)
    }

    const reportedCount = posts.filter(p => p.is_reported).length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white">Posts Moderation</h2>
                    <p className="text-slate-400 text-sm">
                        {reportedCount > 0 ? (
                            <span className="text-red-400">{reportedCount} reported posts need review</span>
                        ) : (
                            'No reported posts'
                        )}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            filter === 'all'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        All Posts
                    </button>
                    <button
                        onClick={() => setFilter('reported')}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                            filter === 'reported'
                                ? 'bg-red-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Reported
                        {reportedCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-red-500 rounded text-xs">{reportedCount}</span>
                        )}
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPosts.map((post) => (
                        <div
                            key={post.id}
                            className={`bg-slate-800 rounded-xl border overflow-hidden ${
                                post.is_reported ? 'border-red-500/50' : 'border-slate-700'
                            }`}
                        >
                            {/* Image */}
                            <div className="aspect-square bg-slate-700 relative">
                                <img
                                    src={post.image_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                                {post.is_reported && (
                                    <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs rounded flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Reported
                                    </div>
                                )}
                                <a
                                    href={post.image_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute top-2 right-2 p-1 bg-black/50 rounded text-white hover:bg-black/70 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    {post.user?.profile_photo_url ? (
                                        <img
                                            src={post.user.profile_photo_url}
                                            alt=""
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm">
                                            {post.user?.display_name?.[0] || '?'}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-white text-sm font-medium">
                                            {post.user?.display_name || 'Unknown'}
                                        </p>
                                        <p className="text-slate-400 text-xs">
                                            {new Date(post.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {post.caption && (
                                    <p className="text-slate-300 text-sm mb-3 line-clamp-2">{post.caption}</p>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2">
                                    {post.is_reported && (
                                        <button
                                            onClick={() => handleModerate(post.id, 'approve')}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                                        >
                                            <Check className="w-4 h-4" />
                                            Approve
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleModerate(post.id, 'delete')}
                                        className={`flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm ${
                                            post.is_reported ? '' : 'flex-1'
                                        }`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isLoading && filteredPosts.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    {filter === 'reported' ? 'No reported posts' : 'No posts found'}
                </div>
            )}
        </div>
    )
}
