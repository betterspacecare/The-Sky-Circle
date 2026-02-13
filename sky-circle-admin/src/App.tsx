import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { LoginPage } from './components/LoginPage'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { UsersPage } from './pages/UsersPage'
import { ObservationsPage } from './pages/ObservationsPage'
import { EventsPage } from './pages/EventsPage'
import { MissionsPage } from './pages/MissionsPage'
import { BadgesPage } from './pages/BadgesPage'
import { PostsPage } from './pages/PostsPage'
import { AlertsPage } from './pages/AlertsPage'
import { ReferralsPage } from './pages/ReferralsPage'
import { GroupsPage } from './pages/GroupsPage'
import { ApplicationsPage } from './pages/ApplicationsPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { Loader2 } from 'lucide-react'

function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading, role, checkAuth } = useAuthStore()
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        checkAuth()
    }, [checkAuth])

    useEffect(() => {
        // Check if this is a password reset callback
        const hash = window.location.hash
        if (hash.includes('type=recovery') && location.pathname !== '/reset-password') {
            navigate('/reset-password')
        }
    }, [navigate, location])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
        )
    }

    // Public routes that don't need auth
    const publicRoutes = ['/login', '/forgot-password', '/reset-password']
    if (publicRoutes.includes(location.pathname)) {
        return <>{children}</>
    }

    // Redirect to login if not authenticated or not admin/manager
    if (!user || !role || (role !== 'admin' && role !== 'manager')) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}

function AppRoutes() {
    const navigate = useNavigate()
    const location = useLocation()

    // Get current page from pathname for Layout
    const getCurrentPage = () => {
        const path = location.pathname.replace('/', '') || 'dashboard'
        return path
    }

    const handleNavigate = (page: string) => {
        navigate(`/${page === 'dashboard' ? '' : page}`)
    }

    return (
        <AuthWrapper>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage onForgotPassword={() => navigate('/forgot-password')} />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage onBack={() => navigate('/login')} />} />
                <Route path="/reset-password" element={
                    <ResetPasswordPage onComplete={() => {
                        window.location.hash = ''
                        navigate('/login')
                    }} />
                } />

                {/* Protected Routes */}
                <Route path="/" element={
                    <Layout currentPage={getCurrentPage()} onNavigate={handleNavigate}>
                        <DashboardPage />
                    </Layout>
                } />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/users" element={
                    <Layout currentPage="users" onNavigate={handleNavigate}>
                        <UsersPage />
                    </Layout>
                } />
                <Route path="/observations" element={
                    <Layout currentPage="observations" onNavigate={handleNavigate}>
                        <ObservationsPage />
                    </Layout>
                } />
                <Route path="/events" element={
                    <Layout currentPage="events" onNavigate={handleNavigate}>
                        <EventsPage />
                    </Layout>
                } />
                <Route path="/missions" element={
                    <Layout currentPage="missions" onNavigate={handleNavigate}>
                        <MissionsPage />
                    </Layout>
                } />
                <Route path="/badges" element={
                    <Layout currentPage="badges" onNavigate={handleNavigate}>
                        <BadgesPage />
                    </Layout>
                } />
                <Route path="/posts" element={
                    <Layout currentPage="posts" onNavigate={handleNavigate}>
                        <PostsPage />
                    </Layout>
                } />
                <Route path="/alerts" element={
                    <Layout currentPage="alerts" onNavigate={handleNavigate}>
                        <AlertsPage />
                    </Layout>
                } />
                <Route path="/referrals" element={
                    <Layout currentPage="referrals" onNavigate={handleNavigate}>
                        <ReferralsPage />
                    </Layout>
                } />
                <Route path="/groups" element={
                    <Layout currentPage="groups" onNavigate={handleNavigate}>
                        <GroupsPage />
                    </Layout>
                } />
                <Route path="/applications" element={
                    <Layout currentPage="applications" onNavigate={handleNavigate}>
                        <ApplicationsPage />
                    </Layout>
                } />

                {/* Catch all - redirect to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthWrapper>
    )
}

function App() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    )
}

export default App
