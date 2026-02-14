'use client'

import { useState } from 'react'
import { UserPlus, UserCheck, Loader2 } from 'lucide-react'
import { followUser, unfollowUser } from '@/lib/services/followService'
import { toast } from '@/store/toastStore'

/**
 * FollowButton Component
 * Displays Follow/Following state with optimistic updates and toast notifications
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.7
 */

interface FollowButtonProps {
    targetUserId: string;
    currentUserId?: string;
    isFollowing: boolean;
    onFollowChange: (isFollowing: boolean) => void;
    size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
    sm: 'px-3 py-1.5 text-xs gap-1',
    md: 'px-4 py-2 text-sm gap-1.5',
    lg: 'px-5 py-2.5 text-base gap-2',
}

const ICON_SIZES = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
}

export default function FollowButton({
    targetUserId,
    currentUserId,
    isFollowing,
    onFollowChange,
    size = 'md',
}: FollowButtonProps) {
    const [loading, setLoading] = useState(false)
    const [optimisticFollowing, setOptimisticFollowing] = useState(isFollowing)

    // Prevent self-follow: hide button if viewing own profile (Requirement 3.3)
    if (currentUserId && currentUserId === targetUserId) {
        return null
    }

    const handleClick = async () => {
        if (loading || !currentUserId) return

        const previousState = optimisticFollowing
        const newState = !optimisticFollowing

        // Optimistic update
        setOptimisticFollowing(newState)
        setLoading(true)

        try {
            if (newState) {
                // Follow user (Requirement 3.1)
                const result = await followUser(currentUserId, targetUserId)
                if (result.error) {
                    // Rollback on error
                    setOptimisticFollowing(previousState)
                    // Show user-friendly error message
                    if (result.error.includes('profile')) {
                        toast.error(result.error)
                    } else {
                        toast.error('Failed to follow user. Please try again.')
                    }
                    console.error('Follow error:', result.error)
                    return
                }
                toast.success('You are now following this user!')
            } else {
                // Unfollow user (Requirement 3.2)
                const result = await unfollowUser(currentUserId, targetUserId)
                if (result.error) {
                    // Rollback on error
                    setOptimisticFollowing(previousState)
                    toast.error('Failed to unfollow user. Please try again.')
                    console.error('Unfollow error:', result.error)
                    return
                }
                toast.success('You have unfollowed this user.')
            }
            // Notify parent of successful change
            onFollowChange(newState)
        } catch (error) {
            // Rollback on unexpected error
            setOptimisticFollowing(previousState)
            toast.error('An unexpected error occurred. Please try again.')
            console.error('Follow action failed:', error)
        } finally {
            setLoading(false)
        }
    }

    const sizeClasses = SIZE_CLASSES[size]
    const iconSize = ICON_SIZES[size]

    // Following state styling (Requirement 3.7)
    if (optimisticFollowing) {
        return (
            <button
                onClick={handleClick}
                disabled={loading}
                className={`
                    inline-flex items-center justify-center font-medium rounded-xl
                    glass-inner border border-white/20
                    hover:bg-white/10 hover:border-white/30
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${sizeClasses}
                `}
                aria-label="Unfollow user"
            >
                {loading ? (
                    <Loader2 className={`${iconSize} animate-spin`} />
                ) : (
                    <UserCheck className={iconSize} />
                )}
                <span>Following</span>
            </button>
        )
    }

    // Not following state styling
    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`
                inline-flex items-center justify-center font-bold rounded-xl
                bg-gradient-to-r from-cosmic-purple to-cosmic-blue
                hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                ${sizeClasses}
            `}
            aria-label="Follow user"
        >
            {loading ? (
                <Loader2 className={`${iconSize} animate-spin`} />
            ) : (
                <UserPlus className={iconSize} />
            )}
            <span>Follow</span>
        </button>
    )
}
