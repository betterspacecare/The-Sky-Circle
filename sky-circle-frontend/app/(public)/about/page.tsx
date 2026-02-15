'use client'

import { Star, Users, Telescope, Award, Heart, Target, Sparkles, Rocket, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Structured data for About page
const structuredData = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "About SkyGuild",
  "description": "Learn about SkyGuild's mission to build a global community of stargazers and make astronomy accessible to everyone.",
  "url": "https://theskycircle.com/about",
  "mainEntity": {
    "@type": "Organization",
    "name": "SkyGuild",
    "url": "https://theskycircle.com",
    "logo": "https://theskycircle.com/logo.png",
    "description": "SkyGuild is building the largest community of amateur astronomers and space enthusiasts on the planet.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Naya Raipur",
      "addressCountry": "IN"
    },
    "sameAs": [
      "https://twitter.com/skyguild",
      "https://instagram.com/skyguild",
      "https://youtube.com/@skyguild"
    ]
  }
}

export default function AboutPage() {
    const supabase = createClient()
    const [stats, setStats] = useState({
        users: 0,
        observations: 0,
        events: 0,
        badges: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                const [usersRes, observationsRes, eventsRes, badgesRes] = await Promise.all([
                    supabase.from('users').select('id', { count: 'exact', head: true }),
                    supabase.from('observations').select('id', { count: 'exact', head: true }),
                    supabase.from('events').select('id', { count: 'exact', head: true }),
                    supabase.from('user_badges').select('id', { count: 'exact', head: true })
                ])

                setStats({
                    users: usersRes.count || 0,
                    observations: observationsRes.count || 0,
                    events: eventsRes.count || 0,
                    badges: badgesRes.count || 0
                })
            } catch (error) {
                console.error('Error fetching stats:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    return (
        <div className="min-h-screen flex flex-col">
            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            
            {/* Hero */}
            <div className="relative py-32 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-cosmic-purple/20 via-cosmic-pink/10 to-transparent" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 glass-effect rounded-full text-sm font-medium text-cosmic-purple mb-6">
                        <Star className="w-4 h-4" />
                        About SkyGuild
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                        Building a Global Community of{' '}
                        <span className="text-gradient">Stargazers</span>
                    </h1>
                    <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
                        SkyGuild is more than an app — it's my mission to bring people together under the night sky, fostering curiosity, learning, and wonder about the cosmos we all share.
                    </p>
                </div>
            </div>

            {/* Stats Section */}
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="glass-effect rounded-3xl p-12">
                    <h2 className="text-3xl font-black mb-12 text-center">The Growing Community</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <Users className="w-10 h-10 text-cosmic-purple mx-auto mb-4" />
                            <p className="text-4xl font-black text-gradient mb-2">
                                {loading ? '...' : stats.users.toLocaleString() + '+'}
                            </p>
                            <p className="text-sm text-white/50">Active Members</p>
                        </div>
                        <div className="text-center">
                            <Telescope className="w-10 h-10 text-cosmic-pink mx-auto mb-4" />
                            <p className="text-4xl font-black text-gradient mb-2">
                                {loading ? '...' : stats.observations.toLocaleString() + '+'}
                            </p>
                            <p className="text-sm text-white/50">Observations Logged</p>
                        </div>
                        <div className="text-center">
                            <Award className="w-10 h-10 text-warning-100 mx-auto mb-4" />
                            <p className="text-4xl font-black text-gradient mb-2">
                                {loading ? '...' : stats.events.toLocaleString() + '+'}
                            </p>
                            <p className="text-sm text-white/50">Events Hosted</p>
                        </div>
                        <div className="text-center">
                            <Star className="w-10 h-10 text-cosmic-blue mx-auto mb-4" />
                            <p className="text-4xl font-black text-gradient mb-2">
                                {loading ? '...' : stats.badges.toLocaleString() + '+'}
                            </p>
                            <p className="text-sm text-white/50">Badges Earned</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mission & Vision */}
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid lg:grid-cols-2 gap-12">
                    <div className="glass-effect rounded-3xl p-10">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cosmic-purple to-cosmic-pink flex items-center justify-center mb-6">
                            <Target className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="text-3xl font-black mb-6">My Mission</h2>
                        <p className="text-white/70 mb-4 leading-relaxed text-lg">
                            I believe that looking up at the stars connects us to something greater than ourselves. My mission is to make astronomy accessible, engaging, and social for everyone — from curious beginners to seasoned observers.
                        </p>
                        <p className="text-white/70 leading-relaxed text-lg">
                            Through gamification, community events, and educational content, I'm creating a platform where every observation matters and every stargazer has a place to belong.
                        </p>
                    </div>
                    <div className="glass-effect rounded-3xl p-10">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cosmic-blue to-cyan-500 flex items-center justify-center mb-6">
                            <Rocket className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="text-3xl font-black mb-6">My Vision</h2>
                        <p className="text-white/70 mb-4 leading-relaxed text-lg">
                            I envision a world where millions of people regularly look up at the night sky, share their discoveries, and inspire each other to explore the cosmos.
                        </p>
                        <p className="text-white/70 leading-relaxed text-lg">
                            By combining technology with the timeless wonder of stargazing, I'm building the largest community of amateur astronomers and space enthusiasts on the planet.
                        </p>
                    </div>
                </div>
            </div>

            {/* Values */}
            <div className="max-w-7xl mx-auto px-4 py-16 bg-white/5">
                <h2 className="text-4xl font-black mb-4 text-center">What I Stand For</h2>
                <p className="text-center text-white/60 mb-16 max-w-2xl mx-auto">
                    These core values guide everything I do, from product decisions to community interactions.
                </p>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="glass-effect rounded-2xl p-8 hover:scale-105 transition-transform">
                        <div className="w-14 h-14 rounded-xl bg-cosmic-purple/20 flex items-center justify-center mb-6">
                            <Heart className="w-7 h-7 text-cosmic-purple" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Community First</h3>
                        <p className="text-white/60 leading-relaxed">
                            I prioritize building genuine connections between stargazers. Every feature I build is designed to bring people together and foster meaningful interactions.
                        </p>
                    </div>
                    <div className="glass-effect rounded-2xl p-8 hover:scale-105 transition-transform">
                        <div className="w-14 h-14 rounded-xl bg-cosmic-pink/20 flex items-center justify-center mb-6">
                            <Telescope className="w-7 h-7 text-cosmic-pink" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Accessible Astronomy</h3>
                        <p className="text-white/60 leading-relaxed">
                            You don't need expensive equipment to enjoy the night sky. I make astronomy approachable for everyone, regardless of experience or budget.
                        </p>
                    </div>
                    <div className="glass-effect rounded-2xl p-8 hover:scale-105 transition-transform">
                        <div className="w-14 h-14 rounded-xl bg-warning-100/20 flex items-center justify-center mb-6">
                            <Sparkles className="w-7 h-7 text-warning-100" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Continuous Learning</h3>
                        <p className="text-white/60 leading-relaxed">
                            The universe is vast and there's always more to discover. I encourage curiosity and provide resources for lifelong learning and exploration.
                        </p>
                    </div>
                </div>
            </div>

            {/* Story Section */}
            <div className="max-w-5xl mx-auto px-4 py-20">
                <div className="glass-effect rounded-3xl p-12">
                    <h2 className="text-4xl font-black mb-6 text-center">My Story</h2>
                    <div className="space-y-6 text-white/70 text-lg leading-relaxed">
                        <p>
                            SkyGuild was born from a simple observation: while millions of people are fascinated by space and astronomy, most never take the step to actually observe the night sky themselves.
                        </p>
                        <p>
                            I realized that what was missing wasn't just information — it was community, motivation, and a sense of progress. That's why I created SkyGuild: a platform that combines the social aspects of modern apps with the timeless wonder of stargazing.
                        </p>
                        <p>
                            Today, I'm proud to serve thousands of stargazers around the world, from complete beginners taking their first look at the Moon to experienced astrophotographers sharing their latest captures. Every day, the community logs new observations, attends events, and helps each other learn more about the cosmos.
                        </p>
                    </div>
                </div>
            </div>

            {/* Location */}
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="glass-effect rounded-3xl p-12 text-center">
                    <MapPin className="w-12 h-12 text-cosmic-purple mx-auto mb-6" />
                    <h2 className="text-3xl font-black mb-4">Based in Naya Raipur, India</h2>
                    <p className="text-white/60 text-lg max-w-2xl mx-auto">
                        I'm building SkyGuild from the heart of India, but the community spans the globe. Wherever you are, there's a place for you under the stars.
                    </p>
                </div>
            </div>

            {/* CTA */}
            <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Join the Guild?</h2>
                <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
                    Start your cosmic journey today and connect with thousands of fellow stargazers around the world.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                        href="/signup" 
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-full font-bold hover:scale-105 transition-all shadow-lg text-lg"
                    >
                        Get Started Free
                        <Star className="w-5 h-5" />
                    </Link>
                    <Link 
                        href="/login" 
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-bold transition-all text-lg"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    )
}
