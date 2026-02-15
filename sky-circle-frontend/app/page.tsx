'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Telescope, Star, Users, Trophy, Calendar, Eye, Sparkles, Target, Globe, Mail, MessageCircle } from 'lucide-react'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import LocalBusinessSchema from '@/components/seo/LocalBusinessSchema'

// Structured data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "SkyGuild",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Join SkyGuild, the ultimate astronomy community platform. Log celestial observations, earn badges, complete missions, attend events, and connect with fellow stargazers worldwide.",
  "url": "https://theskycircle.com",
  "image": "https://theskycircle.com/og-image.jpg",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "500"
  },
  "featureList": [
    "Log celestial observations",
    "Earn astronomy badges",
    "Complete missions",
    "Join astronomy events",
    "Connect with stargazers",
    "Track your progress",
    "Share astrophotography"
  ]
}

function HomeContent() {
  const router = useRouter()
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
      <LocalBusinessSchema />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-8 animate-float">
            <Telescope className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-6xl md:text-8xl font-bold mb-6">
            <span className="text-gradient">SkyGuild</span>
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4">Look up. Stay curious.</p>
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Join a vibrant community of astronomy enthusiasts. Log observations, earn badges, complete missions, and explore the cosmos together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/signup" className="inline-block px-8 py-4 bg-gradient-to-r from-cosmic-purple to-cosmic-pink hover:opacity-90 rounded-full font-semibold text-lg text-white transition-all transform hover:scale-105 shadow-lg">
              Get Started Free
            </Link>
            <Link href="/login" className="inline-block px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-semibold text-lg text-white transition-all">
              Sign In
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-cosmic-purple">5</div>
              <div className="text-sm text-gray-400">Levels</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cosmic-pink">14+</div>
              <div className="text-sm text-gray-400">Badges</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cosmic-blue">∞</div>
              <div className="text-sm text-gray-400">Discoveries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Everything You Need to Explore the Cosmos</h2>
          <p className="text-center text-gray-400 mb-16 max-w-2xl mx-auto">
            Whether you're a beginner with binoculars or an experienced astrophotographer, SkyGuild has the tools to enhance your stargazing journey.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon={<Eye className="w-6 h-6" />} title="Log Observations" description="Track every celestial object you observe. Upload photos and earn points for your discoveries." gradient="from-cosmic-purple to-cosmic-pink" />
            <FeatureCard icon={<Trophy className="w-6 h-6" />} title="Earn Badges" description="Unlock achievements as you progress. From first light to cosmic voyager." gradient="from-cosmic-blue to-cyan-500" />
            <FeatureCard icon={<Star className="w-6 h-6" />} title="Complete Missions" description="Take on seasonal challenges. Hunt nebulae, track planets, and earn bonus rewards." gradient="from-green-500 to-emerald-500" />
            <FeatureCard icon={<Calendar className="w-6 h-6" />} title="Join Events" description="Attend observation nights, meteor showers, and eclipse viewings with fellow enthusiasts." gradient="from-yellow-500 to-orange-500" />
            <FeatureCard icon={<Users className="w-6 h-6" />} title="Share & Connect" description="Post astrophotography, discuss discoveries, and learn from experienced observers." gradient="from-cosmic-pink to-rose-500" />
            <FeatureCard icon={<Telescope className="w-6 h-6" />} title="Level Up" description="Progress from Naked Eye Explorer to Cosmic Voyager. Track your journey through the stars." gradient="from-indigo-500 to-cosmic-purple" />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-gray-400 mb-16 max-w-2xl mx-auto">
            Get started in minutes and begin your astronomical adventure
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard number="1" icon={<Sparkles className="w-8 h-8" />} title="Create Your Account" description="Sign up for free and set up your stargazer profile. Tell us about your interests and equipment." />
            <StepCard number="2" icon={<Target className="w-8 h-8" />} title="Start Observing" description="Log your first observation, join a mission, or attend an event. Every action earns you points and progress." />
            <StepCard number="3" icon={<Globe className="w-8 h-8" />} title="Connect & Grow" description="Share your discoveries, learn from the community, and unlock badges as you explore the cosmos." />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="glass-effect rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-center mb-12">Join Our Growing Community</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCard value={loading ? '...' : stats.users.toLocaleString() + '+'} label="Active Members" />
              <StatCard value={loading ? '...' : stats.observations.toLocaleString() + '+'} label="Observations Logged" />
              <StatCard value={loading ? '...' : stats.events.toLocaleString() + '+'} label="Events Hosted" />
              <StatCard value={loading ? '...' : stats.badges.toLocaleString() + '+'} label="Badges Earned" />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 bg-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Get In Touch</h2>
          <p className="text-xl text-gray-400 mb-12">
            Have questions? Want to collaborate? We'd love to hear from you.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <ContactCard icon={<Mail className="w-6 h-6" />} title="Email Us" description="hello@theskycircle.com" link="mailto:hello@theskycircle.com" />
            <ContactCard icon={<MessageCircle className="w-6 h-6" />} title="Join Our Community" description="Connect with fellow stargazers" link="/signup" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center glass-effect rounded-2xl p-12">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl text-gray-400 mb-8">Join thousands of stargazers exploring the cosmos together.</p>
          <Link href="/signup" className="inline-block px-8 py-4 bg-gradient-to-r from-cosmic-purple to-cosmic-pink hover:opacity-90 rounded-full font-semibold text-lg text-white transition-all transform hover:scale-105 shadow-lg">
            Create Free Account
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function FeatureCard({ icon, title, description, gradient }: { icon: React.ReactNode; title: string; description: string; gradient: string }) {
  return (
    <div className="glass-effect rounded-xl p-6 hover:scale-105 transition-transform">
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 text-white`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}

function StepCard({ number, icon, title, description }: { number: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="glass-effect rounded-xl p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cosmic-purple to-cosmic-pink flex items-center justify-center text-white font-bold text-xl mx-auto mb-6 shadow-lg">
        {number}
      </div>
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cosmic-purple/20 to-cosmic-pink/20 flex items-center justify-center mx-auto mb-4 text-cosmic-purple">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  )
}

function ContactCard({ icon, title, description, link }: { icon: React.ReactNode; title: string; description: string; link: string }) {
  return (
    <Link href={link} className="glass-effect rounded-xl p-6 hover:scale-105 transition-transform text-left group">
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cosmic-purple to-cosmic-pink flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </Link>
  )
}

export default function Home() {
  return <HomeContent />
}
