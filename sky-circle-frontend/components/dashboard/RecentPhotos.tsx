'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'

interface RecentPhotosProps {
    posts: any[]
}

export default function RecentPhotos({ posts }: RecentPhotosProps) {
    if (posts.length === 0) {
        return (
            <div className="glass-effect rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-4">Community Photos</h2>
                <p className="text-gray-400 text-center py-8">No photos yet. Be the first to share!</p>
            </div>
        )
    }

    return (
        <div className="glass-effect rounded-[2.5rem] p-10">
            <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black tracking-tighter text-white">Community Photos</h2>
                <Link href="/dashboard/community" className="text-cosmic-pink hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.15em]">
                    The lens
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {posts.map((post) => (
                    <Link
                        key={post.id}
                        href={`/dashboard/community#${post.id}`}
                        className="group relative aspect-square rounded-3xl overflow-hidden glass-inner"
                    >
                        <img
                            src={post.image_url}
                            alt={post.caption || 'Astrophotography'}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-4 left-4 right-4">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest truncate mb-1">{post.users?.display_name}</p>
                                {post.caption && (
                                    <p className="text-[8px] text-white/60 font-medium truncate italic">"{post.caption}"</p>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
