'use client'

import { getUserLevel } from '@/lib/utils/gamification'

interface ProgressCardProps {
    profile: any
}

export default function ProgressCard({ profile }: ProgressCardProps) {
    if (!profile) return null

    const levelInfo = getUserLevel(profile.total_points)

    return (
        <div className="glass-effect rounded-[2.5rem] p-10 relative overflow-hidden group">
            {/* Background Glow */}
            <div
                className="absolute inset-0 opacity-15 blur-[100px] pointer-events-none transition-opacity duration-500 group-hover:opacity-25"
                style={{ backgroundColor: levelInfo.color }}
            />

            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div className="text-center md:text-left">
                    <p className="text-[10px] uppercase font-black text-white/40 tracking-[0.2em] mb-2 font-mono">Current Ranking</p>
                    <h3 className="text-4xl md:text-5xl font-black tracking-tighter" style={{ color: levelInfo.color }}>
                        {levelInfo.name}
                    </h3>
                    <div className="flex items-center gap-3 justify-center md:justify-start mt-3">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60">Level {levelInfo.level}</span>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-sm font-bold text-white/60">{profile.total_points} Total Points</span>
                    </div>
                </div>

                {levelInfo.nextLevel && (
                    <div className="flex flex-col items-center md:items-end">
                        <p className="text-[10px] uppercase font-black text-white/40 tracking-[0.2em] mb-2 font-mono">Next Milestone</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-white">{levelInfo.pointsToNextLevel}</span>
                            <span className="text-white/40 font-bold">PTS TO GO</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Bar Container */}
            <div className="mt-12 relative z-10">
                <div className="relative w-full h-3 bg-white/5 rounded-full border border-white/5 overflow-hidden">
                    <div
                        className="absolute top-0 left-0 h-full rounded-full transition-all duration-[1.5s] ease-out"
                        style={{
                            width: `${levelInfo.progressPercentage}%`,
                            background: `linear-gradient(90deg, transparent, ${levelInfo.color})`
                        }}
                    >
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                        <div className="absolute top-0 right-0 w-8 h-full bg-white blur-sm opacity-50"></div>
                    </div>
                </div>

                <div className="flex justify-between mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: levelInfo.color }} />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{Math.round(levelInfo.progressPercentage)}% Journey Complete</span>
                    </div>
                    {levelInfo.nextLevel && (
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Next: {levelInfo.nextLevel.name}</span>
                    )}
                </div>
            </div>
        </div>
    )
}
