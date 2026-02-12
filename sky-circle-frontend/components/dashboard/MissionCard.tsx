'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Target, CheckCircle2 } from 'lucide-react'

interface MissionCardProps {
    mission: any
    userId: string
}

export default function MissionCard({ mission, userId }: MissionCardProps) {
    const supabase = createClient()
    const [progress, setProgress] = useState<any>(null)
    const [completedObjects, setCompletedObjects] = useState<string[]>([])

    useEffect(() => {
        const fetchProgress = async () => {
            // Get user's observations
            const { data: observations } = await supabase
                .from('observations')
                .select('object_name')
                .eq('user_id', userId)

            if (observations) {
                const observedObjects = observations.map(o => o.object_name)
                const requiredObjects = mission.mission_requirements.map((r: any) => r.object_name)
                const completed = requiredObjects.filter((obj: string) => observedObjects.includes(obj))
                setCompletedObjects(completed)
            }
        }

        fetchProgress()
    }, [userId, mission])

    const totalRequirements = mission.mission_requirements.length
    const completedCount = completedObjects.length
    const progressPercentage = (completedCount / totalRequirements) * 100

    return (
        <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-start justify-between mb-6">
                <div className="pr-4">
                    <h3 className="text-xl font-black mb-2 text-white">{mission.title}</h3>
                    <p className="text-xs text-white/50 leading-relaxed">{mission.description}</p>
                </div>
                <div className="w-12 h-12 rounded-xl glass-inner flex items-center justify-center flex-shrink-0 transition-transform hover:scale-110">
                    <Target className="w-6 h-6 text-cosmic-purple/60" />
                </div>
            </div>

            {/* Progress */}
            <div className="mb-6">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                    <span className="text-white/40">Sync Progress</span>
                    <span className="text-white">{completedCount}/{totalRequirements}</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-cosmic-purple to-cosmic-pink transition-all duration-1000 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            {/* Requirements */}
            <div className="space-y-2.5">
                {mission.mission_requirements.map((req: any) => {
                    const isCompleted = completedObjects.includes(req.object_name)
                    return (
                        <div
                            key={req.id}
                            className={`flex items-center gap-3 text-xs font-bold leading-none ${isCompleted ? 'text-green-400' : 'text-white/30'
                                }`}
                        >
                            <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'text-green-400' : 'text-white/10'}`} />
                            <span>{req.object_name}</span>
                        </div>
                    )
                })}
            </div>

            {/* Reward */}
            <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-white/40 tracking-widest">Bonus Bounty</span>
                <span className="text-sm font-black text-cosmic-gold">{mission.bonus_points} PTS</span>
            </div>
        </div>
    )
}
