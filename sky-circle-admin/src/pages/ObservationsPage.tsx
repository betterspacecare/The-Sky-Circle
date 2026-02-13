import { useEffect, useState } from 'react'
import { useAdminStore } from '../store/adminStore'
import { Search, Loader2, ExternalLink } from 'lucide-react'

const CATEGORIES = ['All', 'Moon', 'Planet', 'Nebula', 'Galaxy', 'Cluster', 'Constellation']

export function ObservationsPage() {
    const { observations, fetchObservations, isLoading } = useAdminStore()
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')

    useEffect(() => {
        fetchObservations()
    }, [fetchObservations])

    const filteredObservations = observations.filter(obs => {
        const matchesSearch = obs.object_name.toLowerCase().includes(search.toLowerCase()) ||
            obs.user?.display_name?.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = category === 'All' || obs.category === category
        return matchesSearch && matchesCategory
    })

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search observations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* Observations Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredObservations.map((obs) => (
                        <div
                            key={obs.id}
                            className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
                        >
                            {obs.photo_url && (
                                <div className="aspect-video bg-slate-700 relative">
                                    <img
                                        src={obs.photo_url}
                                        alt={obs.object_name}
                                        className="w-full h-full object-cover"
                                    />
                                    <a
                                        href={obs.photo_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute top-2 right-2 p-1 bg-black/50 rounded text-white hover:bg-black/70 transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            )}
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-lg font-semibold text-white">{obs.object_name}</h3>
                                    <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs">
                                        {obs.category}
                                    </span>
                                </div>
                                <div className="space-y-1 text-sm text-slate-400">
                                    <p>By: {obs.user?.display_name || 'Unknown'}</p>
                                    <p>Date: {new Date(obs.observation_date).toLocaleDateString()}</p>
                                    {obs.location && <p>Location: {obs.location}</p>}
                                </div>
                                {obs.notes && (
                                    <p className="mt-2 text-sm text-slate-300 line-clamp-2">{obs.notes}</p>
                                )}
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-yellow-400 font-medium">+{obs.points_awarded} pts</span>
                                    {obs.is_seasonal_rare && (
                                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                                            Rare
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isLoading && filteredObservations.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    No observations found
                </div>
            )}
        </div>
    )
}
