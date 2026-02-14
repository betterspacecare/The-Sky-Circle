'use client'

import { Interest } from '@/types/social.types'

/**
 * InterestsTags Component
 * Displays user's interests as read-only tags with category-based color coding
 * 
 * Validates: Requirement 5.6 - Display user's selected interests as tags
 */

interface InterestsTagsProps {
    interests: Interest[];
}

/**
 * Category-based color mapping for visual distinction
 * Categories from design: technique, target, event, content
 * Same colors as InterestsSelector for consistency
 */
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    technique: {
        bg: 'bg-purple-500/20',
        border: 'border-purple-500/40',
        text: 'text-purple-300',
    },
    target: {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/40',
        text: 'text-blue-300',
    },
    event: {
        bg: 'bg-amber-500/20',
        border: 'border-amber-500/40',
        text: 'text-amber-300',
    },
    content: {
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500/40',
        text: 'text-emerald-300',
    },
    default: {
        bg: 'bg-white/10',
        border: 'border-white/20',
        text: 'text-white/70',
    },
}

/**
 * Get color classes for an interest based on its category
 */
function getCategoryColors(category: string | null) {
    return CATEGORY_COLORS[category || 'default'] || CATEGORY_COLORS.default
}

export default function InterestsTags({ interests }: InterestsTagsProps) {
    // Handle empty state gracefully
    if (!interests || interests.length === 0) {
        return (
            <p className="text-sm text-white/40 italic">
                No interests selected
            </p>
        )
    }

    return (
        <div className="flex flex-wrap gap-3" role="list" aria-label="User interests">
            {interests.map((interest) => {
                const colors = getCategoryColors(interest.category)

                return (
                    <span
                        key={interest.id}
                        role="listitem"
                        className={`
                            inline-flex items-center px-4 py-1.5 rounded-full
                            text-sm font-medium border
                            ${colors.bg} ${colors.border} ${colors.text}
                        `}
                    >
                        {interest.display_name}
                    </span>
                )
            })}
        </div>
    )
}
