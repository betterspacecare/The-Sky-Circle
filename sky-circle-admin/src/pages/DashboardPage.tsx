import { useEffect } from 'react'
import { useAdminStore } from '../store/adminStore'
import {
    Users,
    Telescope,
    Calendar,
    Target,
    AlertTriangle,
    TrendingUp,
    Loader2,
    Sparkles,
    Star,
    Rocket
} from 'lucide-react'
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts'

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#06b6d4', '#f59e0b', '#10b981']

export function DashboardPage() {
    const { stats, observations, fetchStats, fetchObservations, isLoading } = useAdminStore()

    useEffect(() => {
        fetchStats()
        fetchObservations()
    }, [fetchStats, fetchObservations])

    if (isLoading && !stats) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                    <p className="text-white/40 font-medium">Loading mission data...</p>
                </div>
            </div>
        )
    }

    // Calculate category distribution
    const categoryData = observations.reduce((acc, obs) => {
        const existing = acc.find(item => item.name === obs.category)
        if (existing) {
            existing.value++
        } else {
            acc.push({ name: obs.category, value: 1 })
        }
        return acc
    }, [] as { name: string; value: number }[])

    // Calculate observations by day (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return date.toISOString().split('T')[0]
    })

    const dailyData = last7Days.map(date => {
        const count = observations.filter(obs => 
            obs.created_at.split('T')[0] === date
        ).length
        return {
            date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            observations: count
        }
    })

    const statCards = [
        { label: 'Total Explorers', value: stats?.totalUsers || 0, icon: Users, gradient: 'from-purple-500 to-pink-500' },
        { label: 'Observations', value: stats?.totalObservations || 0, icon: Telescope, gradient: 'from-blue-500 to-cyan-500' },
        { label: 'Events', value: stats?.totalEvents || 0, icon: Calendar, gradient: 'from-green-500 to-emerald-500' },
        { label: 'Active Missions', value: stats?.activeMissions || 0, icon: Target, gradient: 'from-orange-500 to-amber-500' },
        { label: 'Reported Posts', value: stats?.reportedPosts || 0, icon: AlertTriangle, gradient: 'from-red-500 to-rose-500' },
        { label: 'New Explorers', value: stats?.newUsersThisWeek || 0, icon: TrendingUp, gradient: 'from-indigo-500 to-purple-500' },
        { label: 'Total Follows', value: stats?.totalFollows || 0, icon: Users, gradient: 'from-cyan-500 to-blue-500' },
        { label: 'User Gears', value: stats?.totalGears || 0, icon: Star, gradient: 'from-pink-500 to-purple-500' },
        { label: 'Interests', value: stats?.totalInterests || 0, icon: Sparkles, gradient: 'from-amber-500 to-yellow-500' },
    ]

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Rocket className="w-5 h-5 text-purple-400" />
                            <span className="text-purple-400 font-bold text-sm tracking-wider uppercase">Mission Control</span>
                        </div>
                        <h2 className="text-3xl font-black text-gradient mb-2">Welcome to Command Center</h2>
                        <p className="text-white/40 max-w-lg">
                            Monitor your astronomy community, manage events, and track celestial discoveries across the galaxy.
                        </p>
                    </div>
                    <Sparkles className="w-24 h-24 text-purple-500/20 hidden lg:block" />
                </div>
            </div>

            {/* Stats Grid - Core Metrics */}
            <div>
                <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Core Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {statCards.slice(0, 6).map((stat) => {
                        const Icon = stat.icon
                        return (
                            <div
                                key={stat.label}
                                className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all duration-300"
                            >
                                <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center mb-3 group-hover:shadow-lg group-hover:shadow-purple-500/20 transition-all`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                                <div className="text-xs text-white/40 font-medium uppercase tracking-wider">{stat.label}</div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Stats Grid - Social Features */}
            <div>
                <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Social Features
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {statCards.slice(6).map((stat) => {
                        const Icon = stat.icon
                        return (
                            <div
                                key={stat.label}
                                className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all duration-300"
                            >
                                <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center mb-3 group-hover:shadow-lg group-hover:shadow-purple-500/20 transition-all`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                                <div className="text-xs text-white/40 font-medium uppercase tracking-wider">{stat.label}</div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Observations Chart */}
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Star className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-bold text-white">Observations (Last 7 Days)</h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyData}>
                                <defs>
                                    <linearGradient id="colorObs" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(10, 10, 26, 0.95)',
                                        border: '1px solid rgba(139, 92, 246, 0.3)',
                                        borderRadius: '12px',
                                        boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)'
                                    }}
                                    labelStyle={{ color: '#fff' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="observations" 
                                    stroke="#8b5cf6" 
                                    strokeWidth={2}
                                    fillOpacity={1} 
                                    fill="url(#colorObs)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Telescope className="w-5 h-5 text-pink-400" />
                        <h3 className="text-lg font-bold text-white">Observations by Category</h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                    labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                                >
                                    {categoryData.map((_, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={COLORS[index % COLORS.length]}
                                            stroke="rgba(0,0,0,0.3)"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(10, 10, 26, 0.95)',
                                        border: '1px solid rgba(139, 92, 246, 0.3)',
                                        borderRadius: '12px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-bold text-white">Recent Discoveries</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-white/40 text-xs uppercase tracking-wider">
                                <th className="pb-4 font-semibold">Celestial Object</th>
                                <th className="pb-4 font-semibold">Category</th>
                                <th className="pb-4 font-semibold">Explorer</th>
                                <th className="pb-4 font-semibold">Date</th>
                                <th className="pb-4 font-semibold">Points</th>
                            </tr>
                        </thead>
                        <tbody className="text-white/80">
                            {observations.slice(0, 5).map((obs) => (
                                <tr key={obs.id} className="border-t border-purple-500/10 hover:bg-purple-500/5 transition-colors">
                                    <td className="py-4 font-medium">{obs.object_name}</td>
                                    <td className="py-4">
                                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold">
                                            {obs.category}
                                        </span>
                                    </td>
                                    <td className="py-4 text-white/60">{obs.user?.display_name || 'Unknown'}</td>
                                    <td className="py-4 text-white/60">{new Date(obs.observation_date).toLocaleDateString()}</td>
                                    <td className="py-4">
                                        <span className="text-amber-400 font-bold">+{obs.points_awarded}</span>
                                    </td>
                                </tr>
                            ))}
                            {observations.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-white/30">
                                        No observations recorded yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
