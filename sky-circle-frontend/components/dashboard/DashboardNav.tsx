'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/userStore'
import { useAlertStore } from '@/store/alertStore'
import {
    Telescope,
    LayoutDashboard,
    Eye,
    Calendar,
    Trophy,
    Users,
    User,
    Bell,
    LogOut,
    Sparkles,
    Menu,
    X
} from 'lucide-react'
import { useEffect, useState } from 'react'

export default function DashboardNav() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { user, profile, setUser, setProfile } = useUserStore()
    const { unreadCount } = useAlertStore()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
            setUser(user)
            if (user) {
                supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                    .then(({ data }: { data: any }) => {
                        if (data) setProfile(data)
                    })
            }
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/observations', label: 'Observations', icon: Eye },
        { href: '/dashboard/events', label: 'Events', icon: Calendar },
        { href: '/dashboard/missions', label: 'Missions', icon: Trophy },
        { href: '/dashboard/community', label: 'Community', icon: Users },
    ]

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50">
                {/* Frosted glass header */}
                <div className="mx-4 mt-4">
                    <div className="glass-effect rounded-2xl px-4 py-3">
                        <div className="flex items-center justify-between">
                            {/* Logo */}
                            <Link href="/dashboard" className="flex items-center gap-3 group">
                                <div className="relative">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-200 via-danger-100 to-secondary-200 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-[0_0_20px_rgba(125,73,248,0.4)]">
                                        <Telescope className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3">
                                        <Sparkles className="w-3 h-3 text-warning-100 animate-pulse" />
                                    </div>
                                </div>
                                <div className="hidden sm:block">
                                    <span className="font-black text-lg tracking-tight text-surface-50 block leading-none">The Sky Circle</span>
                                    <span className="text-[9px] font-bold text-surface-400 uppercase tracking-[0.2em]">Look up. Stay curious.</span>
                                </div>
                            </Link>

                            {/* Desktop Nav Items */}
                            <div className="hidden md:flex items-center gap-1 glass-inner rounded-xl p-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon
                                    const isActive = pathname === item.href
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 ${isActive
                                                ? 'bg-gradient-to-r from-primary-200/30 to-danger-100/20 text-surface-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                                                : 'text-surface-400 hover:text-surface-50 hover:bg-white/5'
                                                }`}
                                        >
                                            <Icon className={`w-4 h-4 ${isActive ? 'text-primary-200' : ''}`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                                        </Link>
                                    )
                                })}
                            </div>

                            {/* Right Section */}
                            <div className="flex items-center gap-2">
                                {/* Points Badge */}
                                {profile && (
                                    <div className="hidden sm:flex items-center gap-2 glass-inner rounded-xl px-3 py-2">
                                        <div className="w-6 h-6 rounded-lg bg-warning-100/20 flex items-center justify-center">
                                            <Trophy className="w-3.5 h-3.5 text-warning-100" />
                                        </div>
                                        <span className="text-xs font-black text-surface-50">{profile.total_points?.toLocaleString() || 0}</span>
                                    </div>
                                )}

                                {/* Alerts */}
                                <Link
                                    href="/dashboard/alerts"
                                    className="relative p-2.5 rounded-xl glass-inner hover:bg-white/10 transition-all text-surface-400 hover:text-surface-50 group"
                                >
                                    <Bell className="w-5 h-5 group-hover:animate-[wiggle_0.3s_ease-in-out]" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger-100 rounded-full shadow-[0_0_8px_rgba(241,24,86,0.8)] animate-pulse" />
                                    )}
                                </Link>

                                {/* Profile */}
                                <Link
                                    href="/dashboard/profile"
                                    className="p-2.5 rounded-xl glass-inner hover:bg-white/10 transition-all text-surface-400 hover:text-surface-50"
                                >
                                    {profile?.profile_photo_url ? (
                                        <img src={profile.profile_photo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                                    ) : (
                                        <User className="w-5 h-5" />
                                    )}
                                </Link>

                                {/* Sign Out */}
                                <button
                                    onClick={handleSignOut}
                                    className="hidden sm:flex p-2.5 rounded-xl glass-inner hover:bg-danger-200/20 transition-all text-surface-500 hover:text-danger-200"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>

                                {/* Mobile Menu Toggle */}
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="md:hidden p-2.5 rounded-xl glass-inner hover:bg-white/10 transition-all text-surface-400"
                                >
                                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden mx-4 mt-2">
                        <div className="glass-effect rounded-2xl p-4 space-y-2">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                            ? 'bg-gradient-to-r from-primary-200/30 to-danger-100/20 text-surface-50'
                                            : 'text-surface-400 hover:text-surface-50 hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-primary-200' : ''}`} />
                                        <span className="text-sm font-bold">{item.label}</span>
                                    </Link>
                                )
                            })}
                            <div className="border-t border-white/10 pt-2 mt-2">
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-danger-200 hover:bg-danger-200/10 transition-all w-full"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="text-sm font-bold">Sign Out</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Spacer for fixed header */}
            <div className="h-24" />
        </>
    )
}
