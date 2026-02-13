'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
    Calendar, MapPin, Eye, Search, Plus, Trash2, Edit3, X, 
    Moon, Globe2, Sparkles, Star, Telescope, Rocket, Filter,
    ChevronDown, Loader2, Image as ImageIcon, MoreHorizontal,
    TrendingUp, Award, Clock
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Observation {
    id: string
    object_name: string
    category: string
    observation_date: string
    location: string | null
    notes: string | null
    photo_url: string | null
    points_awarded: number
    is_seasonal_rare: boolean
    created_at: string
}

interface Category {
    id: string
    name: string
    description: string
    points: number
    icon: string
    color: string
    sort_order: number
}

interface Stats {
    total: number
    thisMonth: number
    totalPoints: number
    topCategory: string
}

const iconMap: Record<string, any> = {
    Moon: Moon,
    Globe2: Globe2,
    Sparkles: Sparkles,
    Rocket: Rocket,
    Star: Star,
    Telescope: Telescope
}

const colorMap: Record<string, string> = {
    yellow: 'text-yellow-400 bg-yellow-400/10',
    orange: 'text-orange-400 bg-orange-400/10',
    pink: 'text-pink-400 bg-pink-400/10',
    purple: 'text-purple-400 bg-purple-400/10',
    blue: 'text-blue-400 bg-blue-400/10',
    cyan: 'text-cyan-400 bg-cyan-400/10'
}

