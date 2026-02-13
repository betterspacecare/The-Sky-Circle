import Footer from '@/components/Footer'
import Link from 'next/link'
import { Star } from 'lucide-react'

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Simple Nav */}
            <nav className="border-b border-white/5 bg-black/20 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cosmic-purple to-cosmic-pink flex items-center justify-center">
                            <Star className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-black tracking-tight">SkyGuild</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">
                            Login
                        </Link>
                        <Link 
                            href="/signup" 
                            className="px-4 py-2 bg-cosmic-purple/20 text-cosmic-purple rounded-lg text-sm font-medium hover:bg-cosmic-purple/30 transition-all"
                        >
                            Sign Up
                        </Link>
                    </div>
                </div>
            </nav>
            
            <main className="flex-1">
                {children}
            </main>
            
            <Footer />
        </div>
    )
}
