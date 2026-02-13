import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import {
    LayoutDashboard,
    Users,
    Telescope,
    Calendar,
    Target,
    Award,
    Image,
    Bell,
    UserPlus,
    LogOut,
    Menu,
    X,
    Moon,
    Shield,
    ShieldCheck,
    UsersRound,
    ClipboardList
} from 'lucide-react'

interface LayoutProps {
    children: React.ReactNode
    currentPage: string
    onNavigate: (page: string) => void
}

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    { id: 'users', label: 'Users', icon: Users, permission: 'users.view' },
    { id: 'applications', label: 'Applications', icon: ClipboardList, permission: 'users.manage_roles' },
    { id: 'groups', label: 'Guilds', icon: UsersRound, permission: 'events.view' },
    { id: 'observations', label: 'Observations', icon: Telescope, permission: 'observations.view' },
    { id: 'events', label: 'Events', icon: Calendar, permission: 'events.view' },
    { id: 'missions', label: 'Missions', icon: Target, permission: 'missions.view' },
    { id: 'badges', label: 'Badges', icon: Award, permission: 'badges.view' },
    { id: 'posts', label: 'Posts', icon: Image, permission: 'posts.view' },
    { id: 'alerts', label: 'Sky Alerts', icon: Bell, permission: 'alerts.view' },
    { id: 'referrals', label: 'Referrals', icon: UserPlus, permission: 'referrals.view' },
]

const roleColors = {
    admin: 'bg-red-500/20 text-red-400 border-red-500/30',
    manager: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    user: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
}

const roleLabels = {
    admin: 'Administrator',
    manager: 'Manager',
    user: 'User'
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { signOut, user, profile, role, hasPermission } = useAuthStore()

    // Filter nav items based on permissions
    const visibleNavItems = navItems.filter(item => hasPermission(item.permission))

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-50 h-full w-64 bg-slate-800 border-r border-slate-700
                transform transition-transform duration-200 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}>
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                        <Moon className="w-8 h-8 text-indigo-400" />
                        <span className="text-xl font-bold text-white">SkyGuild</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-slate-400 hover:text-white cursor-pointer"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {visibleNavItems.map((item) => {
                        const Icon = item.icon
                        const isActive = currentPage === item.id
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onNavigate(item.id)
                                    setSidebarOpen(false)
                                }}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
                                    transition-colors duration-150
                                    ${isActive
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }
                                `}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </button>
                        )
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
                    {/* User info with role badge */}
                    <div className="mb-3">
                        <div className="text-sm text-white font-medium truncate">
                            {profile?.display_name || user?.email}
                        </div>
                        <div className="text-xs text-slate-400 truncate mb-2">
                            {user?.email}
                        </div>
                        {role && (
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${roleColors[role]}`}>
                                {role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                {roleLabels[role]}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={signOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-slate-800/80 backdrop-blur border-b border-slate-700">
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-slate-400 hover:text-white cursor-pointer"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg font-semibold text-white capitalize">
                            {currentPage === 'dashboard' ? 'Admin Dashboard' : currentPage}
                        </h1>
                        <div className="flex items-center gap-2">
                            {role && (
                                <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${roleColors[role]}`}>
                                    {role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                    {roleLabels[role]}
                                </span>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
