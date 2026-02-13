'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
    Camera, MapPin, Calendar, Loader2, ArrowLeft, Star, Sparkles,
    Moon, Globe2, Rocket, Telescope, CheckCircle2, X, Target, Eye
} from 'lucide-react'
import { STORAGE_BUCKETS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface MissionRequirement {
    id: string
    mission_id: string
    object_name: string
    category: string
    mission_title: string
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

const iconMap: Record<string, any> = {
    Moon: Moon,
    Globe2: Globe2,
    Sparkles: Sparkles,
    Rocket: Rocket,
    Star: Star,
    Telescope: Telescope
}

const colorMap: Record<string, string> = {
    yellow: 'text-yellow-400',
    orange: 'text-orange-400',
    pink: 'text-pink-400',
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    cyan: 'text-cyan-400'
}

export default function NewObservationPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [categoriesLoading, setCategoriesLoading] = useState(true)
    const [categories, setCategories] = useState<Category[]>([])
    const [image, setImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [missionHints, setMissionHints] = useState<MissionRequirement[]>([])
    const [showSuccess, setShowSuccess] = useState(false)
    const [earnedPoints, setEarnedPoints] = useState(0)

    const [formData, setFormData] = useState({
        object_name: '',
        category: '',
        observation_date: new Date().toISOString().split('T')[0],
        location: '',
        notes: '',
    })

    // Fetch categories and active mission requirements
    useEffect(() => {
        fetchCategories()
        fetchMissionHints()
    }, [])

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('observation_categories')
                .select('*')
                .order('sort_order', { ascending: true })
            
            if (data && data.length > 0) {
                setCategories(data)
                // Set default category to first one
                if (!formData.category) {
                    setFormData(prev => ({ ...prev, category: data[0].name }))
                }
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
        } finally {
            setCategoriesLoading(false)
        }
    }

    const fetchMissionHints = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get active missions with their requirements
            const { data: missions } = await supabase
                .from('missions')
                .select(`
                    id,
                    title,
                    requirements:mission_requirements(id, object_name, category)
                `)
                .eq('is_active', true)
                .gte('end_date', new Date().toISOString().split('T')[0])

            // Get user's completed requirements
            const { data: progress } = await supabase
                .from('user_mission_progress')
                .select('mission_id, completed_requirements')
                .eq('user_id', user.id)

            // Filter to show only incomplete requirements
            const hints: MissionRequirement[] = []
            missions?.forEach(mission => {
                const userProgress = progress?.find(p => p.mission_id === mission.id)
                const completedReqs = userProgress?.completed_requirements || []
                
                mission.requirements?.forEach((req: any) => {
                    if (!completedReqs.includes(req.id)) {
                        hints.push({
                            ...req,
                            mission_title: mission.title
                        })
                    }
                })
            })

            setMissionHints(hints)
        } catch (error) {
            console.error('Error fetching mission hints:', error)
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImage(file)
            const reader = new FileReader()
            reader.onloadend = () => setImagePreview(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.object_name.trim()) return
        
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            let photo_url = ''
            if (image) {
                const fileExt = image.name.split('.').pop()
                const fileName = `${user.id}/${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from(STORAGE_BUCKETS.OBSERVATION_PHOTOS)
                    .upload(fileName, image)

                if (uploadError) {
                    if (uploadError.message.includes('Bucket not found')) {
                        throw new Error(`Storage bucket not found. Please create "${STORAGE_BUCKETS.OBSERVATION_PHOTOS}" in Supabase.`)
                    }
                    throw uploadError
                }

                const { data: { publicUrl } } = supabase.storage
                    .from(STORAGE_BUCKETS.OBSERVATION_PHOTOS)
                    .getPublicUrl(fileName)

                photo_url = publicUrl
            }

            // Get points from category
            const selectedCategory = categories.find(c => c.name === formData.category)
            const points = selectedCategory?.points || 10

            const { error: insertError } = await supabase
                .from('observations')
                .insert({
                    user_id: user.id,
                    object_name: formData.object_name,
                    category: formData.category,
                    observation_date: formData.observation_date,
                    location: formData.location || null,
                    notes: formData.notes || null,
                    photo_url: photo_url || null,
                    points_awarded: points,
                })

            if (insertError) throw insertError

            // Update user points
            const { data: profile } = await supabase
                .from('users')
                .select('total_points')
                .eq('id', user.id)
                .single()

            if (profile) {
                await supabase
                    .from('users')
                    .update({ total_points: (profile.total_points || 0) + points })
                    .eq('id', user.id)
            }

            setEarnedPoints(points)
            setShowSuccess(true)
            
            // Redirect after showing success
            setTimeout(() => {
                router.push('/dashboard/observations')
            }, 2000)

        } catch (error: any) {
            alert(error.message)
            setLoading(false)
        }
    }

            const selectMissionHint = (hint: MissionRequirement) => {
        setFormData(prev => ({
            ...prev,
            object_name: hint.object_name,
            category: hint.category
        }))
    }

    // Get current category info
    const selectedCategory = categories.find(c => c.name === formData.category)
    const currentPoints = selectedCategory?.points || 0
    const IconComponent = selectedCategory ? iconMap[selectedCategory.icon] : Eye
    const iconColor = selectedCategory ? colorMap[selectedCategory.color] : 'text-white/40'

    // Success overlay
    if (showSuccess) {
        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckCircle2 className="w-12 h-12 text-green-400" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Observation Logged!</h2>
                    <p className="text-white/50 mb-4">You earned</p>
                    <p className="text-5xl font-bold text-cosmic-gold mb-6">+{earnedPoints} pts</p>
                    <p className="text-white/30 text-sm">Redirecting...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="py-0">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/dashboard/observations"
                    className="p-2 glass-inner rounded-xl hover:bg-white/10 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Log Observation</h1>
                    <p className="text-white/50">Record your cosmic discovery</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="glass-effect rounded-3xl p-8 space-y-6">
                            {/* Object Name */}
                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                    Object Name *
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Orion Nebula, Saturn, Andromeda Galaxy"
                                    className="w-full px-5 py-4 glass-input rounded-xl text-white placeholder:text-white/20 text-lg"
                                    value={formData.object_name}
                                    onChange={(e) => setFormData({ ...formData, object_name: e.target.value })}
                                />
                            </div>

                            {/* Category Selection */}
                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 block">
                                    Category *
                                </label>
                                {categoriesLoading ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {[1, 2, 3, 4, 5, 6].map(i => (
                                            <div key={i} className="p-4 rounded-xl glass-inner animate-pulse h-24" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {categories.map(cat => {
                                            const Icon = iconMap[cat.icon] || Eye
                                            const isSelected = formData.category === cat.name
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, category: cat.name })}
                                                    className={cn(
                                                        "p-4 rounded-xl text-left transition-all",
                                                        isSelected 
                                                            ? "bg-cosmic-purple/20 border-2 border-cosmic-purple" 
                                                            : "glass-inner border-2 border-transparent hover:border-white/10"
                                                    )}
                                                >
                                                    <Icon className={cn(
                                                        "w-6 h-6 mb-2",
                                                        isSelected ? "text-cosmic-purple" : "text-white/40"
                                                    )} />
                                                    <p className={cn(
                                                        "font-medium",
                                                        isSelected ? "text-white" : "text-white/70"
                                                    )}>{cat.name}</p>
                                                    <p className="text-xs text-white/30 mt-1">+{cat.points} pts</p>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Date & Location */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                        Observation Date *
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cosmic-purple" />
                                        <input
                                            required
                                            type="date"
                                            className="w-full pl-12 pr-4 py-4 glass-input rounded-xl text-white"
                                            value={formData.observation_date}
                                            onChange={(e) => setFormData({ ...formData, observation_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                        Location
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cosmic-purple" />
                                        <input
                                            type="text"
                                            placeholder="e.g. Backyard, Observatory"
                                            className="w-full pl-12 pr-4 py-4 glass-input rounded-xl text-white placeholder:text-white/20"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                    Notes
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Describe what you observed, equipment used, sky conditions..."
                                    className="w-full px-5 py-4 glass-input rounded-xl text-white placeholder:text-white/20 resize-none"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            {/* Photo Upload */}
                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                    Photo (Optional)
                                </label>
                                <div
                                    onClick={() => document.getElementById('photo-upload')?.click()}
                                    className={cn(
                                        "relative aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden group",
                                        imagePreview 
                                            ? "border-cosmic-purple/50" 
                                            : "border-white/10 hover:border-cosmic-purple/30 bg-white/[0.02]"
                                    )}
                                >
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setImage(null)
                                                    setImagePreview(null)
                                                }}
                                                className="absolute top-3 right-3 p-2 glass-effect rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Camera className="w-10 h-10 text-white/20 mb-3 group-hover:scale-110 transition-transform" />
                                            <p className="text-sm text-white/30">Click to upload photo</p>
                                        </>
                                    )}
                                    <input
                                        id="photo-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="glass-effect rounded-2xl p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-cosmic-gold/20 flex items-center justify-center">
                                    <Star className="w-7 h-7 text-cosmic-gold" />
                                </div>
                                <div>
                                    <p className="text-xs text-white/40 uppercase font-bold">Points to earn</p>
                                    <p className="text-3xl font-bold text-cosmic-gold">+{currentPoints}</p>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !formData.object_name.trim()}
                                className="px-8 py-4 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Logging...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Log Observation
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Sidebar - Mission Hints */}
                <div className="space-y-6">
                    {/* Category Info */}
                    {selectedCategory && (
                        <div className="glass-effect rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                {IconComponent && <IconComponent className={cn("w-6 h-6", iconColor)} />}
                                <h3 className="font-bold">{selectedCategory.name}</h3>
                            </div>
                            <p className="text-sm text-white/50">{selectedCategory.description}</p>
                        </div>
                    )}

                    {/* Mission Hints */}
                    {missionHints.length > 0 && (
                        <div className="glass-effect rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Target className="w-5 h-5 text-cosmic-pink" />
                                <h3 className="font-bold text-sm">Mission Objectives</h3>
                            </div>
                            <p className="text-xs text-white/40 mb-4">
                                Log these objects to complete active missions:
                            </p>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {missionHints.slice(0, 10).map(hint => {
                                    const hintCat = categories.find(c => c.name === hint.category)
                                    const Icon = hintCat ? iconMap[hintCat.icon] : Eye
                                    return (
                                        <button
                                            key={hint.id}
                                            type="button"
                                            onClick={() => selectMissionHint(hint)}
                                            className={cn(
                                                "w-full p-3 rounded-xl text-left transition-all flex items-center gap-3",
                                                formData.object_name === hint.object_name && formData.category === hint.category
                                                    ? "bg-cosmic-purple/20 border border-cosmic-purple/30"
                                                    : "glass-inner hover:bg-white/10"
                                            )}
                                        >
                                            {Icon && <Icon className="w-4 h-4 text-white/40 flex-shrink-0" />}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{hint.object_name}</p>
                                                <p className="text-[10px] text-white/30 truncate">{hint.mission_title}</p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Points Guide */}
                    <div className="glass-effect rounded-2xl p-6">
                        <h3 className="font-bold text-sm mb-4">Points Guide</h3>
                        <div className="space-y-2">
                            {categories.map(cat => {
                                const Icon = iconMap[cat.icon] || Eye
                                return (
                                    <div key={cat.id} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-white/60">
                                            {Icon && <Icon className="w-4 h-4" />}
                                            {cat.name}
                                        </div>
                                        <span className="text-cosmic-gold font-bold">+{cat.points}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
