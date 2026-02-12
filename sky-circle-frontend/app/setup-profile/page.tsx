'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EXPERIENCE_LEVELS } from '@/lib/constants'
import { User, Camera, Loader2 } from 'lucide-react'

export default function SetupProfilePage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        telescopeType: '',
        experienceLevel: 'beginner' as const,
    })
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string>('')

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setProfilePhoto(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No user found')

            let photoUrl = null

            // Upload profile photo if provided
            if (profilePhoto) {
                const fileExt = profilePhoto.name.split('.').pop()
                const fileName = `${user.id}-${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('profile-photos')
                    .upload(fileName, profilePhoto)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('profile-photos')
                    .getPublicUrl(fileName)

                photoUrl = publicUrl
            }

            // Update user profile
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    display_name: formData.displayName,
                    bio: formData.bio,
                    telescope_type: formData.telescopeType || null,
                    experience_level: formData.experienceLevel,
                    profile_photo_url: photoUrl,
                })
                .eq('id', user.id)

            if (updateError) throw updateError

            router.push('/dashboard')
        } catch (err: any) {
            setError(err.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="glass-effect rounded-2xl p-8 shadow-2xl">
                    <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
                    <p className="text-gray-400 mb-8">Tell us a bit about yourself to get started</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Profile Photo */}
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-16 h-16 text-white" />
                                    )}
                                </div>
                                <label
                                    htmlFor="photo"
                                    className="absolute bottom-0 right-0 w-10 h-10 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                                >
                                    <Camera className="w-5 h-5 text-white" />
                                    <input
                                        id="photo"
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <p className="text-sm text-gray-400 mt-2">Click camera to upload photo</p>
                        </div>

                        {/* Display Name */}
                        <div>
                            <label htmlFor="displayName" className="block text-sm font-medium mb-2">
                                Display Name *
                            </label>
                            <input
                                id="displayName"
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                placeholder="Your name"
                                required
                            />
                        </div>

                        {/* Bio */}
                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium mb-2">
                                Bio
                            </label>
                            <textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                                placeholder="Tell us about your astronomy journey..."
                                rows={3}
                            />
                        </div>

                        {/* Telescope Type */}
                        <div>
                            <label htmlFor="telescopeType" className="block text-sm font-medium mb-2">
                                Telescope Type
                            </label>
                            <input
                                id="telescopeType"
                                type="text"
                                value={formData.telescopeType}
                                onChange={(e) => setFormData({ ...formData, telescopeType: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                placeholder="e.g., Celestron NexStar 8SE"
                            />
                        </div>

                        {/* Experience Level */}
                        <div>
                            <label htmlFor="experienceLevel" className="block text-sm font-medium mb-2">
                                Experience Level *
                            </label>
                            <select
                                id="experienceLevel"
                                value={formData.experienceLevel}
                                onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value as any })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                required
                            >
                                {EXPERIENCE_LEVELS.map((level) => (
                                    <option key={level.value} value={level.value} className="bg-cosmic-dark">
                                        {level.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Complete Setup'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
