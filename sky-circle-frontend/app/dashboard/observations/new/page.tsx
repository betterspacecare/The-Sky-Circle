'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Camera, MapPin, Calendar, Info, Loader2 } from 'lucide-react'
import { OBSERVATION_CATEGORIES, POINTS_MAP, STORAGE_BUCKETS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export default function NewObservationPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [image, setImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        object_name: '',
        category: 'Moon' as typeof OBSERVATION_CATEGORIES[number],
        observation_date: new Date().toISOString().split('T')[0],
        location: '',
        notes: '',
    })

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImage(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            let photo_url = ''
            if (image) {
                const fileExt = image.name.split('.').pop()
                const fileName = `${user.id}/${Date.now()}.${fileExt}`
                const { error: uploadError, data } = await supabase.storage
                    .from(STORAGE_BUCKETS.OBSERVATION_PHOTOS)
                    .upload(fileName, image)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from(STORAGE_BUCKETS.OBSERVATION_PHOTOS)
                    .getPublicUrl(fileName)

                photo_url = publicUrl
            }

            const points = POINTS_MAP[formData.category]

            const { error: insertError } = await supabase
                .from('observations')
                .insert({
                    user_id: user.id,
                    object_name: formData.object_name,
                    category: formData.category,
                    observation_date: formData.observation_date,
                    location: formData.location,
                    notes: formData.notes,
                    photo_url,
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

            router.push('/dashboard/observations')
            router.refresh()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            <h1 className="text-4xl font-black mb-10 tracking-tighter text-white">Log Discovery</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="glass-effect rounded-[2.5rem] p-10 space-y-8 border border-white/5">
                    {/* Object Name */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 block font-mono">Astral Object</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Orion Nebula, Saturn, Messier 31"
                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cosmic-purple transition-all text-white font-black placeholder:text-white/10"
                            value={formData.object_name}
                            onChange={(e) => setFormData({ ...formData, object_name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Category */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 block font-mono">Category</label>
                            <select
                                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cosmic-purple transition-all text-white font-black"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                            >
                                {OBSERVATION_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat} className="bg-[#050810] text-white">{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 block font-mono">Observation Epoch</label>
                            <div className="relative">
                                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-cosmic-purple" />
                                <input
                                    required
                                    type="date"
                                    className="w-full pl-16 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cosmic-purple transition-all text-white font-black"
                                    value={formData.observation_date}
                                    onChange={(e) => setFormData({ ...formData, observation_date: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 block font-mono">Scanning Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-cosmic-purple" />
                            <input
                                type="text"
                                placeholder="e.g. Naya Raipur, Marine Drive, CG"
                                className="w-full pl-16 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cosmic-purple transition-all text-white font-bold placeholder:text-white/10"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 block font-mono">Observer Notes</label>
                        <textarea
                            rows={4}
                            placeholder="Describe what you saw, telescope used, sky conditions..."
                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cosmic-purple transition-all resize-none text-white font-medium placeholder:text-white/10"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 block font-mono">Visual Evidence</label>
                        <div
                            onClick={() => document.getElementById('photo-upload')?.click()}
                            className="relative aspect-video rounded-[2rem] border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-cosmic-purple/40 transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden group"
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Camera className="w-8 h-8 text-white/20" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Sync observation data</span>
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

                {/* Points Card */}
                <div className="bg-gradient-to-r from-cosmic-purple/20 to-cosmic-blue/20 rounded-3xl p-8 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-cosmic-purple/30 flex items-center justify-center text-cosmic-purple shadow-[0_0_20px_rgba(192,132,252,0.3)]">
                            <Info className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-black text-white/40 tracking-widest mb-1">Energy Yield</p>
                            <p className="text-3xl font-black text-white tracking-tighter">+{POINTS_MAP[formData.category]} PTS</p>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-gradient-to-r from-cosmic-purple to-cosmic-blue rounded-xl font-bold hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Logging...
                            </>
                        ) : (
                            'Log Observation'
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
