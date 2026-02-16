'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Telescope, Star, Users, Trophy, Calendar, Eye, Sparkles, Target, Globe, Mail, MessageCircle, ImageIcon } from 'lucide-react'
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
      
      {/* Header Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e17]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="group">
              <img 
                src="/SkyGuild_Logo.png" 
                alt="SkyGuild" 
                className="h-8 sm:h-10 w-auto object-contain group-hover:scale-105 transition-all duration-300"
              />
            </Link>

            {/* Navigation Links */}
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
      
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12 sm:py-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center justify-center mb-6 sm:mb-8 animate-float">
            <img 
              src="/SkyGuild_Icon.png" 
              alt="SkyGuild" 
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain drop-shadow-2xl"
            />
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 mb-3 sm:mb-4">Look up. Stay curious.</p>
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Join a vibrant community of astronomy enthusiasts. Log observations, earn badges, complete missions, and explore the cosmos together.
          </p>
          {!checkingAuth && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {isAuthenticated ? (
                <Link href="/dashboard" className="inline-block px-8 py-4 bg-gradient-to-r from-cosmic-purple to-cosmic-pink hover:opacity-90 rounded-full font-semibold text-lg text-white transition-all transform hover:scale-105 shadow-lg">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="inline-block px-8 py-4 bg-gradient-to-r from-cosmic-purple to-cosmic-pink hover:opacity-90 rounded-full font-semibold text-lg text-white transition-all transform hover:scale-105 shadow-lg">
                    Get Started Free
                  </Link>
                  <Link href="/login" className="inline-block px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-semibold text-lg text-white transition-all">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          )}
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

      {/* Why Choose SkyGuild */}
      <section className="py-20 px-4 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Why Stargazers Love SkyGuild</h2>
          <p className="text-center text-gray-400 mb-16 max-w-2xl mx-auto">
            More than just an observation log — it's your complete astronomy companion
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <BenefitCard 
              icon={<Users className="w-6 h-6" />} 
              title="Active Community" 
              description="Connect with thousands of astronomy enthusiasts. Share discoveries, get advice, and make friends who share your passion for the cosmos."
              gradient="from-cosmic-purple to-cosmic-pink"
            />
            <BenefitCard 
              icon={<Trophy className="w-6 h-6" />} 
              title="Gamified Learning" 
              description="Stay motivated with badges, missions, and levels. Turn your astronomy journey into an exciting adventure with rewards at every milestone."
              gradient="from-cosmic-blue to-cyan-500"
            />
            <BenefitCard 
              icon={<Calendar className="w-6 h-6" />} 
              title="Never Miss an Event" 
              description="Get notified about meteor showers, eclipses, and local observation nights. Join virtual or in-person events with fellow stargazers."
              gradient="from-yellow-500 to-orange-500"
            />
            <BenefitCard 
              icon={<ImageIcon className="w-6 h-6" />} 
              title="Showcase Your Work" 
              description="Upload and share your astrophotography. Get feedback from the community and inspire others with your captures of the night sky."
              gradient="from-green-500 to-emerald-500"
            />
            <BenefitCard 
              icon={<Target className="w-6 h-6" />} 
              title="Track Your Progress" 
              description="Log every observation and watch your skills grow. See your journey from beginner to expert with detailed statistics and achievements."
              gradient="from-cosmic-pink to-rose-500"
            />
            <BenefitCard 
              icon={<Sparkles className="w-6 h-6" />} 
              title="Always Free" 
              description="Full access to all features at no cost. No premium tiers, no paywalls — just pure astronomy passion shared by everyone."
              gradient="from-indigo-500 to-cosmic-purple"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">What Our Community Says</h2>
          <p className="text-center text-gray-400 mb-16 max-w-2xl mx-auto">
            Real stories from stargazers around the world
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="SkyGuild transformed my casual interest in astronomy into a genuine passion. The community is incredibly supportive!"
              author="Sarah M."
              role="Amateur Astronomer"
            />
            <TestimonialCard 
              quote="I love the gamification aspect. Earning badges and completing missions keeps me motivated to observe regularly."
              author="James K."
              role="Astrophotographer"
            />
            <TestimonialCard 
              quote="Finally, a platform that brings stargazers together. I've made friends from around the world who share my love for the cosmos."
              author="Priya R."
              role="Astronomy Enthusiast"
            />
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

function BenefitCard({ icon, title, description, gradient }: { icon: React.ReactNode; title: string; description: string; gradient: string }) {
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

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="glass-effect rounded-xl p-8 hover:scale-105 transition-transform">
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-5 h-5 text-warning-100 fill-warning-100" />
        ))}
      </div>
      <p className="text-gray-300 mb-6 leading-relaxed">"{quote}"</p>
      <div>
        <p className="font-bold">{author}</p>
        <p className="text-sm text-gray-400">{role}</p>
      </div>
    </div>
  )
}

export default function Home() {
  return <HomeContent />
}
