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
    MessageSquare,
    Package,
    UserCheck,
    Tag,
    Zap,
    Key
} from 'lucide-react'

interface LayoutProps {
    children: React.ReactNode
    currentPage: string
    onNavigate: (page: string) => void
}

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view', section: 'main' },
    { id: 'users', label: 'Users', icon: Users, permission: 'users.view', section: 'main' },
    { id: 'applications', label: 'Applications', icon: ClipboardList, permission: 'users.manage_roles', section: 'main' },
    { id: 'groups', label: 'Guilds', icon: UsersRound, permission: 'events.view', section: 'main' },
    { id: 'observations', label: 'Observations', icon: Telescope, permission: 'observations.view', section: 'content' },
    { id: 'events', label: 'Events', icon: Calendar, permission: 'events.view', section: 'content' },
    { id: 'missions', label: 'Missions', icon: Target, permission: 'missions.view', section: 'content' },
    { id: 'badges', label: 'Badges', icon: Award, permission: 'badges.view', section: 'content' },
    { id: 'posts', label: 'Posts', icon: Image, permission: 'posts.view', section: 'content' },
    { id: 'alerts', label: 'Sky Alerts', icon: Bell, permission: 'alerts.view', section: 'content' },
    { id: 'gears', label: 'User Gears', icon: Package, permission: 'dashboard.view', section: 'social' },
    { id: 'follows', label: 'Follows', icon: UserCheck, permission: 'dashboard.view', section: 'social' },
    { id: 'interests', label: 'Interests', icon: Tag, permission: 'dashboard.view', section: 'social' },
    { id: 'webhooks', label: 'Webhooks', icon: Zap, permission: 'dashboard.view', section: 'automation' },
    { id: 'api-keys', label: 'API Keys', icon: Key, permission: 'dashboard.view', section: 'automation' },
    { id: 'referrals', label: 'Referrals', icon: UserPlus, permission: 'referrals.view', section: 'other' },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, permission: 'dashboard.view', section: 'other' },
]

const sectionLabels = {
    main: 'Main',
    content: 'Content',
    social: 'Social',
    automation: 'Automation',
    other: 'Other'
}

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

    // Filter nav items based on permissions and group by section
    const visibleNavItems = navItems.filter(item => hasPermission(item.permission))
    const groupedNavItems = visibleNavItems.reduce((acc, item) => {
        if (!acc[item.section]) {
            acc[item.section] = []
        }
        acc[item.section].push(item)
        return acc
    }, {} as Record<string, typeof navItems>)

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
                fixed top-0 left-0 z-50 h-full w-72
                glass-card border-r border-purple-500/10
                transform transition-transform duration-300 ease-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}>
                {/* Logo */}
                <div className="flex items-center justify-between p-5 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                    <div className="flex items-center gap-3">
                        <img 
                            src="/SkyGuild_Icon.png" 
                            alt="SkyGuild Admin" 
                            className="w-8 h-8 object-contain"
                        />
                        <div>
                            <span className="text-sm font-black text-white uppercase tracking-wider">Admin</span>
                            <span className="block text-[8px] text-purple-400/60 font-black tracking-[0.2em]">MISSION CONTROL</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-white/50 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-240px)] custom-scrollbar">
                    {Object.entries(groupedNavItems).map(([section, items]) => (
                        <div key={section} className="mb-3">
                            {/* Section Label */}
                            <div className="px-4 py-2 mb-1 flex items-center gap-2">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">
                                    {sectionLabels[section as keyof typeof sectionLabels]}
                                </span>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                            </div>
                            
                            {/* Section Items */}
                            <div className="space-y-1">
                                {items.map((item) => {
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
                                                transition-all duration-200 group relative overflow-hidden
                                                ${isActive
                                                    ? 'btn-cosmic text-white shadow-lg shadow-purple-500/20 scale-[1.02]'
                                                    : 'text-white/60 hover:text-white hover:bg-white/5 hover:scale-[1.01]'
                                                }
                                            `}
                                        >
                                            {/* Active indicator */}
                                            {isActive && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-lg shadow-white/50" />
                                            )}
                                            
                                            <Icon className={`w-5 h-5 ${isActive ? '' : 'group-hover:text-purple-400'} transition-colors`} />
                                            <span className="font-semibold text-sm">{item.label}</span>
                                            
                                            {/* Active star */}
                                            {isActive && (
                                                <Star className="w-3.5 h-3.5 ml-auto animate-pulse" fill="currentColor" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* User Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-purple-500/20 bg-gradient-to-t from-black/40 to-transparent backdrop-blur-sm">
                    <div className="mb-3">
                        <div className="flex items-center gap-3 mb-3">
                            {profile?.profile_photo_url ? (
                                <img
                                    src={profile.profile_photo_url}
                                    alt=""
                                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/30"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                    {profile?.display_name?.[0] || user?.email?.[0].toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-white font-semibold truncate">
                                    {profile?.display_name || user?.email?.split('@')[0]}
                                </div>
                                <div className="text-xs text-white/40 truncate">
                                    {user?.email}
                                </div>
                            </div>
                        </div>
                        {role && (
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${roleColors[role]}`}>
                                {role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                {roleLabels[role]}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={signOut}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                            bg-red-500/10 text-red-400 hover:bg-red-500/20 
                            rounded-xl transition-all font-semibold border border-red-500/20
                            hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-72 relative z-10">
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
