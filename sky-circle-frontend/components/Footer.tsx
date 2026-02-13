'use client'

import Link from 'next/link'
import { Star, Mail, MapPin, Instagram, Twitter, Youtube } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="border-t border-white/5 bg-black/20 backdrop-blur-sm mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cosmic-purple to-cosmic-pink flex items-center justify-center">
                                <Star className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-black tracking-tight">SkyGuild</span>
                        </Link>
                        <p className="text-sm text-white/50 leading-relaxed">
                            A community of stargazers exploring the cosmos together. Track observations, earn badges, and connect with fellow astronomers.
                        </p>
                        <div className="flex gap-3">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg glass-inner flex items-center justify-center hover:bg-white/10 transition-all">
                                <Instagram className="w-4 h-4 text-white/60" />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg glass-inner flex items-center justify-center hover:bg-white/10 transition-all">
                                <Twitter className="w-4 h-4 text-white/60" />
                            </a>
                            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg glass-inner flex items-center justify-center hover:bg-white/10 transition-all">
                                <Youtube className="w-4 h-4 text-white/60" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-white/40 mb-4">Explore</h4>
                        <ul className="space-y-2">
                            <li><Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors">Dashboard</Link></li>
                            <li><Link href="/dashboard/observations" className="text-sm text-white/60 hover:text-white transition-colors">Observations</Link></li>
                            <li><Link href="/dashboard/events" className="text-sm text-white/60 hover:text-white transition-colors">Events</Link></li>
                            <li><Link href="/dashboard/missions" className="text-sm text-white/60 hover:text-white transition-colors">Missions</Link></li>
                            <li><Link href="/dashboard/community" className="text-sm text-white/60 hover:text-white transition-colors">Community</Link></li>
                            <li><Link href="/dashboard/leaderboard" className="text-sm text-white/60 hover:text-white transition-colors">Leaderboard</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-white/40 mb-4">Legal</h4>
                        <ul className="space-y-2">
                            <li><Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors">About Us</Link></li>
                            <li><Link href="/terms" className="text-sm text-white/60 hover:text-white transition-colors">Terms & Conditions</Link></li>
                            <li><Link href="/privacy" className="text-sm text-white/60 hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/cancellation" className="text-sm text-white/60 hover:text-white transition-colors">Cancellation Policy</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-white/40 mb-4">Contact</h4>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <Mail className="w-4 h-4 text-cosmic-purple mt-0.5" />
                                <span className="text-sm text-white/60">hello@theskycircle.com</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-cosmic-purple mt-0.5" />
                                <span className="text-sm text-white/60">Naya Raipur, Chhattisgarh, India</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-white/40">
                        © {new Date().getFullYear()} SkyGuild. All rights reserved.
                    </p>
                    <p className="text-xs text-white/40">
                        Made with ✨ for stargazers everywhere
                    </p>
                </div>
            </div>
        </footer>
    )
}
