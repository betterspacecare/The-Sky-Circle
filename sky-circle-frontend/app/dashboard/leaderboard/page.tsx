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
            <div className="text-center mb-8 sm:mb-12">
                <h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2">Cosmic Leaderboard</h1>
                <p className="text-sm sm:text-base text-gray-400">The most active observers in the galaxy</p>
            </div>

            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-8 sm:mb-12 items-end">
                {/* 2nd Place */}
                <div className="order-1 flex flex-col items-center">
                    <div className="relative mb-2 sm:mb-4">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full border-2 sm:border-4 border-slate-300 overflow-hidden bg-white/5">
                            {topThree[1]?.profile_photo_url ? (
                                <img src={topThree[1].profile_photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-8 h-8 sm:w-12 sm:h-12 m-4 sm:m-6 text-gray-400" />
                            )}
                        </div>
                        <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-900 font-bold text-xs sm:text-base">2</div>
                    </div>
                    <div className="text-center glass-effect p-3 sm:p-6 rounded-xl sm:rounded-2xl w-full border-b-2 sm:border-b-4 border-slate-300">
                        <h3 className="font-bold text-xs sm:text-base truncate">{topThree[1]?.display_name || '---'}</h3>
                        <p className="text-slate-400 text-[10px] sm:text-sm">Lvl {topThree[1]?.level || 0}</p>
                        <p className="text-sm sm:text-xl font-black mt-1 sm:mt-2 text-slate-300">{topThree[1]?.total_points || 0}</p>
                    </div>
                </div>

                {/* 1st Place */}
                <div className="order-2 flex flex-col items-center transform scale-105 sm:scale-110">
                    <div className="relative mb-3 sm:mb-6">
                        <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full border-2 sm:border-4 border-cosmic-gold overflow-hidden bg-white/5 shadow-[0_0_20px_rgba(251,191,36,0.3)] sm:shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                            {topThree[0]?.profile_photo_url ? (
                                <img src={topThree[0].profile_photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 sm:w-16 sm:h-16 m-5 sm:m-8 text-gray-400" />
                            )}
                        </div>
                        <div className="absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2">
                            <Trophy className="w-6 h-6 sm:w-10 sm:h-10 text-cosmic-gold animate-bounce" />
                        </div>
                        <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-cosmic-gold flex items-center justify-center text-slate-900 font-bold text-xs sm:text-base">1</div>
                    </div>
                    <div className="text-center glass-effect p-4 sm:p-8 rounded-xl sm:rounded-2xl w-full border-b-2 sm:border-b-4 border-cosmic-gold">
                        <h3 className="font-bold text-sm sm:text-xl truncate">{topThree[0]?.display_name || '---'}</h3>
                        <p className="text-cosmic-gold text-[10px] sm:text-sm">Lvl {topThree[0]?.level || 0}</p>
                        <p className="text-lg sm:text-3xl font-black mt-1 sm:mt-2 text-gradient">{topThree[0]?.total_points || 0}</p>
                    </div>
                </div>

                {/* 3rd Place */}
                <div className="order-3 flex flex-col items-center">
                    <div className="relative mb-2 sm:mb-4">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full border-2 sm:border-4 border-amber-600 overflow-hidden bg-white/5">
                            {topThree[2]?.profile_photo_url ? (
                                <img src={topThree[2].profile_photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-8 h-8 sm:w-12 sm:h-12 m-4 sm:m-6 text-gray-400" />
                            )}
                        </div>
                        <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-amber-600 flex items-center justify-center text-slate-900 font-bold text-xs sm:text-base">3</div>
                    </div>
                    <div className="text-center glass-effect p-3 sm:p-6 rounded-xl sm:rounded-2xl w-full border-b-2 sm:border-b-4 border-amber-600">
                        <h3 className="font-bold text-xs sm:text-base truncate">{topThree[2]?.display_name || '---'}</h3>
                        <p className="text-amber-500 text-[10px] sm:text-sm">Lvl {topThree[2]?.level || 0}</p>
                        <p className="text-sm sm:text-xl font-black mt-1 sm:mt-2 text-amber-600">{topThree[2]?.total_points || 0}</p>
                    </div>
                </div>
            </div>

            {/* My Rank Sticky (Mobile) */}
            {currentUser && currentUser.rank > 3 && (
                <div className="glass-effect rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 border-l-4 border-cosmic-purple">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="font-bold text-base sm:text-xl text-cosmic-purple w-6 sm:w-8">#{currentUser.rank}</div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 overflow-hidden">
                            {currentUser.profile_photo_url ? (
                                <img src={currentUser.profile_photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-4 h-4 sm:w-6 sm:h-6 m-2 text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm sm:text-base truncate">{currentUser.display_name} (You)</p>
                            <p className="text-[10px] sm:text-xs text-gray-400">{currentUser.total_points} pts • Level {currentUser.level}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main List */}
            <div className="glass-effect rounded-2xl sm:rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-[10px] sm:text-sm">
                                <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium">Rank</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium">Observer</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium hidden sm:table-cell">Level</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium hidden md:table-cell">Logs</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-right">Points</th>
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
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-bold text-gray-400 text-xs sm:text-base">#{user.rank}</td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-white/5 flex-shrink-0">
                                                {user.profile_photo_url ? (
                                                    <img src={user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-4 h-4 sm:w-6 sm:h-6 m-2 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <span className="font-bold text-xs sm:text-base group-hover:text-cosmic-purple transition-colors block truncate">
                                                    {user.display_name}
                                                </span>
                                                {currentUser?.id === user.id && <span className="text-[8px] sm:text-[10px] bg-cosmic-purple/20 text-cosmic-purple px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full uppercase">You</span>}
                                                <span className="sm:hidden text-[10px] text-gray-400 block">Lvl {user.level}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                                        <div className="flex items-center gap-2">
                                            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cosmic-purple fill-cosmic-purple" />
                                            <span className="text-sm">{user.level}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-400 text-xs sm:text-sm hidden md:table-cell">
                                        {user.observation_count} observations
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right font-black text-white text-xs sm:text-base">
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
