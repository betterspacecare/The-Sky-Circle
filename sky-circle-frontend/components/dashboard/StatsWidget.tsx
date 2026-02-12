'use client'

import { Trophy, Star, Eye, Award } from 'lucide-react'
import { formatPoints } from '@/lib/utils/gamification'
import { cn } from '@/lib/utils'

interface StatsWidgetProps {
    title: string
    value: number
    icon: 'trophy' | 'star' | 'eye' | 'award'
    gradient: string
}

const icons = {
    trophy: Trophy,
    star: Star,
    eye: Eye,
    award: Award,
}

export default function StatsWidget({ title, value, icon, gradient }: StatsWidgetProps) {
    const Icon = icons[icon]

    // Map boring gradients to cosmic theme colors
    const cosmicGradiatedColor = title === 'Total Points' ? 'text-cosmic-purple' :
        title === 'Current Level' ? 'text-cosmic-gold' :
            title === 'Observations' ? 'text-cosmic-blue' : 'text-cosmic-pink';

    const cosmicBg = title === 'Total Points' ? 'bg-cosmic-purple/10' :
        title === 'Current Level' ? 'bg-cosmic-gold/10' :
            title === 'Observations' ? 'bg-cosmic-blue/10' : 'bg-cosmic-pink/10';

    return (
        <div className="glass-effect rounded-3xl p-6 hover:scale-[1.03] transition-all duration-300 group overflow-hidden relative">
            {/* Ambient glow */}
            <div className={`absolute -right-6 -top-6 w-28 h-28 blur-[60px] rounded-full opacity-30 transition-opacity duration-500 group-hover:opacity-50 bg-gradient-to-br ${gradient}`} />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className={`w-12 h-12 rounded-2xl ${cosmicBg} backdrop-blur-sm border border-white/5 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(192,132,252,0.2)]`}>
                    <Icon className={cn("w-6 h-6", cosmicGradiatedColor)} />
                </div>
                <div className="h-1 w-10 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full w-1/2 rounded-full bg-gradient-to-r ${gradient} opacity-60`} />
                </div>
            </div>

            <div className="relative z-10">
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1 font-mono">{title}</h3>
                <p className="text-3xl font-black tracking-tight text-white">
                    {title === 'Total Points' ? formatPoints(value) : value}
                </p>
            </div>
        </div>
    )
}
