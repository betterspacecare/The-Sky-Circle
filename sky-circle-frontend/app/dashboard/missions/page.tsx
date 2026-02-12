'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Star, Target, CheckCircle2, Lock, ChevronRight, Loader2, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Mission {
    id: string
    title: string
    description: string
    reward_points: number
    start_date: string
    end_date: string
    requirements: any[]
    user_progress: {
        completed: boolean
        progress: number
    } | null
}

export default function MissionsPage() {
    const supabase = createClient()
    const [missions, setMissions] = useState<Mission[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchMissions()
    }, [])

    const fetchMissions = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            // Get missions and requirements
            const { data, error } = await supabase
                .from('missions')
                .select(`
                    *,
                    requirements:mission_requirements(*)
                `)

            if (error) throw error

            // Get user progress
            let progressData: any[] = []
            if (user) {
                const { data: upData } = await supabase
                    .from('user_mission_progress')
                    .select('*')
                    .eq('user_id', user.id)
                progressData = upData || []
            }

            const formattedMissions = data.map(m => {
                const up = progressData.find(p => p.mission_id === m.id)
                return {
                    ...m,
                    user_progress: up ? {
                        completed: up.completed,
                        progress: up.progress_count || 0
                    } : null
                }
            })

            setMissions(formattedMissions)
        } catch (error: any) {
            console.error('Error fetching missions:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const activeMissions = missions.filter(m => new Date(m.end_date) >= new Date())
    const completedMissions = missions.filter(m => m.user_progress?.completed)

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Seasonal Missions</h1>
                    <p className="text-gray-400">Complete objectives to earn massive rewards and exclusive badges</p>
                </div>
                <div className="bg-cosmic-purple/10 border border-cosmic-purple/20 px-6 py-3 rounded-2xl flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-cosmic-gold" />
                    <div>
                        <p className="text-[10px] uppercase font-bold text-cosmic-purple leading-none">Completed</p>
                        <p className="text-xl font-black">{completedMissions.length} Missions</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-6">
                    {[1, 2].map(i => (
                        <div key={i} className="glass-effect h-60 rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : activeMissions.length === 0 ? (
                <div className="text-center py-20 glass-effect rounded-3xl border-dashed">
                    <p className="text-gray-400">No active missions at the moment. New season starting soon!</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {activeMissions.map((mission) => (
                        <div key={mission.id} className="relative group">
                            {/* Mission Card */}
                            <div className={cn(
                                "relative z-10 glass-effect rounded-[2.5rem] overflow-hidden border border-white/10 transition-all duration-500 group-hover:border-cosmic-purple/30",
                                mission.user_progress?.completed && "border-green-500/30"
                            )}>
                                <div className="grid md:grid-cols-3 gap-0">
                                    {/* Left: Info */}
                                    <div className="md:col-span-2 p-8 md:p-12">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 border border-white/10">
                                                Active Season
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-cosmic-gold/10 rounded-full text-[10px] font-black uppercase tracking-widest text-cosmic-gold border border-cosmic-gold/20">
                                                <Star className="w-3 h-3 fill-cosmic-gold" />
                                                {mission.reward_points} PTS Reward
                                            </div>
                                        </div>

                                        <h2 className="text-3xl md:text-5xl font-black mb-6 group-hover:text-gradient transition-all duration-300">
                                            {mission.title}
                                        </h2>
                                        <p className="text-gray-400 text-lg mb-8 max-w-xl leading-relaxed">
                                            {mission.description}
                                        </p>

                                        <div className="flex flex-wrap gap-8 text-sm font-bold text-gray-500 uppercase tracking-widest">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-5 h-5 text-cosmic-purple" />
                                                Ends {new Date(mission.end_date).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Target className="w-5 h-5 text-cosmic-purple" />
                                                {mission.requirements.length} Objectives
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Progress */}
                                    <div className="bg-white/5 p-8 md:p-12 flex flex-col items-center justify-center text-center border-l border-white/5 relative">
                                        <div className="relative w-40 h-40 mb-8">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle
                                                    cx="80"
                                                    cy="80"
                                                    r="70"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="12"
                                                    className="text-white/5"
                                                />
                                                <circle
                                                    cx="80"
                                                    cy="80"
                                                    r="70"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="12"
                                                    strokeDasharray={440}
                                                    strokeDashoffset={440 - (440 * (mission.user_progress?.progress || 0)) / mission.requirements.length}
                                                    strokeLinecap="round"
                                                    className={cn(
                                                        "transition-all duration-1000 ease-out",
                                                        mission.user_progress?.completed ? "text-green-500" : "text-cosmic-purple"
                                                    )}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-4xl font-black">
                                                    {Math.round(((mission.user_progress?.progress || 0) / mission.requirements.length) * 100)}%
                                                </span>
                                                <span className="text-[10px] uppercase font-black text-gray-500">Progress</span>
                                            </div>
                                        </div>

                                        {mission.user_progress?.completed ? (
                                            <div className="flex items-center gap-2 text-green-400 font-black uppercase tracking-widest">
                                                <CheckCircle2 className="w-6 h-6" />
                                                Mission Expert
                                            </div>
                                        ) : (
                                            <p className="text-sm font-bold text-gray-400">
                                                {mission.user_progress?.progress || 0} of {mission.requirements.length} complete
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Objective Checklist (Expandable/Always Visible) */}
                            <div className="mt-8 px-8 md:px-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {mission.requirements.map((req, idx) => (
                                    <div
                                        key={req.id}
                                        className={cn(
                                            "glass-effect rounded-2xl p-6 flex items-center justify-between transition-all",
                                            idx < (mission.user_progress?.progress || 0)
                                                ? "bg-green-500/10 border-green-500/20"
                                                : "opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                                                idx < (mission.user_progress?.progress || 0)
                                                    ? "bg-green-500/20 text-green-400"
                                                    : "bg-white/5 text-gray-600"
                                            )}>
                                                {idx < (mission.user_progress?.progress || 0) ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{req.description || req.object_type}</p>
                                                <p className="text-[10px] text-gray-500 uppercase font-black">{req.object_type}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
