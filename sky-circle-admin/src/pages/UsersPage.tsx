import { useEffect, useState } from 'react'
import { useAdminStore } from '../store/adminStore'
import { useAuthStore } from '../store/authStore'
import { Modal } from '../components/Modal'
import type { User, UserRole } from '../types/database.types'
import { Search, Edit2, Trash2, Loader2, Shield, ShieldCheck, UserCircle } from 'lucide-react'

const roleColors = {
    admin: 'bg-red-500/20 text-red-400 border-red-500/30',
    manager: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    user: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
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
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                    <option value="all">All Roles</option>
                    <option value="admin">Admins</option>
                    <option value="manager">Managers</option>
                    <option value="user">Users</option>
                </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <div className="text-2xl font-bold text-white">{users.length}</div>
                    <div className="text-sm text-slate-400">Total Users</div>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <div className="text-2xl font-bold text-red-400">{users.filter(u => u.role === 'admin').length}</div>
                    <div className="text-sm text-slate-400">Admins</div>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <div className="text-2xl font-bold text-amber-400">{users.filter(u => u.role === 'manager').length}</div>
                    <div className="text-sm text-slate-400">Managers</div>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <div className="text-2xl font-bold text-slate-300">{users.filter(u => !u.role || u.role === 'user').length}</div>
                    <div className="text-sm text-slate-400">Members</div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700/50">
                                <tr className="text-left text-slate-300 text-sm">
                                    <th className="px-4 py-3 font-medium">User</th>
                                    <th className="px-4 py-3 font-medium">Email</th>
                                    <th className="px-4 py-3 font-medium">Role</th>
                                    <th className="px-4 py-3 font-medium">Level</th>
                                    <th className="px-4 py-3 font-medium">Points</th>
                                    <th className="px-4 py-3 font-medium">Joined</th>
                                    <th className="px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {user.profile_photo_url ? (
                                                    <img
                                                        src={user.profile_photo_url}
                                                        alt=""
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm">
                                                        {user.display_name?.[0] || user.email[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="block">{user.display_name || 'No name'}</span>
                                                    {user.id === currentUser?.id && (
                                                        <span className="text-xs text-indigo-400">(You)</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400">{user.email}</td>
                                        <td className="px-4 py-3">
                                            {canManageRoles && user.id !== currentUser?.id ? (
                                                <select
                                                    value={user.role || 'user'}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                                    className={`px-2 py-1 rounded text-xs font-medium border cursor-pointer ${roleColors[user.role as keyof typeof roleColors || 'user']} bg-transparent`}
                                                >
                                                    <option value="user" className="bg-slate-800">User</option>
                                                    <option value="manager" className="bg-slate-800">Manager</option>
                                                    <option value="admin" className="bg-slate-800">Admin</option>
                                                </select>
                                            ) : (
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${roleColors[user.role as keyof typeof roleColors || 'user']}`}>
                                                    {getRoleIcon(user.role)}
                                                    {roleLabels[user.role as keyof typeof roleLabels || 'user']}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-sm">
                                                Lvl {user.level}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-yellow-400">{user.total_points}</td>
                                        <td className="px-4 py-3 text-slate-400">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {canEditUsers && (
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="p-1 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {canDeleteUsers && user.id !== currentUser?.id && (
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="p-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
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
                title="Edit User"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={formData.display_name || ''}
                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    
                    {canManageRoles && editingUser?.id !== currentUser?.id && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Role
                            </label>
                            <select
                                value={formData.role || 'user'}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                                <option value="user">User</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                            <p className="text-xs text-slate-400 mt-1">
                                Admin: Full access | Manager: Content management | User: Basic access
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Level
                            </label>
                            <input
                                type="number"
                                value={formData.level || 1}
                                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Total Points
                            </label>
                            <input
                                type="number"
                                value={formData.total_points || 0}
                                onChange={(e) => setFormData({ ...formData, total_points: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Experience Level
                        </label>
                        <select
                            value={formData.experience_level || ''}
                            onChange={(e) => setFormData({ ...formData, experience_level: e.target.value as User['experience_level'] })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                            <option value="">Select...</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="expert">Expert</option>
                        </select>
                    </div>

                    {canManageRoles && (
                        <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                            <input
                                type="checkbox"
                                id="is_event_creator"
                                checked={formData.is_event_creator || false}
                                onChange={(e) => setFormData({ ...formData, is_event_creator: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <label htmlFor="is_event_creator" className="text-sm text-slate-300 cursor-pointer">
                                <span className="font-medium">Guild Leader</span>
                                <p className="text-xs text-slate-400">Can create guilds and organize free events</p>
                            </label>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => setEditingUser(null)}
                            className="px-4 py-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
