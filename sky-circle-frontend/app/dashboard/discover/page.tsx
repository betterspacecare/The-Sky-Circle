'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Loader2, SearchX } from 'lucide-react'
import UserCard from '@/components/social/UserCard'
import SearchFilter, { SearchFilterValues } from '@/components/social/SearchFilter'
import { fetchUsers, searchUsers } from '@/lib/services/userDiscoveryService'
import { UserWithSocialData } from '@/types/social.types'

/**
 * Discover Users Page
 * Displays a paginated grid of users with search and filter capabilities
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

const PAGE_SIZE = 12

export default function DiscoverPage() {
    const supabase = createClient()
    
    // State
    const [users, setUsers] = useState<UserWithSocialData[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | undefined>()
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFilters] = useState<SearchFilterValues>({
        searchQuery: '',
        experienceLevel: '',
    })
    
    // Ref for infinite scroll observer
    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadMoreRef = useRef<HTMLDivElement | null>(null)

    // Get current user ID on mount
    useEffect(() => {
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUserId(user?.id)
        }
        getCurrentUser()
    }, [supabase])

    // Fetch users function
    const loadUsers = useCallback(async (pageNum: number, isLoadMore: boolean = false) => {
        if (isLoadMore) {
            setLoadingMore(true)
        } else {
            setLoading(true)
            setError(null)
        }

        try {
            let result
            
            // Use search if there's a search query, otherwise use fetchUsers with filters
            if (filters.searchQuery) {
                result = await searchUsers(
                    filters.searchQuery,
                    pageNum,
                    PAGE_SIZE,
                    currentUserId
                )
            } else {
                result = await fetchUsers(
                    pageNum,
                    PAGE_SIZE,
                    { experienceLevel: filters.experienceLevel || undefined },
                    currentUserId
                )
            }

            if (result.error) {
                setError(result.error)
                return
            }

            if (result.data) {
                if (isLoadMore) {
                    setUsers(prev => [...prev, ...result.data!.data])
                } else {
                    setUsers(result.data.data)
                }
                setHasMore(result.data.hasMore)
                setPage(pageNum)
            }
        } catch (err) {
            setError('Failed to load users')
            console.error('Error loading users:', err)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [filters, currentUserId])

    // Initial load and filter changes
    useEffect(() => {
        loadUsers(1, false)
    }, [filters, currentUserId])

    // Set up IntersectionObserver for infinite scroll (Requirement 2.1)
    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect()
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                const [entry] = entries
                if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
                    loadUsers(page + 1, true)
                }
            },
            { threshold: 0.1 }
        )

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current)
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [hasMore, loading, loadingMore, page, loadUsers])

    // Handle filter changes
    const handleFilterChange = useCallback((newFilters: SearchFilterValues) => {
        setFilters(newFilters)
        setPage(1)
        setUsers([])
    }, [])

    // Handle follow state change
    const handleFollowChange = useCallback((userId: string, isFollowing: boolean) => {
        setUsers(prev => prev.map(user => 
            user.id === userId 
                ? { 
                    ...user, 
                    is_following: isFollowing,
                    follower_count: isFollowing 
                        ? user.follower_count + 1 
                        : Math.max(0, user.follower_count - 1)
                }
                : user
        ))
    }, [])

    return (
        <div className="py-0">
            {/* Page Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl glass-effect flex items-center justify-center">
                        <Users className="w-5 h-5 text-cosmic-purple" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black">Discover</h1>
                </div>
                <p className="text-white/60 text-sm">
                    Find and connect with fellow astronomy enthusiasts
                </p>
            </div>

            {/* Search and Filter (Requirements 2.3, 2.4) */}
            <div className="mb-6">
                <SearchFilter 
                    onChange={handleFilterChange}
                    initialValues={filters}
                />
            </div>

            {/* Error State */}
            {error && (
                <div className="glass-effect rounded-2xl p-6 text-center mb-6 border border-red-500/20">
                    <p className="text-red-400">{error}</p>
                    <button
                        onClick={() => loadUsers(1, false)}
                        className="mt-3 px-4 py-2 bg-cosmic-purple/20 text-cosmic-purple rounded-lg text-sm font-medium hover:bg-cosmic-purple/30 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <Loader2 className="w-10 h-10 text-cosmic-purple animate-spin" />
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && users.length === 0 && (
                <div className="glass-effect rounded-2xl p-12 text-center">
                    <SearchX className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-2">No users found</h3>
                    <p className="text-white/60 text-sm">
                        {filters.searchQuery || filters.experienceLevel
                            ? 'Try adjusting your search or filters'
                            : 'Be the first to join the community!'}
                    </p>
                </div>
            )}

            {/* User Grid (Requirements 2.1, 2.2) */}
            {!loading && users.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user) => (
                        <UserCard
                            key={user.id}
                            user={user}
                            currentUserId={currentUserId}
                            onFollowChange={handleFollowChange}
                        />
                    ))}
                </div>
            )}

            {/* Infinite Scroll Trigger */}
            <div ref={loadMoreRef} className="h-10 mt-6">
                {loadingMore && (
                    <div className="flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-cosmic-purple animate-spin" />
                    </div>
                )}
            </div>

            {/* End of Results */}
            {!loading && !hasMore && users.length > 0 && (
                <div className="text-center py-6">
                    <p className="text-white/40 text-sm">You've reached the end</p>
                </div>
            )}
        </div>
    )
}
