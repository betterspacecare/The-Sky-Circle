'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Star, Medal, ArrowUp, ArrowDown, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardUser {
    id: string
    display_name: string
    profile_photo_url: string
    level: number
    total_points: number
    observation_count: number
    rank: number
}

export default function LeaderboardPage() {
    const supabase = createClient()
    const [users, setUsers] = useState<LeaderboardUser[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null)

    useEffect(() => {
        fetchLeaderboard()
    }, [])

    const fetchLeaderboard = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser()

            const { data, error } = await supabase
                .from('leaderboard')
                .select('*')
                .limit(50)

            if (error) throw error
            setUsers(data || [])

            if (authUser) {
                const current = data?.find(u => u.id === authUser.id)
                if (current) setCurrentUser(current)
            }
        } catch (error: any) {
            console.error('Error fetching leaderboard:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const topThree = users.slice(0, 3)
    const remainingUsers = users.slice(3)

    return (
        <div className="py-0">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-2">Cosmic Leaderboard</h1>
                <p className="text-gray-400">The most active observers in the galaxy</p>
            </div>

            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
                {/* 2nd Place */}
                <div className="order-2 md:order-1 flex flex-col items-center">
                    <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full border-4 border-slate-300 overflow-hidden bg-white/5">
                            {topThree[1]?.profile_photo_url ? (
                                <img src={topThree[1].profile_photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-12 h-12 m-6 text-gray-400" />
                            )}
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-900 font-bold">2</div>
                    </div>
                    <div className="text-center glass-effect p-6 rounded-2xl w-full border-b-4 border-slate-300">
                        <h3 className="font-bold truncate">{topThree[1]?.display_name || '---'}</h3>
                        <p className="text-slate-400 text-sm">Level {topThree[1]?.level || 0}</p>
                        <p className="text-xl font-black mt-2 text-slate-300">{topThree[1]?.total_points || 0} pts</p>
                    </div>
                </div>

                {/* 1st Place */}
                <div className="order-1 md:order-2 flex flex-col items-center transform md:scale-110">
                    <div className="relative mb-6">
                        <div className="w-32 h-32 rounded-full border-4 border-cosmic-gold overflow-hidden bg-white/5 shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                            {topThree[0]?.profile_photo_url ? (
                                <img src={topThree[0].profile_photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-16 h-16 m-8 text-gray-400" />
                            )}
                        </div>
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                            <Trophy className="w-10 h-10 text-cosmic-gold animate-bounce" />
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-cosmic-gold flex items-center justify-center text-slate-900 font-bold">1</div>
                    </div>
                    <div className="text-center glass-effect p-8 rounded-2xl w-full border-b-4 border-cosmic-gold">
                        <h3 className="font-bold text-xl truncate">{topThree[0]?.display_name || '---'}</h3>
                        <p className="text-cosmic-gold text-sm">Level {topThree[0]?.level || 0}</p>
                        <p className="text-3xl font-black mt-2 text-gradient">{topThree[0]?.total_points || 0} pts</p>
                    </div>
                </div>

                {/* 3rd Place */}
                <div className="order-3 flex flex-col items-center">
                    <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full border-4 border-amber-600 overflow-hidden bg-white/5">
                            {topThree[2]?.profile_photo_url ? (
                                <img src={topThree[2].profile_photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-12 h-12 m-6 text-gray-400" />
                            )}
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-slate-900 font-bold">3</div>
                    </div>
                    <div className="text-center glass-effect p-6 rounded-2xl w-full border-b-4 border-amber-600">
                        <h3 className="font-bold truncate">{topThree[2]?.display_name || '---'}</h3>
                        <p className="text-amber-500 text-sm">Level {topThree[2]?.level || 0}</p>
                        <p className="text-xl font-black mt-2 text-amber-600">{topThree[2]?.total_points || 0} pts</p>
                    </div>
                </div>
            </div>

            {/* My Rank Sticky (Mobile) */}
            {currentUser && currentUser.rank > 3 && (
                <div className="md:hidden glass-effect rounded-2xl p-4 mb-6 border-l-4 border-cosmic-purple">
                    <div className="flex items-center gap-4">
                        <div className="font-bold text-xl text-cosmic-purple w-8">#{currentUser.rank}</div>
                        <div className="w-10 h-10 rounded-full bg-white/5 overflow-hidden">
                            {currentUser.profile_photo_url ? (
                                <img src={currentUser.profile_photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-6 h-6 m-2 text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold">{currentUser.display_name} (You)</p>
                            <p className="text-xs text-gray-400">{currentUser.total_points} pts • Level {currentUser.level}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main List */}
            <div className="glass-effect rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-sm">
                                <th className="px-6 py-4 font-medium">Rank</th>
                                <th className="px-6 py-4 font-medium">Observer</th>
                                <th className="px-6 py-4 font-medium">Level</th>
                                <th className="px-6 py-4 font-medium">Logs</th>
                                <th className="px-6 py-4 font-medium text-right">Points</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {remainingUsers.map((user) => (
                                <tr
                                    key={user.id}
                                    className={cn(
                                        "hover:bg-white/5 transition-colors group",
                                        currentUser?.id === user.id && "bg-cosmic-purple/10"
                                    )}
                                >
                                    <td className="px-6 py-4 font-bold text-gray-400">#{user.rank}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 flex-shrink-0">
                                                {user.profile_photo_url ? (
                                                    <img src={user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-6 h-6 m-2 text-gray-400" />
                                                )}
                                            </div>
                                            <span className="font-bold group-hover:text-cosmic-purple transition-colors">
                                                {user.display_name}
                                                {currentUser?.id === user.id && <span className="ml-2 text-[10px] bg-cosmic-purple/20 text-cosmic-purple px-2 py-1 rounded-full uppercase">You</span>}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Star className="w-4 h-4 text-cosmic-purple fill-cosmic-purple" />
                                            <span>{user.level}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">
                                        {user.observation_count} observations
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-white">
                                        {user.total_points.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
