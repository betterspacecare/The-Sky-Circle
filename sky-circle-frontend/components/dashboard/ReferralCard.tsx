'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'

interface ReferralCardProps {
    referralCode: string
}

export default function ReferralCard({ referralCode }: ReferralCardProps) {
    const [copied, setCopied] = useState(false)
    const [referralUrl, setReferralUrl] = useState('')

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setReferralUrl(`${window.location.origin}/signup?ref=${referralCode}`)
        }
    }, [referralCode])

    const handleCopy = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(referralCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleShare = () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            navigator.share({
                title: 'Join The Sky Circle',
                text: 'Join me on The Sky Circle - a community for astronomy enthusiasts!',
                url: referralUrl,
            }).catch(() => {
                // Silently fail or handle share cancel
            })
        }
    }

    // Safety check for navigator.share existence
    const canShare = typeof navigator !== 'undefined' && !!navigator.share

    return (
        <div className="glass-effect rounded-3xl p-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl glass-inner flex items-center justify-center transition-all group-hover:bg-white/10">
                    <Share2 className="w-6 h-6 text-white/60" />
                </div>
                <div>
                    <h3 className="font-black text-white leading-tight">Invite Friends</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-cosmic-purple/60">Earn 50 pts bounty</p>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block font-mono">Your Referral Code</label>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 px-4 py-3 glass-inner rounded-2xl font-black text-xl text-center text-white tracking-widest transition-all hover:bg-white/[0.06]">
                            {referralCode}
                        </div>
                        <button
                            onClick={handleCopy}
                            className="p-3 glass-purple hover:bg-cosmic-purple/30 text-cosmic-purple rounded-2xl transition-all group"
                            title="Copy code"
                        >
                            {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {referralUrl && canShare && (
                    <button
                        onClick={handleShare}
                        className="w-full py-3 glass-inner hover:bg-white/[0.06] rounded-2xl text-[10px] uppercase font-black tracking-widest text-white transition-all active:scale-95"
                    >
                        Blast Invite Link
                    </button>
                )}
            </div>
        </div>
    )
}
