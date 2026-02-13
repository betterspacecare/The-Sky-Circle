'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
    Camera, MapPin, Calendar, Loader2, ArrowLeft, Star, Sparkles,
    Moon, Globe2, Rocket, Telescope, CheckCircle2, X, Save, Eye
} from 'lucide-react'
import { STORAGE_BUCKETS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import Link from 'next/link'

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

interface Observation {
    id: string
    object_name: string
    category: string
    observation_date: string
    location: string | null
    notes: string | null
    photo_url: string | null
    points_awarded: number
}

export default function EditObservationPage() {
    const router = useRouter()
    const params = useParams()
    const observationId = params.id as string
    const supabase = createClient()
    
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [observation, setObservation] = useState<Observation | null>(null)
    const [image, setImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [originalPoints, setOriginalPoints] = useState(0)

    const [formData, setFormData] = useState({
        object_name: '',
        category: '',
        observation_date: '',
        location: '',
        notes: '',
    })

    useEffect(() => {
        fetchCategories()
        fetchObservation()
    }, [observationId])

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('observation_categories')
                .select('*')
                .order('sort_order', { ascending: true })
            
            if (data) setCategories(data)
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    const fetchObservation = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data, error } = await supabase
                .from('observations')
                .select('*')
                .eq('id', observationId)
                .eq('user_id', user.id)
                .single()

            if (error || !data) {
                alert('Observation not found')
                router.push('/dashboard/observations')
                return
            }

            setObservation(data)
            setOriginalPoints(data.points_awarded)
            setFormData({
                object_name: data.object_name,
                category: data.category as any,
                observation_date: data.observation_date,
                location: data.location || '',
                notes: data.notes || '',
            })
            if (data.photo_url) {
                setImagePreview(data.photo_url)
            }
        } catch (error: any) {
            console.error('Error fetching observation:', error.message)
            router.push('/dashboard/observations')
        } finally {
            setLoading(false)
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
        
        setSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            let photo_url = observation?.photo_url || null

            // Upload new image if selected
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
            const newPoints = selectedCategory?.points || 10
            const pointsDiff = newPoints - originalPoints

            // Update observation
            const { error: updateError } = await supabase
                .from('observations')
                .update({
                    object_name: formData.object_name,
                    category: formData.category,
                    observation_date: formData.observation_date,
                    location: formData.location || null,
                    notes: formData.notes || null,
                    photo_url,
                    points_awarded: newPoints,
                })
                .eq('id', observationId)

            if (updateError) throw updateError

            // Update user points if category changed
            if (pointsDiff !== 0) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('total_points')
                    .eq('id', user.id)
                    .single()

                if (profile) {
                    await supabase
                        .from('users')
                        .update({ 
                            total_points: Math.max(0, (profile.total_points || 0) + pointsDiff)
                        })
                        .eq('id', user.id)
                }
            }

            router.push('/dashboard/observations')

        } catch (error: any) {
            alert(error.message)
        } finally {
            setSaving(false)
        }
    }

    // Get current category info
    const selectedCategory = categories.find(c => c.name === formData.category)
    const currentPoints = selectedCategory?.points || 0
    const IconComponent = selectedCategory ? iconMap[selectedCategory.icon] : Eye

    if (loading) {
        return (
            <div className="py-0">
                <div className="glass-effect rounded-3xl p-16 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-cosmic-purple" />
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
                    <h1 className="text-3xl font-bold">Edit Observation</h1>
                    <p className="text-white/50">Update your observation details</p>
                </div>
            </div>

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
                            Photo
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
                            <p className="text-xs text-white/40 uppercase font-bold">Points</p>
                            <p className="text-3xl font-bold text-cosmic-gold">
                                {currentPoints}
                                {currentPoints !== originalPoints && (
                                    <span className={cn(
                                        "text-lg ml-2",
                                        currentPoints > originalPoints ? "text-green-400" : "text-red-400"
                                    )}>
                                        ({currentPoints > originalPoints ? '+' : ''}{currentPoints - originalPoints})
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/dashboard/observations"
                            className="px-6 py-4 glass-inner rounded-xl font-medium hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving || !formData.object_name.trim()}
                            className="px-8 py-4 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
