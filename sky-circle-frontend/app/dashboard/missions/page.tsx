'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
    Trophy, Star, Target, CheckCircle2, Lock, Calendar, Sparkles, 
    Telescope, Moon, Globe2, Loader2, Gift, Clock, ChevronDown, ChevronUp,
    Rocket, Award, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MissionRequirement {
    id: string
    mission_id: string
    object_name: string
    category: string
}

interface Mission {
    id: string
    title: string
    description: string
    bonus_points: number
    start_date: string
    end_date: string
    is_active: boolean
    reward_badge_id: string | null
    requirements: MissionRequirement[]
    completed_requirements: string[]
    is_completed: boolean
    reward_badge?: {
        id: string
        name: string
        description: string
        icon_url: string | null
    }
}

interface UserStats {
    total_points: number
    level: number
}

const categoryIcons: Record<string, any> = {
    Moon: Moon,
    Planet: Globe2,
    Nebula: Sparkles,
    Galaxy: Rocket,
    Cluster: Star,
    Constellation: Telescope
}

export default function MissionsPage() {
    const supabase = createClient()
    const [missions, setMissions] = useState<Mission[]>([])
    const [loading, setLoading] = useState(true)
    const [userStats, setUserStats] = useState<UserStats | null>(null)
    const [expandedMission, setExpandedMission] = useState<string | null>(null)
    const [claimingReward, setClaimingReward] = useState<string | null>(null)
    const [userObservations, setUserObservations] = useState<{object_name: string, category: string}[]>([])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            // Fetch user stats
            const { data: userData } = await supabase
                .from('users')
                .select('total_points, level')
                .eq('id', user.id)
                .single()
            
            if (userData) setUserStats(userData)

            // Fetch user's observations for progress tracking
            const { data: obsData } = await supabase
                .from('observations')
                .select('object_name, category')
                .eq('user_id', user.id)
            
            setUserObservations(obsData || [])

            // Fetch missions with requirements and badges
            const { data: missionsData, error } = await supabase
                .from('missions')
                .select(`
                    *,
                    requirements:mission_requirements(*),
                    reward_badge:badges(id, name, description, icon_url)
                `)
                .eq('is_active', true)
                .order('end_date', { ascending: true })

            if (error) throw error

            // Fetch user's mission progress
            const { data: progressData } = await supabase
                .from('user_mission_progress')
                .select('*')
                .eq('user_id', user.id)

            // Format missions with progress
            const formattedMissions = (missionsData || []).map(mission => {
                const progress = progressData?.find(p => p.mission_id === mission.id)
                const completedReqs = progress?.completed_requirements || []
                
                return {
                    ...mission,
                    completed_requirements: completedReqs,
                    is_completed: progress?.is_completed || false
                }
            })

            setMissions(formattedMissions)

            // Auto-update progress based on observations
            for (const mission of formattedMissions) {
                if (!mission.is_completed) {
                    await updateMissionProgress(user.id, mission, obsData || [])
                }
            }

            // Refetch to get updated progress
            const { data: updatedProgress } = await supabase
                .from('user_mission_progress')
                .select('*')
                .eq('user_id', user.id)

            const updatedMissions = formattedMissions.map(mission => {
                const progress = updatedProgress?.find(p => p.mission_id === mission.id)
                return {
                    ...mission,
                    completed_requirements: progress?.completed_requirements || [],
                    is_completed: progress?.is_completed || false
                }
            })

            setMissions(updatedMissions)

        } catch (error: any) {
            console.error('Error fetching missions:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const updateMissionProgress = async (
        userId: string, 
        mission: Mission, 
        observations: {object_name: string, category: string}[]
    ) => {
        // Check which requirements are met by user's observations
        const completedReqs: string[] = []
        
        for (const req of mission.requirements) {
            const hasObservation = observations.some(
                obs => obs.object_name.toLowerCase() === req.object_name.toLowerCase() &&
                       obs.category === req.category
            )
            if (hasObservation) {
                completedReqs.push(req.id)
            }
        }

        // Check if there's existing progress
        const { data: existingProgress } = await supabase
            .from('user_mission_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('mission_id', mission.id)
            .single()

        const isCompleted = completedReqs.length === mission.requirements.length

        if (existingProgress) {
            // Update existing progress
            if (JSON.stringify(existingProgress.completed_requirements) !== JSON.stringify(completedReqs)) {
                await supabase
                    .from('user_mission_progress')
                    .update({
                        completed_requirements: completedReqs,
                        is_completed: isCompleted,
                        completed_at: isCompleted ? new Date().toISOString() : null
                    })
                    .eq('id', existingProgress.id)
            }
        } else if (completedReqs.length > 0) {
            // Create new progress record
            await supabase
                .from('user_mission_progress')
                .insert({
                    user_id: userId,
                    mission_id: mission.id,
                    completed_requirements: completedReqs,
                    is_completed: isCompleted,
                    completed_at: isCompleted ? new Date().toISOString() : null
                })
        }
    }

    const claimReward = async (mission: Mission) => {
        if (!mission.is_completed || claimingReward) return
        
        setClaimingReward(mission.id)
        
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not logged in')

            // Award bonus points
            if (mission.bonus_points > 0) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('total_points')
                    .eq('id', user.id)
                    .single()

                await supabase
                    .from('users')
                    .update({ 
                        total_points: (userData?.total_points || 0) + mission.bonus_points 
                    })
                    .eq('id', user.id)

                setUserStats(prev => prev ? {
                    ...prev,
                    total_points: prev.total_points + mission.bonus_points
                } : null)
            }

            // Award badge if exists
            if (mission.reward_badge_id) {
                const { error: badgeError } = await supabase
                    .from('user_badges')
                    .insert({
                        user_id: user.id,
                        badge_id: mission.reward_badge_id
                    })
                
                if (badgeError && !badgeError.message.includes('duplicate')) {
                    console.error('Badge error:', badgeError)
                }
            }

            alert(`🎉 Congratulations! You earned ${mission.bonus_points} points${mission.reward_badge ? ` and the "${mission.reward_badge.name}" badge` : ''}!`)
            
        } catch (error: any) {
            console.error('Error claiming reward:', error.message)
            alert('Failed to claim reward. Please try again.')
        } finally {
            setClaimingReward(null)
        }
    }

    const getDaysRemaining = (endDate: string) => {
        const end = new Date(endDate)
        const now = new Date()
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return diff
    }

    const getProgressPercentage = (mission: Mission) => {
        if (mission.requirements.length === 0) return 0
        return Math.round((mission.completed_requirements.length / mission.requirements.length) * 100)
    }

    const activeMissions = missions.filter(m => new Date(m.end_date) >= new Date() && !m.is_completed)
    const completedMissions = missions.filter(m => m.is_completed)
    const expiredMissions = missions.filter(m => new Date(m.end_date) < new Date() && !m.is_completed)

    return (
        <div className="py-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-10">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                        <Rocket className="w-7 h-7 sm:w-10 sm:h-10 text-cosmic-purple" />
                        Missions
                    </h1>
                    <p className="text-sm sm:text-base text-white/50">Complete objectives to earn points and exclusive badges</p>
                </div>
                <div className="flex gap-3 sm:gap-4">
                    <div className="glass-effect px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3">
                        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-cosmic-gold" />
                        <div>
                            <p className="text-[9px] sm:text-[10px] uppercase font-bold text-white/40">Completed</p>
                            <p className="text-lg sm:text-xl font-bold">{completedMissions.length}</p>
                        </div>
                    </div>
                    <div className="glass-effect px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3">
                        <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-cosmic-purple" />
                        <div>
                            <p className="text-[9px] sm:text-[10px] uppercase font-bold text-white/40">Total Points</p>
                            <p className="text-lg sm:text-xl font-bold">{userStats?.total_points || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4 sm:space-y-6">
                    {[1, 2].map(i => (
                        <div key={i} className="glass-effect h-48 sm:h-64 rounded-2xl sm:rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : missions.length === 0 ? (
                <div className="glass-effect rounded-2xl sm:rounded-3xl p-10 sm:p-16 text-center">
                    <Telescope className="w-12 h-12 sm:w-16 sm:h-16 text-cosmic-purple mx-auto mb-4 sm:mb-6 opacity-50" />
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">No Missions Available</h3>
                    <p className="text-sm sm:text-base text-white/50 max-w-md mx-auto">
                        New missions are coming soon! Check back later for exciting challenges.
                    </p>
                </div>
            ) : (
                <div className="space-y-6 sm:space-y-8">
                    {/* Active Missions */}
                    {activeMissions.length > 0 && (
                        <div>
                            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-white/70">
                                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-cosmic-purple" />
                                Active Missions ({activeMissions.length})
                            </h2>
                            <div className="space-y-4 sm:space-y-6">
                                {activeMissions.map(mission => (
                                    <MissionCard 
                                        key={mission.id}
                                        mission={mission}
                                        expanded={expandedMission === mission.id}
                                        onToggle={() => setExpandedMission(expandedMission === mission.id ? null : mission.id)}
                                        onClaim={() => claimReward(mission)}
                                        claiming={claimingReward === mission.id}
                                        daysRemaining={getDaysRemaining(mission.end_date)}
                                        progress={getProgressPercentage(mission)}
                                        userObservations={userObservations}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Completed Missions */}
                    {completedMissions.length > 0 && (
                        <div>
                            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-white/70">
                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                                Completed ({completedMissions.length})
                            </h2>
                            <div className="space-y-3 sm:space-y-4">
                                {completedMissions.map(mission => (
                                    <MissionCard 
                                        key={mission.id}
                                        mission={mission}
                                        expanded={expandedMission === mission.id}
                                        onToggle={() => setExpandedMission(expandedMission === mission.id ? null : mission.id)}
                                        onClaim={() => claimReward(mission)}
                                        claiming={claimingReward === mission.id}
                                        daysRemaining={getDaysRemaining(mission.end_date)}
                                        progress={100}
                                        userObservations={userObservations}
                                        completed
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Expired Missions */}
                    {expiredMissions.length > 0 && (
                        <div>
                            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-white/40">
                                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                                Expired ({expiredMissions.length})
                            </h2>
                            <div className="space-y-3 sm:space-y-4 opacity-50">
                                {expiredMissions.map(mission => (
                                    <MissionCard 
                                        key={mission.id}
                                        mission={mission}
                                        expanded={false}
                                        onToggle={() => {}}
                                        onClaim={() => {}}
                                        claiming={false}
                                        daysRemaining={0}
                                        progress={getProgressPercentage(mission)}
                                        userObservations={userObservations}
                                        expired
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Mission Card Component
function MissionCard({ 
    mission, 
    expanded, 
    onToggle, 
    onClaim,
    claiming,
    daysRemaining,
    progress,
    userObservations,
    completed = false,
    expired = false
}: {
    mission: Mission
    expanded: boolean
    onToggle: () => void
    onClaim: () => void
    claiming: boolean
    daysRemaining: number
    progress: number
    userObservations: {object_name: string, category: string}[]
    completed?: boolean
    expired?: boolean
}) {
    const isRequirementCompleted = (req: MissionRequirement) => {
        return mission.completed_requirements.includes(req.id)
    }

    return (
        <div className={cn(
            "glass-effect rounded-2xl sm:rounded-3xl overflow-hidden transition-all",
            completed && "border border-green-500/20",
            expired && "pointer-events-none"
        )}>
            {/* Main Content */}
            <div className="p-4 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6">
                    {/* Left: Info */}
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                            {completed ? (
                                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-500/20 text-green-400 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Completed
                                </span>
                            ) : expired ? (
                                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/10 text-white/40 rounded-full text-[10px] sm:text-xs font-bold">
                                    Expired
                                </span>
                            ) : (
                                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-cosmic-purple/20 text-cosmic-purple rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {daysRemaining} days left
                                </span>
                            )}
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-cosmic-gold/20 text-cosmic-gold rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {mission.bonus_points} pts
                            </span>
                            {mission.reward_badge && (
                                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-cosmic-pink/20 text-cosmic-pink rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1">
                                    <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Badge
                                </span>
                            )}
                        </div>

                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">{mission.title}</h3>
                        <p className="text-sm sm:text-base text-white/60 mb-3 sm:mb-4 max-w-xl">{mission.description}</p>

                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-white/40">
                            <span className="flex items-center gap-1">
                                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                {mission.requirements.length} objectives
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                Ends {new Date(mission.end_date).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {/* Right: Progress Circle */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-20 h-20 sm:w-28 sm:h-28 mb-2 sm:mb-3">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="50%" cy="50%" r="40%"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className="text-white/5"
                                />
                                <circle
                                    cx="50%" cy="50%" r="40%"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    strokeDasharray={251}
                                    strokeDashoffset={251 - (251 * progress) / 100}
                                    strokeLinecap="round"
                                    className={cn(
                                        "transition-all duration-1000",
                                        completed ? "text-green-500" : "text-cosmic-purple"
                                    )}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-lg sm:text-2xl font-bold">{progress}%</span>
                            </div>
                        </div>
                        <p className="text-[10px] sm:text-xs text-white/40">
                            {mission.completed_requirements.length}/{mission.requirements.length} complete
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/5">
                    {completed && (
                        <button
                            onClick={onClaim}
                            disabled={claiming}
                            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-cosmic-gold to-yellow-500 text-black rounded-xl text-sm sm:text-base font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {claiming ? (
                                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            ) : (
                                <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                            Claim Reward
                        </button>
                    )}
                    
                    {!expired && (
                        <button
                            onClick={onToggle}
                            className="px-3 sm:px-4 py-2 sm:py-3 glass-inner rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 hover:bg-white/10 transition-all"
                        >
                            {expanded ? 'Hide' : 'View'} Objectives
                            {expanded ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Expanded Requirements */}
            {expanded && (
                <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {mission.requirements.map((req) => {
                            const isCompleted = isRequirementCompleted(req)
                            const IconComponent = categoryIcons[req.category] || Target
                            
                            return (
                                <div
                                    key={req.id}
                                    className={cn(
                                        "glass-inner rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition-all",
                                        isCompleted 
                                            ? "bg-green-500/10 border border-green-500/20" 
                                            : "opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0",
                                        isCompleted 
                                            ? "bg-green-500/20 text-green-400" 
                                            : "bg-white/5 text-white/30"
                                    )}>
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                                        ) : (
                                            <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-sm sm:text-base font-medium truncate",
                                            isCompleted ? "text-green-400" : "text-white"
                                        )}>
                                            {req.object_name}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-white/40">{req.category}</p>
                                    </div>
                                    {isCompleted && (
                                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {!completed && (
                        <div className="mt-3 sm:mt-4 p-3 sm:p-4 glass-inner rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <p className="text-white/50 text-xs sm:text-sm">
                                💡 Log observations of these objects to complete the mission
                            </p>
                            <a 
                                href="/dashboard/observations/new"
                                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-cosmic-purple/20 hover:bg-cosmic-purple/30 text-cosmic-purple rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap"
                            >
                                Log Observation
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
