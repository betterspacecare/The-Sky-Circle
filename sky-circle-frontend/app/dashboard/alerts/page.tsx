'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Info, ShieldAlert, Star, Calendar, ArrowRight, Loader2, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Alert {
    id: string
    title: string
    message: string
    alert_type: 'text' | 'object_visibility' | 'meteor_shower' | 'special_event'
    created_at: string
}

export default function AlertsPage() {
    const supabase = createClient()
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAlerts()
    }, [])

    const fetchAlerts = async () => {
        try {
            const { data, error } = await supabase
                .from('sky_alerts')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setAlerts(data || [])
        } catch (error: any) {
            console.error('Error fetching alerts:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const getIcon = (type: Alert['alert_type']) => {
        switch (type) {
            case 'object_visibility': return <Eye className="w-5 h-5 text-cosmic-purple" />
            case 'meteor_shower': return <Star className="w-5 h-5 text-cosmic-gold" />
            case 'special_event': return <Calendar className="w-5 h-5 text-cosmic-blue" />
            default: return <Info className="w-5 h-5 text-gray-400" />
        }
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-12">
                <div className="w-16 h-16 rounded-[1.5rem] bg-cosmic-purple/20 flex items-center justify-center text-cosmic-purple">
                    <Bell className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-4xl font-black">Sky Alerts</h1>
                    <p className="text-gray-400">Important celestial events and community updates</p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-effect h-32 rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : alerts.length === 0 ? (
                <div className="text-center py-20 glass-effect rounded-3xl">
                    <ShieldAlert className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Clear Skies!</h3>
                    <p className="text-white/40">No active alerts at the moment. Check back later.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {alerts.map((alert) => (
                        <div key={alert.id} className="group glass-effect rounded-[2rem] p-8 hover:scale-[1.01] transition-all cursor-pointer">
                            <div className="flex items-start gap-6">
                                <div className="w-14 h-14 rounded-2xl glass-inner flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    {getIcon(alert.alert_type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold">{alert.title}</h3>
                                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                            {new Date(alert.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 leading-relaxed mb-6">
                                        {alert.message}
                                    </p>
                                    <div className="flex items-center gap-2 text-cosmic-purple font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                                        Learn More <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
