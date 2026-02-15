'use client'

import Link from 'next/link'
import { Star, Mail, MapPin, Instagram, Twitter, Youtube } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="border-t border-white/5 bg-black/40 backdrop-blur-sm mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
                {/* Mobile: Compact single row */}
                <div className="md:hidden">
                    <div className="flex items-center justify-between mb-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cosmic-purple to-cosmic-pink flex items-center justify-center">
                                <Star className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-base font-bold">SkyGuild</span>
                        </Link>
                        <div className="flex gap-2">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg glass-inner flex items-center justify-center">
                                <Instagram className="w-3.5 h-3.5 text-white/60" />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg glass-inner flex items-center justify-center">
                                <Twitter className="w-3.5 h-3.5 text-white/60" />
                            </a>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/40 mb-3">
                        <Link href="/about" className="hover:text-white/60">About</Link>
                        <Link href="/faq" className="hover:text-white/60">FAQ</Link>
                        <Link href="/terms" className="hover:text-white/60">Terms</Link>
                        <Link href="/privacy" className="hover:text-white/60">Privacy</Link>
                        <Link href="/cancellation" className="hover:text-white/60">Cancellation</Link>
                    </div>
                    <p className="text-[10px] text-white/30">© {new Date().getFullYear()} SkyGuild</p>
                </div>

                {/* Desktop: Full layout */}
                <div className="hidden md:block">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                        {/* Brand */}
                        <div className="space-y-3">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cosmic-purple to-cosmic-pink flex items-center justify-center">
                                    <Star className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-lg font-bold">SkyGuild</span>
                            </Link>
                            <p className="text-xs text-white/50 leading-relaxed">
                                A community of stargazers exploring the cosmos together.
                            </p>
                            <div className="flex gap-2">
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg glass-inner flex items-center justify-center hover:bg-white/10 transition-all">
                                    <Instagram className="w-3.5 h-3.5 text-white/60" />
                                </a>
                                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg glass-inner flex items-center justify-center hover:bg-white/10 transition-all">
                                    <Twitter className="w-3.5 h-3.5 text-white/60" />
                                </a>
                                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg glass-inner flex items-center justify-center hover:bg-white/10 transition-all">
                                    <Youtube className="w-3.5 h-3.5 text-white/60" />
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="font-medium text-xs uppercase tracking-wider text-white/40 mb-3">Explore</h4>
                            <ul className="space-y-1.5">
                                <li><Link href="/dashboard" className="text-xs text-white/60 hover:text-white transition-colors">Dashboard</Link></li>
                                <li><Link href="/dashboard/observations" className="text-xs text-white/60 hover:text-white transition-colors">Observations</Link></li>
                                <li><Link href="/dashboard/events" className="text-xs text-white/60 hover:text-white transition-colors">Events</Link></li>
                                <li><Link href="/dashboard/missions" className="text-xs text-white/60 hover:text-white transition-colors">Missions</Link></li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h4 className="font-medium text-xs uppercase tracking-wider text-white/40 mb-3">Legal</h4>
                            <ul className="space-y-1.5">
                                <li><Link href="/about" className="text-xs text-white/60 hover:text-white transition-colors">About Us</Link></li>
                                <li><Link href="/faq" className="text-xs text-white/60 hover:text-white transition-colors">FAQ</Link></li>
                                <li><Link href="/terms" className="text-xs text-white/60 hover:text-white transition-colors">Terms</Link></li>
                                <li><Link href="/privacy" className="text-xs text-white/60 hover:text-white transition-colors">Privacy</Link></li>
                                <li><Link href="/cancellation" className="text-xs text-white/60 hover:text-white transition-colors">Cancellation</Link></li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="font-medium text-xs uppercase tracking-wider text-white/40 mb-3">Contact</h4>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-cosmic-purple" />
                                    <span className="text-xs text-white/60">hello@theskycircle.com</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-cosmic-purple mt-0.5" />
                                    <span className="text-xs text-white/60">Naya Raipur, India</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom */}
                    <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                        <p className="text-[11px] text-white/40">© {new Date().getFullYear()} SkyGuild. All rights reserved.</p>
                        <p className="text-[11px] text-white/40">Made with ✨ for stargazers</p>
                    </div>
                </div>
            </div>
        </footer>
    )
}
