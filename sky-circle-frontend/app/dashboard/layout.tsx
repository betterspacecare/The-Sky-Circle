import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/dashboard/DashboardNav'
import Footer from '@/components/Footer'
import NotificationProvider from '@/components/NotificationProvider'
import FeedbackButton from '@/components/FeedbackButton'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <NotificationProvider userId={user.id}>
            <div className="min-h-screen flex flex-col relative">
                <DashboardNav />
                <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full relative z-10">
                    {children}
                </main>
                <Footer />
                <FeedbackButton />
            </div>
        </NotificationProvider>
    )
}
