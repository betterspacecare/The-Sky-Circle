'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
    Users, Plus, Search, Loader2, Calendar, MapPin, 
    ChevronRight, Shield, Lock, Globe, Star, UserPlus
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Group {
    id: string
    name: string
    description: string | null
    cover_image_url: string | null
    is_public: boolean
    is_approved: boolean
    member_count: number
    created_by: string
    created_at: string
    is_member?: boolean
    user_role?: string
}

export default function GroupsPage() {
    const supabase = createClient()
    const [groups, setGroups] = useState<Group[]>([])
    const [myGroups, setMyGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [userId, setUserId] = useState<string | null>(null)
    const [isEventCreator, setIsEventCreator] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [creating, setCreating] = useState(false)
    const [newGroup, setNewGroup] = useState({ name: '', description: '', is_public: true })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            setUserId(user?.id || null)

            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('is_event_creator')
                    .eq('id', user.id)
                    .single()
                setIsEventCreator(profile?.is_event_creator || false)
            }

            // Fetch all approved groups (both public and private)
            const { data: allApprovedGroups } = await supabase
                .from('groups')
                .select('*')
                .eq('is_approved', true)
                .order('member_count', { ascending: false })

            // Fetch user's group memberships
            let userMemberships: any[] = []
            if (user) {
                const { data: memberships } = await supabase
                    .from('group_members')
                    .select('group_id, role, groups(*)')
                    .eq('user_id', user.id)

                userMemberships = memberships || []
            }

            const memberGroupIds = userMemberships.map(m => m.group_id)
            
            // Mark groups user is member of
            const allGroups = (allApprovedGroups || []).map(g => ({
                ...g,
                is_member: memberGroupIds.includes(g.id),
                user_role: userMemberships.find(m => m.group_id === g.id)?.role
            }))

            setGroups(allGroups.filter(g => !g.is_member))
            setMyGroups(allGroups.filter(g => g.is_member))

        } catch (error) {
            console.error('Error fetching groups:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleJoinGroup = async (groupId: string) => {
        if (!userId) return

        try {
            await supabase
                .from('group_members')
                .insert({ group_id: groupId, user_id: userId })
            fetchData()
        } catch (error: any) {
            alert('Failed to join group: ' + error.message)
        }
    }

    const handleLeaveGroup = async (groupId: string) => {
        if (!userId) return
        if (!confirm('Are you sure you want to leave this group?')) return

        try {
            await supabase
                .from('group_members')
                .delete()
                .eq('group_id', groupId)
                .eq('user_id', userId)
            fetchData()
        } catch (error: any) {
            alert('Failed to leave group: ' + error.message)
        }
    }

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userId || !isEventCreator) return

        setCreating(true)
        try {
            const { error } = await supabase
                .from('groups')
                .insert({
                    name: newGroup.name,
                    description: newGroup.description || null,
                    is_public: newGroup.is_public,
                    created_by: userId,
                    is_approved: false // Needs admin approval
                })

            if (error) throw error

            setShowCreateModal(false)
            setNewGroup({ name: '', description: '', is_public: true })
            alert('Group created! It will be visible after admin approval.')
            fetchData()
        } catch (error: any) {
            alert('Failed to create group: ' + error.message)
        } finally {
            setCreating(false)
        }
    }

    const filteredGroups = groups.filter(g => 
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="py-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-black mb-1 sm:mb-2 text-gradient tracking-tighter">Guilds</h1>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">
                        Join astronomy communities near you
                    </p>
                </div>
                {isEventCreator && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-xl text-sm sm:text-base font-bold hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        Create Guild
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="relative mb-6 sm:mb-8">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/30" />
                <input
                    type="text"
                    placeholder="Search guilds..."
                    className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 glass-input rounded-xl text-sm sm:text-base text-white placeholder:text-white/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48 sm:h-64">
                    <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-cosmic-purple animate-spin" />
                </div>
            ) : (
                <>
                    {/* My Groups */}
                    {myGroups.length > 0 && (
                        <div className="mb-8 sm:mb-12">
                            <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-cosmic-gold" />
                                My Guilds
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {myGroups.map(group => (
                                    <GroupCard 
                                        key={group.id} 
                                        group={group} 
                                        onLeave={() => handleLeaveGroup(group.id)}
                                        isMember
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Discover Groups */}
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                            <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-cosmic-blue" />
                            Discover Guilds
                        </h2>
                        {filteredGroups.length === 0 ? (
                            <div className="text-center py-12 sm:py-16 glass-effect rounded-2xl sm:rounded-3xl">
                                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-white/20 mx-auto mb-3 sm:mb-4" />
                                <p className="text-sm sm:text-base text-white/40 font-medium">
                                    {searchQuery ? 'No guilds match your search' : 'No guilds available yet'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {filteredGroups.map(group => (
                                    <GroupCard 
                                        key={group.id} 
                                        group={group} 
                                        onJoin={() => handleJoinGroup(group.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Become a Creator CTA */}
                    {!isEventCreator && (
                        <div className="mt-8 sm:mt-12 glass-effect rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center">
                            <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-cosmic-purple mx-auto mb-3 sm:mb-4" />
                            <h3 className="text-lg sm:text-xl font-bold mb-2">Want to create your own guild?</h3>
                            <p className="text-sm sm:text-base text-white/50 mb-4 max-w-md mx-auto">
                                Approved members can create guilds and organize free events for the community.
                            </p>
                            <Link
                                href="/dashboard/profile"
                                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-cosmic-purple/20 text-cosmic-purple rounded-xl text-sm sm:text-base font-bold hover:bg-cosmic-purple/30 transition-all"
                            >
                                Apply to become a Guild Leader
                                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Link>
                        </div>
                    )}
                </>
            )}

            {/* Create Group Modal */}
            {showCreateModal && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                    onClick={() => setShowCreateModal(false)}
                >
                    <div 
                        className="glass-effect rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-md"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Create New Guild</h3>
                        <form onSubmit={handleCreateGroup} className="space-y-3 sm:space-y-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-white/60 mb-1.5 sm:mb-2">Guild Name</label>
                                <input
                                    type="text"
                                    value={newGroup.name}
                                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 glass-input rounded-xl text-sm sm:text-base"
                                    placeholder="e.g., Mumbai Stargazers"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-white/60 mb-1.5 sm:mb-2">Description</label>
                                <textarea
                                    value={newGroup.description}
                                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 glass-input rounded-xl resize-none text-sm sm:text-base"
                                    rows={3}
                                    placeholder="What's your guild about?"
                                />
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <input
                                    type="checkbox"
                                    id="is_public"
                                    checked={newGroup.is_public}
                                    onChange={(e) => setNewGroup({ ...newGroup, is_public: e.target.checked })}
                                    className="w-4 h-4 sm:w-5 sm:h-5 rounded"
                                />
                                <label htmlFor="is_public" className="text-xs sm:text-sm text-white/60">
                                    Public guild (anyone can join)
                                </label>
                            </div>
                            <p className="text-[10px] sm:text-xs text-white/40">
                                Your guild will be reviewed by admins before it becomes visible.
                            </p>
                            <div className="flex gap-3 pt-3 sm:pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-2.5 sm:py-3 glass-inner rounded-xl text-sm sm:text-base font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-xl text-sm sm:text-base font-bold disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create Guild'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

function GroupCard({ 
    group, 
    onJoin, 
    onLeave,
    isMember = false 
}: { 
    group: Group
    onJoin?: () => void
    onLeave?: () => void
    isMember?: boolean
}) {
    const isLocked = !group.is_public && !isMember

    return (
        <Link
            href={isLocked ? '#' : `/dashboard/groups/${group.id}`}
            onClick={(e) => {
                if (isLocked) {
                    e.preventDefault()
                }
            }}
            className={cn(
                "group glass-effect rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300",
                isLocked ? "opacity-75 cursor-not-allowed" : "hover:scale-[1.02]"
            )}
        >
            <div className="h-24 sm:h-32 bg-gradient-to-br from-cosmic-purple/30 to-cosmic-blue/30 relative">
                {group.cover_image_url && (
                    <img 
                        src={group.cover_image_url} 
                        alt="" 
                        className={cn("w-full h-full object-cover", isLocked && "blur-[2px]")}
                    />
                )}
                {/* Locked overlay */}
                {isLocked && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="p-3 rounded-full bg-black/50 backdrop-blur-sm">
                            <Lock className="w-6 h-6 text-white/70" />
                        </div>
                    </div>
                )}
                <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                    {group.is_public ? (
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-500/20 text-green-400 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            Public
                        </span>
                    ) : (
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-amber-500/20 text-amber-400 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            Private
                        </span>
                    )}
                </div>
            </div>
            <div className="p-4 sm:p-5">
                <h3 className={cn(
                    "text-base sm:text-lg font-bold mb-1.5 sm:mb-2 transition-colors",
                    !isLocked && "group-hover:text-cosmic-purple"
                )}>
                    {group.name}
                </h3>
                {group.description && (
                    <p className="text-xs sm:text-sm text-white/40 line-clamp-2 mb-3 sm:mb-4">
                        {isLocked ? 'This is a private guild. Request to join to see more.' : group.description}
                    </p>
                )}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-white/50">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>{group.member_count} members</span>
                    </div>
                    {isMember ? (
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                onLeave?.()
                            }}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 glass-inner rounded-lg text-xs sm:text-sm font-medium hover:bg-red-500/10 hover:text-red-400 transition-all"
                        >
                            Leave
                        </button>
                    ) : isLocked ? (
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                alert('This is a private guild. Contact the guild leader to request access.')
                            }}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500/20 text-amber-400 rounded-lg text-xs sm:text-sm font-bold hover:bg-amber-500/30 transition-all flex items-center gap-1"
                        >
                            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Request
                        </button>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                onJoin?.()
                            }}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-cosmic-purple/20 text-cosmic-purple rounded-lg text-xs sm:text-sm font-bold hover:bg-cosmic-purple/30 transition-all flex items-center gap-1"
                        >
                            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Join
                        </button>
                    )}
                </div>
            </div>
        </Link>
    )
}