export default function ObservationsPage() {
    const supabase = createClient()
    const [observations, setObservations] = useState<Observation[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [categoriesLoading, setCategoriesLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [sortBy, setSortBy] = useState<'date' | 'points' | 'name'>('date')
    const [stats, setStats] = useState<Stats>({ total: 0, thisMonth: 0, totalPoints: 0, topCategory: '-' })
    const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    useEffect(() => {
        fetchCategories()
        fetchObservations()
    }, [])

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('observation_categories')
            .select('*')
            .order('sort_order', { ascending: true })
        
        if (error) {
            console.error('Error fetching categories:', error)
            setCategoriesLoading(false)
            return
        }
        if (data) setCategories(data)
        setCategoriesLoading(false)
    }

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
            
            const obs = data || []
            setObservations(obs)
            
            // Calculate stats
            const thisMonth = new Date()
            thisMonth.setDate(1)
            const monthObs = obs.filter(o => new Date(o.observation_date) >= thisMonth)
            const totalPoints = obs.reduce((sum, o) => sum + o.points_awarded, 0)
            
            // Find top category
            const catCounts: Record<string, number> = {}
            obs.forEach(o => {
                catCounts[o.category] = (catCounts[o.category] || 0) + 1
            })
            const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]
            
            setStats({
                total: obs.length,
                thisMonth: monthObs.length,
                totalPoints,
                topCategory: topCat ? topCat[0] : '-'
            })
        } catch (error: any) {
            console.error('Error fetching observations:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const deleteObservation = async (id: string) => {
        setDeleting(true)
        try {
            const obs = observations.find(o => o.id === id)
            if (!obs) return

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Delete observation
            const { error } = await supabase
                .from('observations')
                .delete()
                .eq('id', id)

            if (error) throw error

            // Deduct points from user
            const { data: userData } = await supabase
                .from('users')
                .select('total_points')
                .eq('id', user.id)
                .single()

            if (userData) {
                await supabase
                    .from('users')
                    .update({ 
                        total_points: Math.max(0, (userData.total_points || 0) - obs.points_awarded)
                    })
                    .eq('id', user.id)
            }

            setObservations(prev => prev.filter(o => o.id !== id))
            setShowDeleteConfirm(null)
            setSelectedObservation(null)
            
            // Update stats
            setStats(prev => ({
                ...prev,
                total: prev.total - 1,
                totalPoints: prev.totalPoints - obs.points_awarded
            }))
        } catch (error: any) {
            alert('Failed to delete observation: ' + error.message)
        } finally {
            setDeleting(false)
        }
    }

    const filteredObservations = observations
        .filter(obs => {
            const matchesSearch = obs.object_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                obs.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                obs.notes?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = selectedCategory === 'All' || obs.category === selectedCategory
            return matchesSearch && matchesCategory
        })
        .sort((a, b) => {
            if (sortBy === 'date') return new Date(b.observation_date).getTime() - new Date(a.observation_date).getTime()
            if (sortBy === 'points') return b.points_awarded - a.points_awarded
            return a.object_name.localeCompare(b.object_name)
        })

    const getCategoryIcon = (categoryName: string) => {
        const cat = categories.find(c => c.name === categoryName)
        return cat ? iconMap[cat.icon] : Eye
    }

    const getCategoryColor = (categoryName: string) => {
        const cat = categories.find(c => c.name === categoryName)
        return cat ? colorMap[cat.color] : 'text-white bg-white/10'
    }

    return (
        <div className="py-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                        <Telescope className="w-6 h-6 sm:w-8 sm:h-8 text-cosmic-purple" />
                        My Observations
                    </h1>
                    <p className="text-sm sm:text-base text-white/50">Track and manage your cosmic discoveries</p>
                </div>
                <Link
                    href="/dashboard/observations/new"
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg text-white text-sm sm:text-base"
                >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    Log New Observation
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="glass-effect rounded-xl sm:rounded-2xl p-3 sm:p-5">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-cosmic-purple" />
                        <span className="text-[10px] sm:text-xs text-white/40 uppercase font-bold">Total</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="glass-effect rounded-xl sm:rounded-2xl p-3 sm:p-5">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-cosmic-blue" />
                        <span className="text-[10px] sm:text-xs text-white/40 uppercase font-bold">This Month</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold">{stats.thisMonth}</p>
                </div>
                <div className="glass-effect rounded-xl sm:rounded-2xl p-3 sm:p-5">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                        <Award className="w-4 h-4 sm:w-5 sm:h-5 text-cosmic-gold" />
                        <span className="text-[10px] sm:text-xs text-white/40 uppercase font-bold">Points</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold">{stats.totalPoints}</p>
                </div>
                <div className="glass-effect rounded-xl sm:rounded-2xl p-3 sm:p-5">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-cosmic-pink" />
                        <span className="text-[10px] sm:text-xs text-white/40 uppercase font-bold">Top Cat.</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold truncate">{stats.topCategory}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/30" />
                    <input
                        type="text"
                        placeholder="Search observations..."
                        className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 glass-input rounded-xl text-sm sm:text-base text-white placeholder:text-white/30"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-2">
                    {/* Sort Dropdown */}
                    <div className="relative flex-1 sm:flex-none">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="appearance-none w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-3 pr-8 sm:pr-10 glass-input rounded-xl text-sm sm:text-base text-white cursor-pointer"
                        >
                            <option value="date" className="bg-dark-50">Latest First</option>
                            <option value="points" className="bg-dark-50">Most Points</option>
                            <option value="name" className="bg-dark-50">A-Z Name</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-3 sm:pb-4 mb-4 sm:mb-6 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                <button
                    onClick={() => setSelectedCategory('All')}
                    className={cn(
                        "px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium border",
                        selectedCategory === 'All'
                            ? "bg-cosmic-purple/20 text-cosmic-purple border-cosmic-purple/30"
                            : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    )}
                >
                    <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    All
                    <span className="text-[10px] sm:text-xs opacity-70">({observations.length})</span>
                </button>
                {categoriesLoading ? (
                    // Loading skeleton for categories
                    <>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 animate-pulse w-20 sm:w-28 h-8 sm:h-10" />
                        ))}
                    </>
                ) : (
                    categories.map(cat => {
                        const IconComponent = iconMap[cat.icon] || Eye
                        const count = observations.filter(o => o.category === cat.name).length
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.name)}
                                className={cn(
                                    "px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium border",
                                    selectedCategory === cat.name
                                        ? "bg-cosmic-purple/20 text-cosmic-purple border-cosmic-purple/30"
                                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                )}
                            >
                                <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span>{cat.name}</span>
                                <span className="text-[10px] sm:text-xs opacity-70">({count})</span>
                            </button>
                        )
                    })
                )}
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="glass-effect rounded-xl sm:rounded-2xl aspect-[4/5] animate-pulse" />
                    ))}
                </div>
            ) : filteredObservations.length === 0 ? (
                <div className="glass-effect rounded-2xl sm:rounded-3xl p-8 sm:p-16 text-center">
                    <Telescope className="w-12 h-12 sm:w-16 sm:h-16 text-white/20 mx-auto mb-4 sm:mb-6" />
                    <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                        {searchQuery || selectedCategory !== 'All' 
                            ? 'No matching observations' 
                            : 'No observations yet'}
                    </h3>
                    <p className="text-sm sm:text-base text-white/40 mb-4 sm:mb-6 max-w-md mx-auto">
                        {searchQuery || selectedCategory !== 'All'
                            ? 'Try adjusting your search or filters'
                            : 'Start logging your cosmic discoveries to track your progress and earn points!'}
                    </p>
                    {!searchQuery && selectedCategory === 'All' && (
                        <Link
                            href="/dashboard/observations/new"
                            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-cosmic-purple/20 text-cosmic-purple rounded-xl text-sm sm:text-base font-medium hover:bg-cosmic-purple/30 transition-all"
                        >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            Log your first observation
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredObservations.map(obs => {
                        const IconComponent = getCategoryIcon(obs.category)
                        const colorClass = getCategoryColor(obs.category)
                        
                        return (
                            <div 
                                key={obs.id} 
                                className="group glass-effect rounded-xl sm:rounded-2xl overflow-hidden hover:scale-[1.02] transition-all cursor-pointer"
                                onClick={() => setSelectedObservation(obs)}
                            >
                                {/* Photo */}
                                <div className="aspect-video relative overflow-hidden bg-white/5">
                                    {obs.photo_url ? (
                                        <img
                                            src={obs.photo_url}
                                            alt={obs.object_name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <IconComponent className="w-10 h-10 sm:w-12 sm:h-12 text-white/10" />
                                        </div>
                                    )}
                                    
                                    {/* Overlays */}
                                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 px-2 sm:px-3 py-1 sm:py-1.5 glass-effect rounded-lg text-[10px] sm:text-xs font-bold text-cosmic-gold flex items-center gap-1">
                                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        +{obs.points_awarded}
                                    </div>
                                    <div className={cn(
                                        "absolute bottom-2 sm:bottom-3 left-2 sm:left-3 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5",
                                        colorClass
                                    )}>
                                        <IconComponent className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        {obs.category}
                                    </div>
                                    {obs.is_seasonal_rare && (
                                        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-cosmic-gold/20 text-cosmic-gold rounded text-[8px] sm:text-[10px] font-bold">
                                            RARE
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-3 sm:p-5">
                                    <h3 className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2 truncate">{obs.object_name}</h3>
                                    
                                    <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm text-white/50">
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            {new Date(obs.observation_date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </div>
                                        {obs.location && (
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                <span className="truncate">{obs.location}</span>
                                            </div>
                                        )}
                                    </div>

                                    {obs.notes && (
                                        <p className="text-xs sm:text-sm text-white/40 mt-2 sm:mt-3 line-clamp-2 italic">
                                            "{obs.notes}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Detail Modal */}
            {selectedObservation && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                    onClick={() => setSelectedObservation(null)}
                >
                    <div 
                        className="glass-effect rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Image */}
                        {selectedObservation.photo_url ? (
                            <div className="aspect-video relative">
                                <img 
                                    src={selectedObservation.photo_url} 
                                    alt={selectedObservation.object_name}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={() => setSelectedObservation(null)}
                                    className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 glass-effect rounded-full hover:bg-white/20 transition-all"
                                >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-end p-3 sm:p-4">
                                <button
                                    onClick={() => setSelectedObservation(null)}
                                    className="p-2 glass-inner rounded-full hover:bg-white/10 transition-all"
                                >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-5 sm:p-8">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className={cn(
                                            "px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5",
                                            getCategoryColor(selectedObservation.category)
                                        )}>
                                            {(() => {
                                                const Icon = getCategoryIcon(selectedObservation.category)
                                                return Icon ? <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : null
                                            })()}
                                            {selectedObservation.category}
                                        </span>
                                        {selectedObservation.is_seasonal_rare && (
                                            <span className="px-2 py-1 bg-cosmic-gold/20 text-cosmic-gold rounded text-[10px] sm:text-xs font-bold">
                                                SEASONAL RARE
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-bold">{selectedObservation.object_name}</h2>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="text-2xl sm:text-3xl font-bold text-cosmic-gold">+{selectedObservation.points_awarded}</p>
                                    <p className="text-[10px] sm:text-xs text-white/40 uppercase">Points</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <div className="glass-inner rounded-xl p-3 sm:p-4">
                                    <div className="flex items-center gap-1.5 sm:gap-2 text-white/40 mb-1">
                                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="text-[10px] sm:text-xs uppercase font-bold">Date</span>
                                    </div>
                                    <p className="text-xs sm:text-sm font-medium">
                                        {new Date(selectedObservation.observation_date).toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div className="glass-inner rounded-xl p-3 sm:p-4">
                                    <div className="flex items-center gap-1.5 sm:gap-2 text-white/40 mb-1">
                                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="text-[10px] sm:text-xs uppercase font-bold">Location</span>
                                    </div>
                                    <p className="text-xs sm:text-sm font-medium truncate">{selectedObservation.location || 'Not specified'}</p>
                                </div>
                            </div>

                            {selectedObservation.notes && (
                                <div className="glass-inner rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                                    <p className="text-[10px] sm:text-xs uppercase font-bold text-white/40 mb-1.5 sm:mb-2">Notes</p>
                                    <p className="text-sm sm:text-base text-white/80 leading-relaxed">{selectedObservation.notes}</p>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 pt-3 sm:pt-4 border-t border-white/5">
                                <p className="text-[10px] sm:text-xs text-white/30 order-2 sm:order-1">
                                    Logged on {new Date(selectedObservation.created_at).toLocaleDateString()}
                                </p>
                                <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
                                    <Link
                                        href={`/dashboard/observations/edit/${selectedObservation.id}`}
                                        className="flex-1 sm:flex-none px-4 py-2 glass-inner rounded-xl text-xs sm:text-sm font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => setShowDeleteConfirm(selectedObservation.id)}
                                        className="flex-1 sm:flex-none px-4 py-2 bg-cosmic-pink/20 text-cosmic-pink rounded-xl text-xs sm:text-sm font-medium hover:bg-cosmic-pink/30 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
                    onClick={() => setShowDeleteConfirm(null)}
                >
                    <div 
                        className="glass-effect rounded-t-2xl sm:rounded-2xl p-6 sm:p-8 w-full sm:max-w-md text-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-cosmic-pink/20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                            <Trash2 className="w-6 h-6 sm:w-8 sm:h-8 text-cosmic-pink" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold mb-2">Delete Observation?</h3>
                        <p className="text-sm sm:text-base text-white/50 mb-4 sm:mb-6">
                            This will permanently delete this observation and deduct the points from your total. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 sm:py-3 glass-inner rounded-xl text-sm sm:text-base font-medium hover:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteObservation(showDeleteConfirm)}
                                disabled={deleting}
                                className="flex-1 px-4 py-3 bg-cosmic-pink text-white rounded-xl font-medium hover:bg-cosmic-pink/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {deleting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
