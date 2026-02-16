'use client'

import Footer from '@/components/Footer'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createClient()
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [checkingAuth, setCheckingAuth] = useState(true)

    useEffect(() => {
        async function checkAuth() {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                setIsAuthenticated(!!session)
            } catch (error) {
                console.error('Error checking auth:', error)
            } finally {
                setCheckingAuth(false)
            }
        }

        checkAuth()
    }, [])

    return (
        <div className="min-h-screen flex flex-col">
            {/* Simple Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e17]/95 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 sm:h-20">
                        <Link href="/" className="group">
                            <img 
                                src="/SkyGuild_Logo.png" 
                                alt="SkyGuild" 
                                className="h-8 w-auto object-contain group-hover:scale-105 transition-all duration-300"
                            />
                        </Link>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
                                About
                            </Link>
                            <Link href="/faq" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
                                FAQ
                            </Link>
                            {!checkingAuth && (
                                <>
                                    {isAuthenticated ? (
                                        <Link 
                                            href="/dashboard" 
                                            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-cosmic-purple to-cosmic-pink hover:opacity-90 rounded-full text-sm font-semibold text-white transition-all"
                                        >
                                            Dashboard
                                        </Link>
                                    ) : (
                                        <>
                                            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                                                Login
                                            </Link>
                                            <Link 
                                                href="/signup" 
                                                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-cosmic-purple to-cosmic-pink hover:opacity-90 rounded-full text-sm font-semibold text-white transition-all"
                                            >
                                                Sign Up
                                            </Link>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
            
            {/* Spacer for fixed header */}
            <div className="h-16 sm:h-20" />
            
            <main className="flex-1">
                {children}
            </main>
            
            <Footer />
        </div>
    )
}
