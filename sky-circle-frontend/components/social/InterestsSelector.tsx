'use client'

import { useState, useCallback } from 'react'
import { Interest } from '@/types/social.types'
import { Check } from 'lucide-react'

/**
 * InterestsSelector Component
 * Displays all available interests as selectable chips/tags with multi-select support
 * 
 * Validates: Requirements 5.1, 5.2
 */

interface InterestsSelectorProps {
    allInterests: Interest[];
    selectedInterestIds: string[];
    onSelectionChange: (selectedIds: string[]) => void;
    disabled?: boolean;
    editMode?: boolean;
}

/**
 * Category-based color mapping for visual distinction
 * Categories from design: technique, target, event, content
 */
const CATEGORY_COLORS: Record<string, { bg: string; border: string; selectedBg: string }> = {
    technique: {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        selectedBg: 'bg-purple-500/30',
    },
    target: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        selectedBg: 'bg-blue-500/30',
    },
    event: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        selectedBg: 'bg-amber-500/30',
    },
    content: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        selectedBg: 'bg-emerald-500/30',
    },
    default: {
        bg: 'bg-white/5',
        border: 'border-white/20',
        selectedBg: 'bg-white/20',
    },
}

/**
 * Get color classes for an interest based on its category
 */
function getCategoryColors(category: string | null) {
    return CATEGORY_COLORS[category || 'default'] || CATEGORY_COLORS.default
}

export default function InterestsSelector({
    allInterests,
    selectedInterestIds,
    onSelectionChange,
    disabled = false,
    editMode = true,
}: InterestsSelectorProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        new Set(selectedInterestIds)
    )

    /**
     * Toggle interest selection
     * Validates: Requirement 5.1 - Allow users to select multiple interests
     */
    const handleToggle = useCallback((interestId: string) => {
        if (disabled || !editMode) return

        setSelectedIds((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(interestId)) {
                newSet.delete(interestId)
            } else {
                newSet.add(interestId)
            }
            
            // Notify parent of selection change
            const newSelectedIds = Array.from(newSet)
            onSelectionChange(newSelectedIds)
            
            return newSet
        })
    }, [disabled, editMode, onSelectionChange])

    /**
     * Check if an interest is selected
     */
    const isSelected = useCallback((interestId: string) => {
        return selectedIds.has(interestId)
    }, [selectedIds])

    // Group interests by category for organized display
    const groupedInterests = allInterests.reduce((acc, interest) => {
        const category = interest.category || 'other'
        if (!acc[category]) {
            acc[category] = []
        }
        acc[category].push(interest)
        return acc
    }, {} as Record<string, Interest[]>)

    const categoryOrder = ['technique', 'target', 'event', 'content', 'other']
    const sortedCategories = categoryOrder.filter(cat => groupedInterests[cat])

    return (
        <div className="space-y-4">
            {sortedCategories.map((category) => (
                <div key={category} className="space-y-2">
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                        {category === 'other' ? 'Other' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {groupedInterests[category].map((interest) => {
                            const selected = isSelected(interest.id)
                            const colors = getCategoryColors(interest.category)
                            const isInteractive = editMode && !disabled

                            return (
                                <button
                                    key={interest.id}
                                    type="button"
                                    onClick={() => handleToggle(interest.id)}
                                    disabled={disabled || !editMode}
                                    className={`
                                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                                        text-sm font-medium border transition-all duration-200
                                        ${selected 
                                            ? `${colors.selectedBg} ${colors.border} text-white` 
                                            : `${colors.bg} ${colors.border} text-white/70`
                                        }
                                        ${isInteractive 
                                            ? 'cursor-pointer hover:scale-105 hover:border-white/40' 
                                            : 'cursor-default'
                                        }
                                        ${disabled ? 'opacity-50' : ''}
                                    `}
                                    aria-pressed={selected}
                                    aria-label={`${selected ? 'Deselect' : 'Select'} ${interest.display_name}`}
                                >
                                    {selected && (
                                        <Check className="w-3.5 h-3.5" />
                                    )}
                                    <span>{interest.display_name}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            ))}

            {allInterests.length === 0 && (
                <p className="text-sm text-white/40 text-center py-4">
                    No interests available
                </p>
            )}

            {/* Selection summary */}
            {editMode && selectedIds.size > 0 && (
                <div className="pt-2 border-t border-white/10">
                    <p className="text-xs text-white/50">
                        {selectedIds.size} interest{selectedIds.size !== 1 ? 's' : ''} selected
                    </p>
                </div>
            )}
        </div>
    )
}
