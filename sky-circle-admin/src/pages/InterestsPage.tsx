import { useEffect, useState } from 'react'
import { useAdminStore } from '../store/adminStore'
import { Modal } from '../components/Modal'
import { Search, Edit2, Trash2, Plus, Loader2, Star, Tag } from 'lucide-react'
import type { Interest } from '../types/database.types'

export function InterestsPage() {
    const { interests, userInterests, fetchInterests, fetchUserInterests, createInterest, updateInterest, deleteInterest, deleteUserInterest, isLoading } = useAdminStore()
    const [search, setSearch] = useState('')
    const [editingInterest, setEditingInterest] = useState<Interest | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [formData, setFormData] = useState<Partial<Interest>>({})

    useEffect(() => {
        fetchInterests()
        fetchUserInterests()
    }, [fetchInterests, fetchUserInterests])

    const filteredInterests = interests.filter(interest => 
        interest.name.toLowerCase().includes(search.toLowerCase()) ||
        interest.display_name.toLowerCase().includes(search.toLowerCase()) ||
        interest.category?.toLowerCase().includes(search.toLowerCase())
    )

    const handleEdit = (interest: Interest) => {
        setEditingInterest(interest)
        setFormData({
            name: interest.name,
            display_name: interest.display_name,
            category: interest.category,
        })
    }

    const handleCreate = () => {
        setIsCreating(true)
        setFormData({
            name: '',
            display_name: '',
            category: '',
        })
    }

    const handleSave = async () => {
        if (editingInterest) {
            await updateInterest(editingInterest.id, formData)
            setEditingInterest(null)
        } else if (isCreating) {
            await createInterest(formData as Omit<Interest, 'id' | 'created_at'>)
            setIsCreating(false)
        }
        setFormData({})
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this interest? This will also remove it from all users.')) {
            await deleteInterest(id)
        }
    }

    const handleDeleteUserInterest = async (id: string) => {
        if (confirm('Remove this interest from the user?')) {
            await deleteUserInterest(id)
        }
    }

    const getInterestUsageCount = (interestId: string) => {
        return userInterests.filter(ui => ui.interest_id === interestId).length
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center">
                        <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gradient">User Interests</h2>
                        <p className="text-white/40 text-sm">Manage interest categories</p>
                    </div>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2.5 btn-cosmic rounded-xl font-bold text-white"
                >
                    <Plus className="w-5 h-5" />
                    Add Interest
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                    type="text"
                    placeholder="Search interests..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 glass-input rounded-xl text-white placeholder-white/30"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-3">
                        <Star className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-white">{interests.length}</div>
                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Total Interests</div>
                </div>
                <div className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-3">
                        <Tag className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-blue-400">{userInterests.length}</div>
                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider">User Selections</div>
                </div>
                <div className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-3">
                        <Star className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-green-400">
                        {interests.length > 0 ? (userInterests.length / interests.length).toFixed(1) : '0'}
                    </div>
                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Avg Selections</div>
                </div>
            </div>

            {/* Interests Table */}
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
                                    <th className="px-4 py-4 font-semibold">Display Name</th>
                                    <th className="px-4 py-4 font-semibold">Internal Name</th>
                                    <th className="px-4 py-4 font-semibold">Category</th>
                                    <th className="px-4 py-4 font-semibold">Usage Count</th>
                                    <th className="px-4 py-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-white/80">
                                {filteredInterests.map((interest) => (
                                    <tr key={interest.id} className="border-t border-purple-500/10 hover:bg-purple-500/5 transition-colors">
                                        <td className="px-4 py-4 font-medium">{interest.display_name}</td>
                                        <td className="px-4 py-4 text-white/60 font-mono text-sm">{interest.name}</td>
                                        <td className="px-4 py-4">
                                            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs font-semibold capitalize">
                                                {interest.category || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-amber-400 font-bold">{getInterestUsageCount(interest.id)}</span>
                                            <span className="text-white/40 text-sm ml-1">users</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(interest)}
                                                    className="p-2 text-white/40 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(interest.id)}
                                                    className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && filteredInterests.length === 0 && (
                    <div className="text-center py-12 text-white/30">
                        No interests found
                    </div>
                )}
            </div>

            {/* User Interests Section */}
            <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-purple-400" />
                    User Interest Selections
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-purple-500/10 border-b border-purple-500/20">
                            <tr className="text-left text-white/40 text-xs uppercase tracking-wider">
                                <th className="px-4 py-4 font-semibold">User</th>
                                <th className="px-4 py-4 font-semibold">Interest</th>
                                <th className="px-4 py-4 font-semibold">Selected On</th>
                                <th className="px-4 py-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-white/80">
                            {userInterests.slice(0, 10).map((ui) => (
                                <tr key={ui.id} className="border-t border-purple-500/10 hover:bg-purple-500/5 transition-colors">
                                    <td className="px-4 py-4">
                                        <span className="font-medium">{ui.user?.display_name || 'Unknown'}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs font-semibold">
                                            {ui.interest?.display_name || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-white/40">
                                        {new Date(ui.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-4">
                                        <button
                                            onClick={() => handleDeleteUserInterest(ui.id)}
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
                {userInterests.length > 10 && (
                    <p className="text-center text-white/40 text-sm mt-4">
                        Showing 10 of {userInterests.length} user interest selections
                    </p>
                )}
            </div>

            {/* Edit/Create Modal */}
            <Modal
                isOpen={!!editingInterest || isCreating}
                onClose={() => {
                    setEditingInterest(null)
                    setIsCreating(false)
                }}
                title={editingInterest ? 'Edit Interest' : 'Create Interest'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={formData.display_name || ''}
                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                            placeholder="e.g., Astrophotography"
                            className="w-full px-4 py-3 glass-input rounded-xl text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            Internal Name (slug)
                        </label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., astrophotography"
                            className="w-full px-4 py-3 glass-input rounded-xl text-white font-mono"
                        />
                        <p className="text-xs text-white/30 mt-1">Lowercase, no spaces (use underscores)</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            Category
                        </label>
                        <select
                            value={formData.category || ''}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-3 glass-input rounded-xl text-white"
                        >
                            <option value="" className="bg-[#0a0a1a]">Select category...</option>
                            <option value="technique" className="bg-[#0a0a1a]">Technique</option>
                            <option value="target" className="bg-[#0a0a1a]">Target</option>
                            <option value="event" className="bg-[#0a0a1a]">Event</option>
                            <option value="content" className="bg-[#0a0a1a]">Content</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => {
                                setEditingInterest(null)
                                setIsCreating(false)
                            }}
                            className="px-6 py-2.5 text-white/60 hover:text-white transition-colors rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2.5 btn-cosmic rounded-xl font-bold text-white"
                        >
                            {editingInterest ? 'Save Changes' : 'Create Interest'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
