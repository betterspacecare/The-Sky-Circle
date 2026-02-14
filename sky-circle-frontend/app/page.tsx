'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Telescope, Star, Users, Trophy, Calendar, Eye } from 'lucide-react'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if this is a password reset redirect (has code param)
    const code = searchParams.get('code')
    if (code) {
      // Redirect to reset-password page with the code
      router.replace(`/reset-password?code=${code}`)
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-8 animate-float">
            <Telescope className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-8xl font-bold mb-6">
            <span className="text-gradient">SkyGuild</span>
          </h1>

          {/* Tagline */}
          <p className="text-2xl md:text-3xl text-gray-300 mb-4">
            Look up. Stay curious.
          </p>

          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Join a vibrant community of astronomy enthusiasts. Log observations, earn badges,
            complete missions, and explore the cosmos together.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/signup"
              className="inline-block px-8 py-4 bg-gradient-to-r from-cosmic-purple to-cosmic-pink hover:opacity-90 rounded-full font-semibold text-lg text-white transition-all transform hover:scale-105 shadow-lg"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-semibold text-lg text-white transition-all"
            >
              Sign In
            </Link>
          </div>

          {/* Stats */}
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
          <h2 className="text-4xl font-bold text-center mb-16">
            Everything You Need to Explore the Cosmos
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-effect rounded-xl p-6 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cosmic-purple to-cosmic-pink flex items-center justify-center mb-4 text-white">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Log Observations</h3>
              <p className="text-gray-400">
                Track every celestial object you observe. Upload photos and earn points for your discoveries.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-effect rounded-xl p-6 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cosmic-blue to-cyan-500 flex items-center justify-center mb-4 text-white">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Earn Badges</h3>
              <p className="text-gray-400">
                Unlock achievements as you progress. From first light to cosmic voyager.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-effect rounded-xl p-6 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 text-white">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Complete Missions</h3>
              <p className="text-gray-400">
                Take on seasonal challenges. Hunt nebulae, track planets, and earn bonus rewards.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-effect rounded-xl p-6 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mb-4 text-white">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Join Events</h3>
              <p className="text-gray-400">
                Attend observation nights, meteor showers, and eclipse viewings with fellow enthusiasts.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass-effect rounded-xl p-6 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cosmic-pink to-rose-500 flex items-center justify-center mb-4 text-white">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Share & Connect</h3>
              <p className="text-gray-400">
                Post astrophotography, discuss discoveries, and learn from experienced observers.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass-effect rounded-xl p-6 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-cosmic-purple flex items-center justify-center mb-4 text-white">
                <Telescope className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Level Up</h3>
              <p className="text-gray-400">
                Progress from Naked Eye Explorer to Cosmic Voyager. Track your journey through the stars.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center glass-effect rounded-2xl p-12">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of stargazers exploring the cosmos together.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-gradient-to-r from-cosmic-purple to-cosmic-pink hover:opacity-90 rounded-full font-semibold text-lg text-white transition-all transform hover:scale-105 shadow-lg"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>© 2026 SkyGuild. Built with ❤️ for the astronomy community.</p>
        </div>
      </footer>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <HomeContent />
    </Suspense>
  )
}
