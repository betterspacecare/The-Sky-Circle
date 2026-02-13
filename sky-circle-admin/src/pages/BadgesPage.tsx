import { useEffect, useState } from 'react'
import { useAdminStore } from '../store/adminStore'
import { Modal } from '../components/Modal'
import type { Badge } from '../types/database.types'
import { Plus, Edit2, Trash2, Loader2, Award } from 'lucide-react'

const REQUIREMENT_TYPES = [
    { value: 'observation_count', label: 'Observation Count' },
    { value: 'specific_object', label: 'Specific Object' },
    { value: 'mission_complete', label: 'Mission Complete' },
    { value: 'referral_count', label: 'Referral Count' },
    { value: 'special', label: 'Special' },
]

export function BadgesPage() {
    const { badges, fetchBadges, createBadge, updateBadge, deleteBadge, isLoading } = useAdminStore()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingBadge, setEditingBadge] = useState<Badge | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon_url: '',
        requirement_type: 'observation_count' as Badge['requirement_type'],
        requirement_value: '',
    })

    useEffect(() => {
        fetchBadges()
    }, [fetchBadges])

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            icon_url: '',
            requirement_type: 'observation_count',
            requirement_value: '',
        })
        setEditingBadge(null)
    }

    const handleEdit = (badge: Badge) => {
        setEditingBadge(badge)
        setFormData({
            name: badge.name,
            description: badge.description,
            icon_url: badge.icon_url || '',
            requirement_type: badge.requirement_type,
            requirement_value: badge.requirement_value ? JSON.stringify(badge.requirement_value) : '',
        })
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        let reqValue = null
        if (formData.requirement_value) {
            try {
                reqValue = JSON.parse(formData.requirement_value)
            } catch {
                reqValue = { value: formData.requirement_value }
            }
        }

        const badgeData = {
            name: formData.name,
            description: formData.description,
            icon_url: formData.icon_url || null,
            requirement_type: formData.requirement_type,
            requirement_value: reqValue,
        }

        if (editingBadge) {
            await updateBadge(editingBadge.id, badgeData)
        } else {
            await createBadge(badgeData)
        }

        setIsModalOpen(false)
        resetForm()
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this badge?')) {
            await deleteBadge(id)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-white">Badges</h2>
                    <p className="text-slate-400 text-sm">{badges.length} badges</p>
                </div>
                <button
                    onClick={() => {
                        resetForm()
                        setIsModalOpen(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Badge
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {badges.map((badge) => (
                        <div
                            key={badge.id}
                            className="bg-slate-800 rounded-xl border border-slate-700 p-4"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                    {badge.icon_url ? (
                                        <img src={badge.icon_url} alt="" className="w-8 h-8" />
                                    ) : (
                                        <Award className="w-6 h-6 text-white" />
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(badge)}
                                        className="p-1 text-slate-400 hover:text-indigo-400 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(badge.id)}
                                        className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-1">{badge.name}</h4>
                            <p className="text-slate-400 text-sm mb-3 line-clamp-2">{badge.description}</p>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs capitalize">
                                    {badge.requirement_type.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isLoading && badges.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    No badges created yet
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    resetForm()
                }}
                title={editingBadge ? 'Edit Badge' : 'Create Badge'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Icon URL (optional)</label>
                        <input
                            type="url"
                            value={formData.icon_url}
                            onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="https://..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Requirement Type</label>
                        <select
                            value={formData.requirement_type}
                            onChange={(e) => setFormData({ ...formData, requirement_type: e.target.value as Badge['requirement_type'] })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {REQUIREMENT_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Requirement Value (JSON or simple value)
                        </label>
                        <input
                            type="text"
                            value={formData.requirement_value}
                            onChange={(e) => setFormData({ ...formData, requirement_value: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder='e.g., 10 or {"count": 5, "category": "Planet"}'
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false)
                                resetForm()
                            }}
                            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                            {editingBadge ? 'Save Changes' : 'Create Badge'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
