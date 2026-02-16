import { useEffect, useState } from 'react'
import { useAdminStore } from '../store/adminStore'
import { Search, Trash2, Loader2, Package, Filter } from 'lucide-react'
import type { GearType } from '../types/database.types'

const gearTypeColors: Record<GearType, string> = {
    telescope: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    camera: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    mount: 'bg-green-500/20 text-green-300 border-green-500/30',
    eyepiece: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    filter: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    accessory: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
}

export function GearsPage() {
    const { gears, fetchGears, deleteGear, isLoading } = useAdminStore()
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('all')

    useEffect(() => {
        fetchGears()
    }, [fetchGears])

    const filteredGears = gears.filter(gear => {
        const matchesSearch = 
            gear.name.toLowerCase().includes(search.toLowerCase()) ||
            gear.brand?.toLowerCase().includes(search.toLowerCase()) ||
            gear.model?.toLowerCase().includes(search.toLowerCase()) ||
            gear.user?.display_name?.toLowerCase().includes(search.toLowerCase())
        const matchesType = typeFilter === 'all' || gear.gear_type === typeFilter
        return matchesSearch && matchesType
    })

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this gear? This action cannot be undone.')) {
            await deleteGear(id)
        }
    }

    const gearTypeStats = gears.reduce((acc, gear) => {
        acc[gear.gear_type] = (acc[gear.gear_type] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gradient">User Equipment</h2>
                    <p className="text-white/40 text-sm">Manage astronomy gear and equipment</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                        type="text"
                        placeholder="Search by gear name, brand, model, or user..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 glass-input rounded-xl text-white placeholder-white/30"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-3 glass-input rounded-xl text-white"
                >
                    <option value="all" className="bg-[#0a0a1a]">All Types</option>
                    <option value="telescope" className="bg-[#0a0a1a]">Telescopes</option>
                    <option value="camera" className="bg-[#0a0a1a]">Cameras</option>
                    <option value="mount" className="bg-[#0a0a1a]">Mounts</option>
                    <option value="eyepiece" className="bg-[#0a0a1a]">Eyepieces</option>
                    <option value="filter" className="bg-[#0a0a1a]">Filters</option>
                    <option value="accessory" className="bg-[#0a0a1a]">Accessories</option>
                </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(gearTypeStats).map(([type, count]) => (
                    <div key={type} className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all">
                        <div className="text-2xl font-black text-white mb-1">{count}</div>
                        <div className="text-xs text-white/40 font-medium uppercase tracking-wider capitalize">{type}s</div>
                    </div>
                ))}
            </div>

            {/* Gears Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-purple-500/10 border-b border-purple-500/20">
                                <tr className="text-left text-white/40 text-xs uppercase tracking-wider">
                                    <th className="px-4 py-4 font-semibold">Owner</th>
                                    <th className="px-4 py-4 font-semibold">Gear Name</th>
                                    <th className="px-4 py-4 font-semibold">Type</th>
                                    <th className="px-4 py-4 font-semibold">Brand</th>
                                    <th className="px-4 py-4 font-semibold">Model</th>
                                    <th className="px-4 py-4 font-semibold">Added</th>
                                    <th className="px-4 py-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-white/80">
                                {filteredGears.map((gear) => (
                                    <tr key={gear.id} className="border-t border-purple-500/10 hover:bg-purple-500/5 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                {gear.user?.profile_photo_url ? (
                                                    <img
                                                        src={gear.user.profile_photo_url}
                                                        alt=""
                                                        className="w-8 h-8 rounded-lg object-cover ring-2 ring-purple-500/30"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                                                        {gear.user?.display_name?.[0] || '?'}
                                                    </div>
                                                )}
                                                <span className="font-medium">{gear.user?.display_name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 font-medium">{gear.name}</td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border capitalize ${gearTypeColors[gear.gear_type]}`}>
                                                <Filter className="w-3 h-3" />
                                                {gear.gear_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-white/60">{gear.brand || '-'}</td>
                                        <td className="px-4 py-4 text-white/60">{gear.model || '-'}</td>
                                        <td className="px-4 py-4 text-white/40">
                                            {new Date(gear.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-4">
                                            <button
                                                onClick={() => handleDelete(gear.id)}
                                                className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && filteredGears.length === 0 && (
                    <div className="text-center py-12 text-white/30">
                        No gear found
                    </div>
                )}
            </div>
        </div>
    )
}
