'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, Filter } from 'lucide-react'

/**
 * SearchFilter Component
 * Provides search and filter controls for user discovery
 * 
 * Validates: Requirements 2.3, 2.4
 */

export const EXPERIENCE_LEVELS = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' },
] as const

export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number]['value']

export interface SearchFilterValues {
    searchQuery: string;
    experienceLevel: ExperienceLevel | '';
}

interface SearchFilterProps {
    onChange: (values: SearchFilterValues) => void;
    initialValues?: Partial<SearchFilterValues>;
}

/**
 * Custom hook for debouncing a value
 */
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}

export default function SearchFilter({
    onChange,
    initialValues,
}: SearchFilterProps) {
    const [searchQuery, setSearchQuery] = useState(initialValues?.searchQuery ?? '')
    const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | ''>(
        initialValues?.experienceLevel ?? ''
    )

    // Debounce search input (300ms) - Requirement 2.3
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    // Notify parent when debounced search or experience level changes
    useEffect(() => {
        onChange({
            searchQuery: debouncedSearchQuery,
            experienceLevel,
        })
    }, [debouncedSearchQuery, experienceLevel, onChange])

    // Clear all filters
    const handleClearFilters = useCallback(() => {
        setSearchQuery('')
        setExperienceLevel('')
    }, [])

    // Check if any filters are active
    const hasActiveFilters = searchQuery !== '' || experienceLevel !== ''

    return (
        <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input - Requirement 2.3 */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-inner border border-white/10 
                        bg-transparent text-white placeholder-white/40
                        focus:outline-none focus:border-cosmic-purple/50 focus:ring-1 focus:ring-cosmic-purple/30
                        transition-all duration-200"
                    aria-label="Search users by name"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full 
                            hover:bg-white/10 transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="w-3.5 h-3.5 text-white/40" />
                    </button>
                )}
            </div>

            {/* Experience Level Filter - Requirement 2.4 */}
            <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel | '')}
                    className="w-full sm:w-48 pl-10 pr-8 py-2.5 rounded-xl glass-inner border border-white/10 
                        bg-transparent text-white appearance-none cursor-pointer
                        focus:outline-none focus:border-cosmic-purple/50 focus:ring-1 focus:ring-cosmic-purple/30
                        transition-all duration-200"
                    aria-label="Filter by experience level"
                >
                    <option value="" className="bg-gray-900">All Levels</option>
                    {EXPERIENCE_LEVELS.map((level) => (
                        <option key={level.value} value={level.value} className="bg-gray-900">
                            {level.label}
                        </option>
                    ))}
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
                <button
                    onClick={handleClearFilters}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                        glass-inner border border-white/10 text-white/70
                        hover:bg-white/10 hover:text-white hover:border-white/20
                        transition-all duration-200"
                    aria-label="Clear all filters"
                >
                    <X className="w-4 h-4" />
                    <span className="text-sm font-medium">Clear</span>
                </button>
            )}
        </div>
    )
}
