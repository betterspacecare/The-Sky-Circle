'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, MapPin, Eye, Search, Filter, Plus } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Observation {
    id: string
    object_name: string
    category: string
    observation_date: string
    location: string
    notes: string
    photo_url: string
    points_awarded: number
    created_at: string
}

export default function ObservationsHistoryPage() {
    const supabase = createClient()
    const [observations, setObservations] = useState<Observation[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')

    useEffect(() => {
        fetchObservations()
    }, [])

    const fetchObservations = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('observations')
                .select('*')
                .eq('user_id', user.id)
                .order('observation_date', { ascending: false })

            if (error) throw error
            setObservations(data || [])
        } catch (error: any) {
            console.error('Error fetching observations:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredObservations = observations.filter(obs => {
        const matchesSearch = obs.object_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            obs.location?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'All' || obs.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const categories = ['All', 'Moon', 'Planet', 'Nebula', 'Galaxy', 'Cluster', 'Constellation']

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Observation History</h1>
                    <p className="text-gray-400">Manage and revisit your cosmic discoveries</p>
                </div>
                <Link
                    href="/dashboard/observations/new"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-xl font-bold hover:scale-105 transition-all shadow-lg text-white"
                >
                    <Plus className="w-5 h-5" />
                    New Log
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                        type="text"
                        placeholder="Search observations..."
                        className="w-full pl-12 pr-4 py-4 glass-inner rounded-2xl focus:outline-none focus:ring-2 focus:ring-cosmic-purple/50 transition-all text-white placeholder:text-white/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "px-4 py-3 rounded-xl transition-all whitespace-nowrap",
                                selectedCategory === cat
                                    ? "glass-purple text-cosmic-purple"
                                    : "glass-inner text-white/40 hover:bg-white/[0.06]"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-effect rounded-2xl aspect-square animate-pulse" />
                    ))}
                </div>
            ) : filteredObservations.length === 0 ? (
                <div className="text-center py-20 glass-effect rounded-3xl border-dashed">
                    <Eye className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No observations found</h3>
                    <p className="text-white/40 mb-6">Start logging your discoveries to see them here.</p>
                    <Link
                        href="/dashboard/observations/new"
                        className="text-cosmic-purple font-bold hover:underline"
                    >
                        Log your first observation
                    </Link>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredObservations.map(obs => (
                        <div key={obs.id} className="group glass-effect rounded-2xl overflow-hidden hover:scale-[1.02] transition-all flex flex-col">
                            {/* Photo */}
                            <div className="aspect-video relative overflow-hidden glass-inner">
                                {obs.photo_url ? (
                                    <img
                                        src={obs.photo_url}
                                        alt={obs.object_name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/20">
                                        <Eye className="w-12 h-12" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 px-3 py-1 glass-effect rounded-full text-xs font-bold text-cosmic-purple">
                                    +{obs.points_awarded} pts
                                </div>
                                <div className="absolute bottom-4 left-4 px-3 py-1 glass-effect rounded-full text-xs font-bold text-white">
                                    {obs.category}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold mb-3">{obs.object_name}</h3>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(obs.observation_date).toLocaleDateString()}
                                    </div>
                                    {obs.location && (
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <MapPin className="w-4 h-4" />
                                            {obs.location}
                                        </div>
                                    )}
                                </div>

                                {obs.notes && (
                                    <p className="text-sm text-gray-400 line-clamp-2 mb-4 italic">
                                        "{obs.notes}"
                                    </p>
                                )}

                                <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
                                    <span>Logged on {new Date(obs.created_at).toLocaleDateString()}</span>
                                    <button className="text-cosmic-purple font-bold hover:underline">View Details</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
