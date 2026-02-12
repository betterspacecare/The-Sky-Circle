'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lock } from 'lucide-react'

interface BadgeShowcaseProps {
    userId: string
    earnedBadges: any[]
}

export default function BadgeShowcase({ userId, earnedBadges }: BadgeShowcaseProps) {
    const supabase = createClient()
    const [allBadges, setAllBadges] = useState<any[]>([])

    useEffect(() => {
        const fetchBadges = async () => {
            const { data } = await supabase
                .from('badges')
                .select('*')
                .order('created_at', { ascending: true })

            if (data) setAllBadges(data)
        }

        fetchBadges()
    }, [])

    const earnedBadgeIds = new Set(earnedBadges.map(eb => eb.badge_id))

    return (
        <div className="glass-effect rounded-[2.5rem] p-10">
            <h2 className="text-3xl font-black mb-10 tracking-tighter text-white">Badge Collection</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {allBadges.map((badge) => {
                    const isEarned = earnedBadgeIds.has(badge.id)

                    return (
                        <div
                            key={badge.id}
                            className={`relative group p-8 rounded-3xl transition-all duration-500 ${isEarned
                                ? 'glass-purple hover:scale-105'
                                : 'glass-inner opacity-40 hover:opacity-100'
                                }`}
                        >
                            <div className="flex flex-col items-center text-center">
                                {isEarned ? (
                                    <div className="w-16 h-16 mb-4 text-5xl drop-shadow-[0_0_8px_rgba(192,132,252,0.3)]">✨</div>
                                ) : (
                                    <div className="w-16 h-16 mb-4 flex items-center justify-center bg-white/5 rounded-2xl">
                                        <Lock className="w-6 h-6 text-white/20" />
                                    </div>
                                )}
                                <h3 className="font-black text-xs uppercase tracking-[0.15em] mb-2 text-white">{badge.name}</h3>
                                <p className="text-[10px] text-white/40 leading-relaxed font-bold">{badge.description}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {earnedBadges.length === 0 && (
                <p className="text-center text-white/40 mt-12 font-bold uppercase tracking-widest text-[10px]">
                    Your journey is just beginning. Start observing to earn badges. 🌟
                </p>
            )}
        </div>
    )
}
