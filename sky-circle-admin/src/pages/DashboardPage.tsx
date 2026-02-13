import { useEffect } from 'react'
import { useAdminStore } from '../store/adminStore'
import {
    Users,
    Telescope,
    Calendar,
    Target,
    AlertTriangle,
    TrendingUp,
    Loader2
} from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e']

export function DashboardPage() {
    const { stats, observations, fetchStats, fetchObservations, isLoading } = useAdminStore()

    useEffect(() => {
        fetchStats()
        fetchObservations()
    }, [fetchStats, fetchObservations])

    if (isLoading && !stats) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
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
        { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'bg-blue-500' },
        { label: 'Observations', value: stats?.totalObservations || 0, icon: Telescope, color: 'bg-purple-500' },
        { label: 'Events', value: stats?.totalEvents || 0, icon: Calendar, color: 'bg-green-500' },
        { label: 'Active Missions', value: stats?.activeMissions || 0, icon: Target, color: 'bg-orange-500' },
        { label: 'Reported Posts', value: stats?.reportedPosts || 0, icon: AlertTriangle, color: 'bg-red-500' },
        { label: 'New Users (7d)', value: stats?.newUsersThisWeek || 0, icon: TrendingUp, color: 'bg-indigo-500' },
    ]

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <div
                            key={stat.label}
                            className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                        >
                            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-2xl font-bold text-white">{stat.value}</div>
                            <div className="text-sm text-slate-400">{stat.label}</div>
                        </div>
                    )
                })}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Observations Chart */}
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Observations (Last 7 Days)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="observations" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Observations by Category</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                >
                                    {categoryData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Observations</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-slate-400 text-sm">
                                <th className="pb-3 font-medium">Object</th>
                                <th className="pb-3 font-medium">Category</th>
                                <th className="pb-3 font-medium">User</th>
                                <th className="pb-3 font-medium">Date</th>
                                <th className="pb-3 font-medium">Points</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-300">
                            {observations.slice(0, 5).map((obs) => (
                                <tr key={obs.id} className="border-t border-slate-700">
                                    <td className="py-3">{obs.object_name}</td>
                                    <td className="py-3">
                                        <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-sm">
                                            {obs.category}
                                        </span>
                                    </td>
                                    <td className="py-3">{obs.user?.display_name || 'Unknown'}</td>
                                    <td className="py-3">{new Date(obs.observation_date).toLocaleDateString()}</td>
                                    <td className="py-3 text-yellow-400">+{obs.points_awarded}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
