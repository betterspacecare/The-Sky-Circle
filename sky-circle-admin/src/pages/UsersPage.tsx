import { useEffect, useState } from 'react'
import { useAdminStore } from '../store/adminStore'
import { useAuthStore } from '../store/authStore'
import { Modal } from '../components/Modal'
import type { User, UserRole } from '../types/database.types'
import { Search, Edit2, Trash2, Loader2, Shield, ShieldCheck, UserCircle, Users, Star, Rocket } from 'lucide-react'

const roleColors = {
    admin: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30',
    manager: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30',
    user: 'bg-white/5 text-white/60 border-white/10'
}

const roleLabels = {
    admin: 'Admin',
    manager: 'Manager',
    user: 'User'
}

export function UsersPage() {
    const { users, fetchUsers, updateUser, deleteUser, isLoading } = useAdminStore()
    const { hasPermission, profile: currentUser } = useAuthStore()
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [formData, setFormData] = useState<Partial<User>>({})

    const canManageRoles = hasPermission('users.manage_roles')
    const canDeleteUsers = hasPermission('users.delete')
    const canEditUsers = hasPermission('users.edit')

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.display_name?.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase())
        const matchesRole = roleFilter === 'all' || user.role === roleFilter
        return matchesSearch && matchesRole
    })

    const handleEdit = (user: User) => {
        setEditingUser(user)
        setFormData({
            display_name: user.display_name,
            level: user.level,
            total_points: user.total_points,
            experience_level: user.experience_level,
            role: user.role || 'user',
            is_event_creator: user.is_event_creator || false,
        })
    }

    const handleSave = async () => {
        if (!editingUser) return
        await updateUser(editingUser.id, formData)
        setEditingUser(null)
    }

    const handleDelete = async (id: string) => {
        if (id === currentUser?.id) {
            alert('You cannot delete your own account.')
            return
        }
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            await deleteUser(id)
        }
    }

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        if (userId === currentUser?.id) {
            alert('You cannot change your own role.')
            return
        }
        await updateUser(userId, { role: newRole })
    }

    const getRoleIcon = (role: string | null) => {
        switch (role) {
            case 'admin': return <ShieldCheck className="w-3 h-3" />
            case 'manager': return <Shield className="w-3 h-3" />
            default: return <UserCircle className="w-3 h-3" />
        }
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                        type="text"
                        placeholder="Search explorers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 glass-input rounded-xl text-white placeholder-white/30"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-3 glass-input rounded-xl text-white"
                >
                    <option value="all" className="bg-[#0a0a1a]">All Roles</option>
                    <option value="admin" className="bg-[#0a0a1a]">Admins</option>
                    <option value="manager" className="bg-[#0a0a1a]">Managers</option>
                    <option value="user" className="bg-[#0a0a1a]">Users</option>
                </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-3">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-white">{users.length}</div>
                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Total Explorers</div>
                </div>
                <div className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-3">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-purple-400">{users.filter(u => u.role === 'admin').length}</div>
                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Admins</div>
                </div>
                <div className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-3">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-amber-400">{users.filter(u => u.role === 'manager').length}</div>
                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Managers</div>
                </div>
                <div className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-3">
                        <Rocket className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-green-400">{users.filter(u => u.is_event_creator).length}</div>
                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Guild Leaders</div>
                </div>
            </div>

            {/* Users Table */}
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
                                    <th className="px-4 py-4 font-semibold">Explorer</th>
                                    <th className="px-4 py-4 font-semibold">Email</th>
                                    <th className="px-4 py-4 font-semibold">Role</th>
                                    <th className="px-4 py-4 font-semibold">Level</th>
                                    <th className="px-4 py-4 font-semibold">Points</th>
                                    <th className="px-4 py-4 font-semibold">Joined</th>
                                    <th className="px-4 py-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-white/80">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-t border-purple-500/10 hover:bg-purple-500/5 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                {user.profile_photo_url ? (
                                                    <img
                                                        src={user.profile_photo_url}
                                                        alt=""
                                                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/30"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                                        {user.display_name?.[0] || user.email[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="block font-medium">{user.display_name || 'No name'}</span>
                                                    {user.id === currentUser?.id && (
                                                        <span className="text-xs text-purple-400">(You)</span>
                                                    )}
                                                    {user.is_event_creator && (
                                                        <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                                                            <Star className="w-3 h-3" /> Guild Leader
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-white/50">{user.email}</td>
                                        <td className="px-4 py-4">
                                            {canManageRoles && user.id !== currentUser?.id ? (
                                                <select
                                                    value={user.role || 'user'}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${roleColors[user.role as keyof typeof roleColors || 'user']} bg-transparent`}
                                                >
                                                    <option value="user" className="bg-[#0a0a1a]">User</option>
                                                    <option value="manager" className="bg-[#0a0a1a]">Manager</option>
                                                    <option value="admin" className="bg-[#0a0a1a]">Admin</option>
                                                </select>
                                            ) : (
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${roleColors[user.role as keyof typeof roleColors || 'user']}`}>
                                                    {getRoleIcon(user.role)}
                                                    {roleLabels[user.role as keyof typeof roleLabels || 'user']}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm font-semibold">
                                                Lvl {user.level}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-amber-400 font-bold">{user.total_points}</span>
                                        </td>
                                        <td className="px-4 py-4 text-white/40">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                {canEditUsers && (
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="p-2 text-white/40 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {canDeleteUsers && user.id !== currentUser?.id && (
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                title="Edit Explorer"
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
                            className="w-full px-4 py-3 glass-input rounded-xl text-white"
                        />
                    </div>
                    
                    {canManageRoles && editingUser?.id !== currentUser?.id && (
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2">
                                Role
                            </label>
                            <select
                                value={formData.role || 'user'}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                className="w-full px-4 py-3 glass-input rounded-xl text-white"
                            >
                                <option value="user" className="bg-[#0a0a1a]">User</option>
                                <option value="manager" className="bg-[#0a0a1a]">Manager</option>
                                <option value="admin" className="bg-[#0a0a1a]">Admin</option>
                            </select>
                            <p className="text-xs text-white/30 mt-2">
                                Admin: Full access | Manager: Content management | User: Basic access
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2">
                                Level
                            </label>
                            <input
                                type="number"
                                value={formData.level || 1}
                                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 glass-input rounded-xl text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2">
                                Total Points
                            </label>
                            <input
                                type="number"
                                value={formData.total_points || 0}
                                onChange={(e) => setFormData({ ...formData, total_points: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 glass-input rounded-xl text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            Experience Level
                        </label>
                        <select
                            value={formData.experience_level || ''}
                            onChange={(e) => setFormData({ ...formData, experience_level: e.target.value as User['experience_level'] })}
                            className="w-full px-4 py-3 glass-input rounded-xl text-white"
                        >
                            <option value="" className="bg-[#0a0a1a]">Select...</option>
                            <option value="beginner" className="bg-[#0a0a1a]">Beginner</option>
                            <option value="intermediate" className="bg-[#0a0a1a]">Intermediate</option>
                            <option value="advanced" className="bg-[#0a0a1a]">Advanced</option>
                            <option value="expert" className="bg-[#0a0a1a]">Expert</option>
                        </select>
                    </div>

                    {canManageRoles && (
                        <div className="flex items-center gap-3 p-4 glass-input rounded-xl">
                            <input
                                type="checkbox"
                                id="is_event_creator"
                                checked={formData.is_event_creator || false}
                                onChange={(e) => setFormData({ ...formData, is_event_creator: e.target.checked })}
                                className="w-5 h-5 rounded border-purple-500/30 bg-transparent text-purple-600 focus:ring-purple-500"
                            />
                            <label htmlFor="is_event_creator" className="text-sm text-white/80">
                                <span className="font-semibold flex items-center gap-2">
                                    <Star className="w-4 h-4 text-amber-400" /> Guild Leader
                                </span>
                                <p className="text-xs text-white/40">Can create guilds and organize free events</p>
                            </label>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => setEditingUser(null)}
                            className="px-6 py-2.5 text-white/60 hover:text-white transition-colors rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2.5 btn-cosmic rounded-xl font-bold text-white"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
