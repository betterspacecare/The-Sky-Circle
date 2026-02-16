'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/userStore'
import { useNotificationStore } from '@/store/notificationStore'
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
    X,
    UsersRound,
    Newspaper
} from 'lucide-react'
import { useEffect, useState } from 'react'

export default function DashboardNav() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { profile, setUser, setProfile } = useUserStore()
    const { unreadCount: alertUnreadCount } = useAlertStore()
    const { unreadCount: notificationUnreadCount } = useNotificationStore()
    const totalUnread = alertUnreadCount + notificationUnreadCount
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        let channel: ReturnType<typeof supabase.channel> | null = null
        
        supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
            setUser(user)
            if (user) {
                supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle()
                    .then(({ data, error }: { data: any; error: any }) => {
                        if (error) {
                            console.warn('Could not fetch user profile:', error.message)
                            return
                        }
                        if (data) setProfile(data)
                    })
                
                // Subscribe to realtime notifications for badge count
                channel = supabase
                    .channel('nav-notifications')
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'notifications',
                            filter: `user_id=eq.${user.id}`
                        },
                        () => {
                            // Increment unread count when new notification arrives
                            useNotificationStore.setState((state) => ({
                                unreadCount: state.unreadCount + 1
                            }))
                        }
                    )
                    .subscribe()
            }
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
            setUser(session?.user ?? null)
        })

        return () => {
            subscription.unsubscribe()
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [])

    // Close menu on route change
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [pathname])

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [mobileMenuOpen])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const navItems = [
        // Core
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        
        // Content & Activity
        { href: '/dashboard/observations', label: 'Observations', icon: Eye },
        { href: '/dashboard/sky-finder', label: 'Sky Finder', icon: Telescope },
        { href: '/dashboard/timeline', label: 'Timeline', icon: Newspaper },
        { href: '/dashboard/events', label: 'Events', icon: Calendar },
        
        // Social & Community
        { href: '/dashboard/discover', label: 'Discover', icon: Users },
        { href: '/dashboard/groups', label: 'Guilds', icon: UsersRound },
        
        // Gamification
        { href: '/dashboard/missions', label: 'Missions', icon: Trophy },
    ]

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50">
                {/* Header bar */}
                <div className="mx-4 mt-4">
                    <div className="bg-[#0a0e17]/95 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/10">
                        <div className="flex items-center justify-between">
                            {/* Logo */}
                            <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 group">
                                <div className="relative">
                                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-primary-200 via-danger-100 to-secondary-200 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-[0_0_20px_rgba(125,73,248,0.4)]">
                                        <Telescope className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3">
                                        <Sparkles className="w-3 h-3 text-warning-100 animate-pulse" />
                                    </div>
                                </div>
                                <div className="hidden xs:block sm:block">
                                    <span className="font-black text-base sm:text-lg tracking-tight text-surface-50 block leading-none">SkyGuild</span>
                                    <span className="text-[8px] sm:text-[9px] font-bold text-surface-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] hidden sm:block">Look up. Stay curious.</span>
                                </div>
                            </Link>

                            {/* Desktop & Tablet Nav Items */}
                            <div className="hidden lg:flex items-center gap-1 bg-white/5 rounded-xl p-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon
                                    const isActive = pathname === item.href
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-2 px-3 xl:px-4 py-2.5 rounded-lg transition-all duration-300 ${isActive
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
                                    <div className="hidden xs:flex sm:flex items-center gap-1.5 sm:gap-2 bg-white/5 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2">
                                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-warning-100/20 flex items-center justify-center">
                                            <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-warning-100" />
                                        </div>
                                        <span className="text-[10px] sm:text-xs font-black text-surface-50">{profile.total_points?.toLocaleString() || 0}</span>
                                    </div>
                                )}

                                {/* Alerts */}
                                <Link
                                    href="/dashboard/alerts"
                                    className="relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 transition-all text-surface-400 hover:text-surface-50 group"
                                >
                                    <Bell className="w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-[wiggle_0.3s_ease-in-out]" />
                                    {totalUnread > 0 && (
                                        <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-danger-100 rounded-full shadow-[0_0_8px_rgba(241,24,86,0.8)] animate-pulse" />
                                    )}
                                </Link>

                                {/* Profile */}
                                <Link
                                    href="/dashboard/profile"
                                    className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 transition-all text-surface-400 hover:text-surface-50"
                                >
                                    {profile?.profile_photo_url ? (
                                        <img src={profile.profile_photo_url} alt="" className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover" />
                                    ) : (
                                        <User className="w-4 h-4 sm:w-5 sm:h-5" />
                                    )}
                                </Link>

                                {/* Sign Out - Desktop only */}
                                <button
                                    onClick={handleSignOut}
                                    className="hidden sm:flex p-2.5 rounded-xl bg-white/5 hover:bg-danger-200/20 transition-all text-surface-500 hover:text-danger-200"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>

                                {/* Mobile & Tablet Menu Toggle */}
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="lg:hidden p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-surface-400"
                                >
                                    <Menu className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile & Tablet Slide-in Menu */}
            <div 
                className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setMobileMenuOpen(false)}
                />
                
                {/* Slide-in Panel */}
                <div 
                    className={`absolute top-0 right-0 h-full w-72 bg-[#0a0e17] border-l border-white/10 transform transition-transform duration-300 ease-out ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <span className="font-bold text-lg">Menu</span>
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* User Info */}
                    {profile && (
                        <div className="p-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5">
                                    {profile.profile_photo_url ? (
                                        <img src={profile.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-white/30" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{profile.display_name || 'Stargazer'}</p>
                                    <div className="flex items-center gap-1 text-warning-100">
                                        <Trophy className="w-3 h-3" />
                                        <span className="text-xs font-medium">{profile.total_points?.toLocaleString() || 0} pts</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Nav Items */}
                    <div className="p-3 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-gradient-to-r from-primary-200/20 to-danger-100/10 text-surface-50'
                                        : 'text-surface-400 hover:text-surface-50 hover:bg-white/5'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary-200' : ''}`} />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </Link>
                            )
                        })}
                    </div>

                    {/* Bottom Actions */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                        <button
                            onClick={() => {
                                setMobileMenuOpen(false)
                                handleSignOut()
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-danger-200 bg-danger-200/10 hover:bg-danger-200/20 transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="text-sm font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Spacer for fixed header */}
            <div className="h-24" />
        </>
    )
}
