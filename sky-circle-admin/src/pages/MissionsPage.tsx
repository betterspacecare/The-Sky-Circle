import { useEffect, useState } from 'react'
import { useAdminStore } from '../store/adminStore'
import { Modal } from '../components/Modal'
import type { Mission } from '../types/database.types'
import { Plus, Edit2, Trash2, Loader2, Target, Calendar, Award, X } from 'lucide-react'

const CATEGORIES = ['Moon', 'Planet', 'Nebula', 'Galaxy', 'Cluster', 'Constellation']

export function MissionsPage() {
    const { missions, badges, fetchMissions, fetchBadges, createMission, updateMission, deleteMission, isLoading } = useAdminStore()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingMission, setEditingMission] = useState<Mission | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        reward_badge_id: '',
        bonus_points: '0',
        is_active: true,
    })
    const [requirements, setRequirements] = useState<{ object_name: string; category: string }[]>([])
    const [newReq, setNewReq] = useState({ object_name: '', category: 'Moon' })

    useEffect(() => {
        fetchMissions()
        fetchBadges()
    }, [fetchMissions, fetchBadges])

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            start_date: '',
            end_date: '',
            reward_badge_id: '',
            bonus_points: '0',
            is_active: true,
        })
        setRequirements([])
        setEditingMission(null)
    }

    const handleEdit = (mission: Mission) => {
        setEditingMission(mission)
        setFormData({
            title: mission.title,
            description: mission.description || '',
            start_date: mission.start_date,
            end_date: mission.end_date,
            reward_badge_id: mission.reward_badge_id || '',
            bonus_points: mission.bonus_points.toString(),
            is_active: mission.is_active,
        })
        setRequirements(mission.requirements?.map(r => ({ object_name: r.object_name, category: r.category })) || [])
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        const missionData = {
            title: formData.title,
            description: formData.description || null,
            start_date: formData.start_date,
            end_date: formData.end_date,
            reward_badge_id: formData.reward_badge_id || null,
            bonus_points: parseInt(formData.bonus_points),
            is_active: formData.is_active,
        }

        if (editingMission) {
            await updateMission(editingMission.id, missionData)
        } else {
            await createMission(missionData, requirements)
        }

        setIsModalOpen(false)
        resetForm()
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this mission?')) {
            await deleteMission(id)
        }
    }

    const addRequirement = () => {
        if (newReq.object_name.trim()) {
            setRequirements([...requirements, { ...newReq }])
            setNewReq({ object_name: '', category: 'Moon' })
        }
    }

    const removeRequirement = (index: number) => {
        setRequirements(requirements.filter((_, i) => i !== index))
    }

    const activeMissions = missions.filter(m => m.is_active)
    const inactiveMissions = missions.filter(m => !m.is_active)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-white">Missions</h2>
                    <p className="text-slate-400 text-sm">{activeMissions.length} active missions</p>
                </div>
                <button
                    onClick={() => {
                        resetForm()
                        setIsModalOpen(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Mission
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
            ) : (
                <>
                    {/* Active Missions */}
                    <div>
                        <h3 className="text-lg font-medium text-white mb-3">Active Missions</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            {activeMissions.map((mission) => (
                                <MissionCard
                                    key={mission.id}
                                    mission={mission}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                            {activeMissions.length === 0 && (
                                <p className="text-slate-400 col-span-full">No active missions</p>
                            )}
                        </div>
                    </div>

                    {/* Inactive Missions */}
                    {inactiveMissions.length > 0 && (
                        <div>
                            <h3 className="text-lg font-medium text-white mb-3">Inactive Missions</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {inactiveMissions.map((mission) => (
                                    <MissionCard
                                        key={mission.id}
                                        mission={mission}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    resetForm()
                }}
                title={editingMission ? 'Edit Mission' : 'Create Mission'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">End Date</label>
                            <input
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Reward Badge</label>
                            <select
                                value={formData.reward_badge_id}
                                onChange={(e) => setFormData({ ...formData, reward_badge_id: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">None</option>
                                {badges.map(badge => (
                                    <option key={badge.id} value={badge.id}>{badge.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Bonus Points</label>
                            <input
                                type="number"
                                value={formData.bonus_points}
                                onChange={(e) => setFormData({ ...formData, bonus_points: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Requirements */}
                    {!editingMission && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Requirements</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="Object name"
                                    value={newReq.object_name}
                                    onChange={(e) => setNewReq({ ...newReq, object_name: e.target.value })}
                                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <select
                                    value={newReq.category}
                                    onChange={(e) => setNewReq({ ...newReq, category: e.target.value })}
                                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={addRequirement}
                                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-1">
                                {requirements.map((req, index) => (
                                    <div key={index} className="flex items-center justify-between px-3 py-2 bg-slate-700/50 rounded-lg">
                                        <span className="text-slate-300">{req.object_name} ({req.category})</span>
                                        <button
                                            type="button"
                                            onClick={() => removeRequirement(index)}
                                            className="text-slate-400 hover:text-red-400"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <label className="flex items-center gap-2 text-slate-300">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500"
                        />
                        Active
                    </label>

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
                            {editingMission ? 'Save Changes' : 'Create Mission'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

function MissionCard({ 
    mission, 
    onEdit, 
    onDelete 
}: { 
    mission: Mission
    onEdit: (mission: Mission) => void
    onDelete: (id: string) => void
}) {
    return (
        <div className={`bg-slate-800 rounded-xl border border-slate-700 p-4 ${!mission.is_active ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-lg font-semibold text-white">{mission.title}</h4>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => onEdit(mission)}
                        className="p-1 text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(mission.id)}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            {mission.description && (
                <p className="text-slate-400 text-sm mb-3">{mission.description}</p>
            )}
            <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {mission.start_date} - {mission.end_date}
                </div>
                {mission.reward_badge && (
                    <div className="flex items-center gap-2 text-slate-300">
                        <Award className="w-4 h-4 text-yellow-400" />
                        {mission.reward_badge.name}
                    </div>
                )}
                {mission.bonus_points > 0 && (
                    <div className="text-yellow-400">+{mission.bonus_points} bonus points</div>
                )}
            </div>
            {mission.requirements && mission.requirements.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">Requirements:</p>
                    <div className="flex flex-wrap gap-1">
                        {mission.requirements.map((req) => (
                            <span key={req.id} className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs">
                                {req.object_name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
