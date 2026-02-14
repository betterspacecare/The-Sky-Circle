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
    Sparkles,
    Shield,
    ShieldCheck,
    UsersRound,
    ClipboardList,
    Star,
    MessageSquare
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
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, permission: 'dashboard.view' },
]

const roleColors = {
    admin: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30',
    manager: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30',
    user: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
}

const roleLabels = {
    admin: 'Administrator',
    manager: 'Manager',
    user: 'User'
}

// Generate random stars
function generateStars(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        size: Math.random() * 2 + 1
    }))
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { signOut, user, profile, role, hasPermission } = useAuthStore()
    const [stars] = useState(() => generateStars(50))

    // Filter nav items based on permissions
    const visibleNavItems = navItems.filter(item => hasPermission(item.permission))

    return (
        <div className="min-h-screen nebula-bg relative overflow-hidden">
            {/* Animated Stars */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {stars.map(star => (
                    <div
                        key={star.id}
                        className="star"
                        style={{
                            left: `${star.left}%`,
                            top: `${star.top}%`,
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            animationDelay: `${star.delay}s`
                        }}
                    />
                ))}
            </div>

            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-50 h-full w-64 
                glass-card
                transform transition-transform duration-300 ease-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}>
                {/* Logo */}
                <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Sparkles className="w-8 h-8 text-purple-400" />
                            <div className="absolute inset-0 blur-lg bg-purple-500/30" />
                        </div>
                        <div>
                            <span className="text-xl font-black text-gradient">SkyGuild</span>
                            <span className="block text-[10px] text-purple-400/60 font-bold tracking-widest">ADMIN PANEL</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-white/50 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
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
                                    w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
                                    transition-all duration-200 group
                                    ${isActive
                                        ? 'btn-cosmic text-white shadow-lg'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }
                                `}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? '' : 'group-hover:text-purple-400'}`} />
                                <span className="font-medium">{item.label}</span>
                                {isActive && <Star className="w-3 h-3 ml-auto" />}
                            </button>
                        )
                    })}
                </nav>

                {/* User Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-purple-500/20 bg-black/20">
                    <div className="mb-3">
                        <div className="text-sm text-white font-semibold truncate">
                            {profile?.display_name || user?.email?.split('@')[0]}
                        </div>
                        <div className="text-xs text-white/40 truncate mb-2">
                            {user?.email}
                        </div>
                        {role && (
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${roleColors[role]}`}>
                                {role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                {roleLabels[role]}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={signOut}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                            bg-red-500/10 text-red-400 hover:bg-red-500/20 
                            rounded-xl transition-all font-medium border border-red-500/20"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64 relative z-10">
                {/* Top bar */}
                <header className="sticky top-0 z-30 glass-effect border-b border-purple-500/10">
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden text-white/60 hover:text-white transition-colors"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-gradient capitalize">
                                    {currentPage === 'dashboard' ? 'Mission Control' : currentPage}
                                </h1>
                                <p className="text-[10px] text-white/30 font-bold tracking-widest uppercase">
                                    {currentPage === 'dashboard' ? 'Overview & Analytics' : `Manage ${currentPage}`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {role && (
                                <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${roleColors[role]}`}>
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
