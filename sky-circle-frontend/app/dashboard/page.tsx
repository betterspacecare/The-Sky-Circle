import { createClient } from '@/lib/supabase/server'
import StatsWidget from '@/components/dashboard/StatsWidget'
import BadgeShowcase from '@/components/dashboard/BadgeShowcase'
import ProgressCard from '@/components/dashboard/ProgressCard'
import UpcomingEvents from '@/components/dashboard/UpcomingEvents'
import MissionCard from '@/components/dashboard/MissionCard'
import ReferralCard from '@/components/dashboard/ReferralCard'
import RecentPhotos from '@/components/dashboard/RecentPhotos'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    // Fetch user stats
    const { count: observationCount } = await supabase
        .from('observations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

    const { data: badges } = await supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', user.id)

    const { data: upcomingEvents } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(3)

    const { data: activeMissions } = await supabase
        .from('missions')
        .select('*, mission_requirements(*)')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .limit(1)
        .single()

    const { data: recentPosts } = await supabase
        .from('posts')
        .select('*, users(display_name, profile_photo_url)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(6)

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Welcome Header */}
            <div>
                <h1 className="text-2xl sm:text-4xl font-bold mb-2 text-white">
                    Welcome back, {profile?.display_name || 'Stargazer'}! 🌟
                </h1>
                <p className="text-white/60 text-sm sm:text-base">
                    Look up. Stay curious.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <StatsWidget
                    title="Total Points"
                    value={profile?.total_points || 0}
                    icon="trophy"
                    gradient="from-cosmic-purple to-cosmic-pink"
                />
                <StatsWidget
                    title="Current Level"
                    value={profile?.level || 1}
                    icon="star"
                    gradient="from-cosmic-gold via-orange-400 to-red-500"
                />
                <StatsWidget
                    title="Observations"
                    value={observationCount || 0}
                    icon="eye"
                    gradient="from-cosmic-blue to-purple-500"
                />
                <StatsWidget
                    title="Badges Earned"
                    value={badges?.length || 0}
                    icon="award"
                    gradient="from-cosmic-pink to-orange-500"
                />
            </div>

            {/* Progress Card */}
            <ProgressCard profile={profile} />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Left Column - 2/3 width */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    {/* Badge Showcase */}
                    <BadgeShowcase userId={user.id} earnedBadges={badges || []} />

                    {/* Upcoming Events */}
                    <UpcomingEvents events={upcomingEvents || []} />

                    {/* Recent Community Photos */}
                    <RecentPhotos posts={recentPosts || []} />
                </div>

                {/* Right Column - 1/3 width */}
                <div className="space-y-4 sm:space-y-6">
                    {/* Current Mission */}
                    {activeMissions && <MissionCard mission={activeMissions} userId={user.id} />}

                    {/* Referral Card */}
                    <ReferralCard referralCode={profile?.referral_code || ''} />
                </div>
            </div>
        </div>
    )
}
