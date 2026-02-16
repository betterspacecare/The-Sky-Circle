import { useEffect, useState } from 'react'
import { useAdminStore } from '../store/adminStore'
import { Search, Trash2, Loader2, Users, TrendingUp, ArrowRight } from 'lucide-react'

export function FollowsPage() {
    const { follows, fetchFollows, deleteFollow, isLoading } = useAdminStore()
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchFollows()
    }, [fetchFollows])

    const filteredFollows = follows.filter(follow => {
        const matchesSearch = 
            follow.follower?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
            follow.following?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
            follow.follower?.email?.toLowerCase().includes(search.toLowerCase()) ||
            follow.following?.email?.toLowerCase().includes(search.toLowerCase())
        return matchesSearch
    })

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to remove this follow relationship?')) {
            await deleteFollow(id)
        }
    }

    // Calculate stats
    const uniqueFollowers = new Set(follows.map(f => f.follower_id)).size
    const avgFollowsPerUser = follows.length > 0 ? (follows.length / uniqueFollowers).toFixed(1) : '0'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gradient">Follow Relationships</h2>
                    <p className="text-white/40 text-sm">Manage user connections and follows</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                    type="text"
                    placeholder="Search by follower or following user..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 glass-input rounded-xl text-white placeholder-white/30"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-3">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-white">{follows.length}</div>
                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Total Follows</div>
                </div>
                <div className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-3">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-blue-400">{uniqueFollowers}</div>
                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Active Followers</div>
                </div>
                <div className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-3">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-green-400">{avgFollowsPerUser}</div>
                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Avg Follows/User</div>
                </div>
            </div>

            {/* Follows Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-purple-500/10 border-b border-purple-500/20">
                                <tr className="text-left text-white/40 text-xs uppercase tracking-wider">
                                    <th className="px-4 py-4 font-semibold">Follower</th>
                                    <th className="px-4 py-4 font-semibold w-12"></th>
                                    <th className="px-4 py-4 font-semibold">Following</th>
                                    <th className="px-4 py-4 font-semibold">Since</th>
                                    <th className="px-4 py-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-white/80">
                                {filteredFollows.map((follow) => (
                                    <tr key={follow.id} className="border-t border-purple-500/10 hover:bg-purple-500/5 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                {follow.follower?.profile_photo_url ? (
                                                    <img
                                                        src={follow.follower.profile_photo_url}
                                                        alt=""
                                                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/30"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                                        {follow.follower?.display_name?.[0] || '?'}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium">{follow.follower?.display_name || 'Unknown'}</div>
                                                    <div className="text-xs text-white/40">{follow.follower?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <ArrowRight className="w-5 h-5 text-purple-400" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                {follow.following?.profile_photo_url ? (
                                                    <img
                                                        src={follow.following.profile_photo_url}
                                                        alt=""
                                                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-500/30"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                                                        {follow.following?.display_name?.[0] || '?'}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium">{follow.following?.display_name || 'Unknown'}</div>
                                                    <div className="text-xs text-white/40">{follow.following?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-white/40">
                                            {new Date(follow.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-4">
                                            <button
                                                onClick={() => handleDelete(follow.id)}
                                                className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && filteredFollows.length === 0 && (
                    <div className="text-center py-12 text-white/30">
                        No follow relationships found
                    </div>
                )}
            </div>
        </div>
    )
}
