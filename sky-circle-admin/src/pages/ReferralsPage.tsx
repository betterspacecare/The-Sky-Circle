import { useEffect, useState } from 'react'
import { useAdminStore } from '../store/adminStore'
import { Search, Loader2, UserPlus, ArrowRight } from 'lucide-react'

export function ReferralsPage() {
    const { referrals, fetchReferrals, isLoading } = useAdminStore()
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchReferrals()
    }, [fetchReferrals])

    const filteredReferrals = referrals.filter(ref =>
        ref.referrer?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        ref.referrer?.email?.toLowerCase().includes(search.toLowerCase()) ||
        ref.referred_user?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        ref.referred_user?.email?.toLowerCase().includes(search.toLowerCase())
    )

    // Calculate stats
    const totalPoints = referrals.reduce((sum, ref) => sum + ref.reward_points, 0)
    const topReferrers = referrals.reduce((acc, ref) => {
        const id = ref.referrer_id
        if (!acc[id]) {
            acc[id] = { user: ref.referrer, count: 0, points: 0 }
        }
        acc[id].count++
        acc[id].points += ref.reward_points
        return acc
    }, {} as Record<string, { user: typeof referrals[0]['referrer']; count: number; points: number }>)

    const topReferrersList = Object.values(topReferrers)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                    <div className="text-3xl font-bold text-white">{referrals.length}</div>
                    <div className="text-slate-400 text-sm">Total Referrals</div>
                </div>
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                    <div className="text-3xl font-bold text-yellow-400">{totalPoints}</div>
                    <div className="text-slate-400 text-sm">Points Awarded</div>
                </div>
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                    <div className="text-3xl font-bold text-green-400">
                        {Object.keys(topReferrers).length}
                    </div>
                    <div className="text-slate-400 text-sm">Active Referrers</div>
                </div>
            </div>

            {/* Top Referrers */}
            {topReferrersList.length > 0 && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Top Referrers</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {topReferrersList.map((item, index) => (
                            <div key={item.user?.id || index} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="text-white font-medium truncate">
                                        {item.user?.display_name || 'Unknown'}
                                    </p>
                                    <p className="text-slate-400 text-sm">
                                        {item.count} referrals • {item.points} pts
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search referrals..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Referrals Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700/50">
                                <tr className="text-left text-slate-300 text-sm">
                                    <th className="px-4 py-3 font-medium">Referrer</th>
                                    <th className="px-4 py-3 font-medium"></th>
                                    <th className="px-4 py-3 font-medium">Referred User</th>
                                    <th className="px-4 py-3 font-medium">Points</th>
                                    <th className="px-4 py-3 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300">
                                {filteredReferrals.map((ref) => (
                                    <tr key={ref.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {ref.referrer?.profile_photo_url ? (
                                                    <img
                                                        src={ref.referrer.profile_photo_url}
                                                        alt=""
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm">
                                                        {ref.referrer?.display_name?.[0] || '?'}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-white">{ref.referrer?.display_name || 'Unknown'}</p>
                                                    <p className="text-slate-400 text-xs">{ref.referrer?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 text-indigo-400">
                                                <UserPlus className="w-4 h-4" />
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {ref.referred_user?.profile_photo_url ? (
                                                    <img
                                                        src={ref.referred_user.profile_photo_url}
                                                        alt=""
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">
                                                        {ref.referred_user?.display_name?.[0] || '?'}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-white">{ref.referred_user?.display_name || 'Unknown'}</p>
                                                    <p className="text-slate-400 text-xs">{ref.referred_user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-yellow-400 font-medium">+{ref.reward_points}</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400">
                                            {new Date(ref.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {!isLoading && filteredReferrals.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    No referrals found
                </div>
            )}
        </div>
    )
}
