'use client'

import { useState, useCallback } from 'react'
import { Users, X, Loader2 } from 'lucide-react'
import { getFollowers, getFollowing, PaginatedResponse } from '@/lib/services/followService'
import { UserWithSocialData } from '@/types/social.types'
import Link from 'next/link'

/**
 * FollowStats Component
 * Displays follower and following counts with clickable modals
 * 
 * Validates: Requirement 3.4
 */

interface FollowStatsProps {
    userId: string;
    followerCount: number;
    followingCount: number;
    onCountsChange?: (followerCount: number, followingCount: number) => void;
}

type ModalType = 'followers' | 'following' | null;

/**
 * Formats large numbers for display
 * 1000 -> 1K, 1000000 -> 1M
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

export default function FollowStats({
    userId,
    followerCount,
    followingCount,
}: FollowStatsProps) {
    const [modalType, setModalType] = useState<ModalType>(null)
    const [users, setUsers] = useState<UserWithSocialData[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [total, setTotal] = useState(0)

    const fetchUsers = useCallback(async (type: ModalType, pageNum: number, append: boolean = false) => {
        if (!type) return

        if (pageNum === 1) {
            setLoading(true)
        } else {
            setLoadingMore(true)
        }

        try {
            const result = type === 'followers'
                ? await getFollowers(userId, { page: pageNum, pageSize: 20 })
                : await getFollowing(userId, { page: pageNum, pageSize: 20 })

            if (result.error) {
                console.error(`Error fetching ${type}:`, result.error)
                return
            }

            const data = result.data as PaginatedResponse<UserWithSocialData>
            
            if (append) {
                setUsers(prev => [...prev, ...data.data])
            } else {
                setUsers(data.data)
            }
            setHasMore(data.hasMore)
            setTotal(data.total)
            setPage(pageNum)
        } catch (error) {
            console.error(`Error fetching ${type}:`, error)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [userId])

    const openModal = (type: ModalType) => {
        setModalType(type)
        setUsers([])
        setPage(1)
        setHasMore(false)
        fetchUsers(type, 1)
    }

    const closeModal = () => {
        setModalType(null)
        setUsers([])
        setPage(1)
        setHasMore(false)
    }

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            fetchUsers(modalType, page + 1, true)
        }
    }

    return (
        <>
            {/* Stats Display */}
            <div className="flex items-center gap-8 sm:gap-10">
                <button
                    onClick={() => openModal('followers')}
                    className="flex flex-col items-center hover:opacity-80 transition-opacity"
                    aria-label={`${followerCount} followers`}
                >
                    <span className="text-2xl sm:text-3xl font-bold">{formatCount(followerCount)}</span>
                    <span className="text-sm sm:text-base text-white/60">Followers</span>
                </button>
                
                <button
                    onClick={() => openModal('following')}
                    className="flex flex-col items-center hover:opacity-80 transition-opacity"
                    aria-label={`${followingCount} following`}
                >
                    <span className="text-2xl sm:text-3xl font-bold">{formatCount(followingCount)}</span>
                    <span className="text-sm sm:text-base text-white/60">Following</span>
                </button>
            </div>

            {/* Modal */}
            {modalType && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={closeModal}
                >
                    <div 
                        className="w-full max-w-md max-h-[80vh] glass-effect rounded-2xl border border-white/10 overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                {modalType === 'followers' ? 'Followers' : 'Following'}
                                <span className="text-white/60 text-sm font-normal">({total})</span>
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-cosmic-purple" />
                                </div>
                            ) : users.length === 0 ? (
                                <div className="text-center py-8 text-white/60">
                                    {modalType === 'followers' 
                                        ? 'No followers yet' 
                                        : 'Not following anyone yet'}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {users.map((user) => (
                                        <Link
                                            key={user.id}
                                            href={`/dashboard/profile/${user.id}`}
                                            onClick={closeModal}
                                            className="flex items-center gap-3 p-3 rounded-xl glass-inner hover:bg-white/10 transition-colors"
                                        >
                                            {/* User Avatar */}
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cosmic-purple to-cosmic-blue flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {user.profile_photo_url ? (
                                                    <img
                                                        src={user.profile_photo_url}
                                                        alt={user.display_name || 'User'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-bold">
                                                        {(user.display_name || 'U')[0].toUpperCase()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* User Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">
                                                    {user.display_name || 'Anonymous'}
                                                </p>
                                                {user.experience_level && (
                                                    <p className="text-xs text-white/60 truncate">
                                                        {user.experience_level}
                                                    </p>
                                                )}
                                            </div>

                                            {/* User Stats */}
                                            <div className="text-right text-xs text-white/60 flex-shrink-0">
                                                <p>{formatCount(user.follower_count)} followers</p>
                                            </div>
                                        </Link>
                                    ))}

                                    {/* Load More Button */}
                                    {hasMore && (
                                        <button
                                            onClick={loadMore}
                                            disabled={loadingMore}
                                            className="w-full py-3 mt-2 rounded-xl glass-inner hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {loadingMore ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Loading...
                                                </>
                                            ) : (
                                                'Load More'
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
