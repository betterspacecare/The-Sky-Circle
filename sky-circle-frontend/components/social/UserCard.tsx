'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import { UserWithSocialData } from '@/types/social.types'
import FollowButton from './FollowButton'

/**
 * UserCard Component
 * Displays user information in a card format for user discovery
 * 
 * Validates: Requirements 2.2, 2.5
 */

interface UserCardProps {
    user: UserWithSocialData;
    currentUserId?: string;
    onFollowChange?: (userId: string, isFollowing: boolean) => void;
}

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

/**
 * Maps experience level to display badge styling
 */
function getExperienceBadgeStyle(level: string | null): string {
    switch (level?.toLowerCase()) {
        case 'beginner':
            return 'bg-green-500/20 text-green-300 border-green-500/30'
        case 'intermediate':
            return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        case 'advanced':
            return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        case 'expert':
            return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        default:
            return 'bg-white/10 text-white/60 border-white/20'
    }
}

export default function UserCard({
    user,
    currentUserId,
    onFollowChange,
}: UserCardProps) {
    const handleFollowChange = (isFollowing: boolean) => {
        onFollowChange?.(user.id, isFollowing)
    }

    // Check if this is the current user's own card
    const isOwnCard = currentUserId === user.id

    return (
        <div className="glass-effect rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-200 group">
            {/* Clickable card area - navigates to profile (Requirement 2.5) */}
            <Link
                href={`/dashboard/profile/${user.id}`}
                className="block p-4"
            >
                <div className="flex items-start gap-4">
                    {/* User Photo (Requirement 2.2) */}
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cosmic-purple to-cosmic-blue flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white/10 group-hover:ring-white/20 transition-all">
                        {user.profile_photo_url ? (
                            <img
                                src={user.profile_photo_url}
                                alt={user.display_name || 'User'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-xl font-bold">
                                {(user.display_name || 'U')[0].toUpperCase()}
                            </span>
                        )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                        {/* Display Name (Requirement 2.2) */}
                        <h3 className="font-semibold text-lg truncate group-hover:text-cosmic-purple transition-colors">
                            {user.display_name || 'Anonymous'}
                        </h3>

                        {/* Experience Level Badge (Requirement 2.2) */}
                        {user.experience_level && (
                            <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full border ${getExperienceBadgeStyle(user.experience_level)}`}>
                                {user.experience_level}
                            </span>
                        )}

                        {/* Follower Count (Requirement 2.2) */}
                        <div className="flex items-center gap-1.5 mt-2 text-sm text-white/60">
                            <Users className="w-4 h-4" />
                            <span>{formatCount(user.follower_count)} followers</span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Follow Button - outside the link to prevent navigation on click */}
            {!isOwnCard && currentUserId && (
                <div className="px-4 pb-4 pt-0">
                    <FollowButton
                        targetUserId={user.id}
                        currentUserId={currentUserId}
                        isFollowing={user.is_following ?? false}
                        onFollowChange={handleFollowChange}
                        size="sm"
                    />
                </div>
            )}
        </div>
    )
}
