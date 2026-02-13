import { Star, Users, Telescope, Award, Heart, Globe } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
    return (
        <div className="min-h-screen">
            {/* Hero */}
            <div className="relative py-24 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-cosmic-purple/20 to-transparent" />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 glass-effect rounded-full text-sm font-medium text-cosmic-purple mb-6">
                        <Star className="w-4 h-4" />
                        About Us
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                        We're Building a Community of{' '}
                        <span className="text-gradient">Stargazers</span>
                    </h1>
                    <p className="text-lg text-white/60 max-w-2xl mx-auto">
                        The Sky Circle is more than an app — it's a movement to bring people together under the night sky, fostering curiosity, learning, and wonder.
                    </p>
                </div>
            </div>

            {/* Mission */}
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-black mb-6">Our Mission</h2>
                        <p className="text-white/60 mb-4 leading-relaxed">
                            We believe that looking up at the stars connects us to something greater than ourselves. Our mission is to make astronomy accessible, engaging, and social for everyone — from curious beginners to seasoned observers.
                        </p>
                        <p className="text-white/60 leading-relaxed">
                            Through gamification, community events, and educational content, we're creating a platform where every observation matters and every stargazer has a place to belong.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-effect rounded-2xl p-6 text-center">
                            <Users className="w-8 h-8 text-cosmic-purple mx-auto mb-3" />
                            <p className="text-2xl font-black">500+</p>
                            <p className="text-sm text-white/40">Active Members</p>
                        </div>
                        <div className="glass-effect rounded-2xl p-6 text-center">
                            <Telescope className="w-8 h-8 text-cosmic-pink mx-auto mb-3" />
                            <p className="text-2xl font-black">2,000+</p>
                            <p className="text-sm text-white/40">Observations</p>
                        </div>
                        <div className="glass-effect rounded-2xl p-6 text-center">
                            <Award className="w-8 h-8 text-cosmic-gold mx-auto mb-3" />
                            <p className="text-2xl font-black">50+</p>
                            <p className="text-sm text-white/40">Events Hosted</p>
                        </div>
                        <div className="glass-effect rounded-2xl p-6 text-center">
                            <Globe className="w-8 h-8 text-cosmic-blue mx-auto mb-3" />
                            <p className="text-2xl font-black">10+</p>
                            <p className="text-sm text-white/40">Cities</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Values */}
            <div className="max-w-7xl mx-auto px-4 py-16">
                <h2 className="text-3xl font-black mb-12 text-center">What We Stand For</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="glass-effect rounded-2xl p-8">
                        <div className="w-12 h-12 rounded-xl bg-cosmic-purple/20 flex items-center justify-center mb-4">
                            <Heart className="w-6 h-6 text-cosmic-purple" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Community First</h3>
                        <p className="text-white/50 text-sm leading-relaxed">
                            We prioritize building genuine connections between stargazers. Every feature we build is designed to bring people together.
                        </p>
                    </div>
                    <div className="glass-effect rounded-2xl p-8">
                        <div className="w-12 h-12 rounded-xl bg-cosmic-pink/20 flex items-center justify-center mb-4">
                            <Telescope className="w-6 h-6 text-cosmic-pink" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Accessible Astronomy</h3>
                        <p className="text-white/50 text-sm leading-relaxed">
                            You don't need expensive equipment to enjoy the night sky. We make astronomy approachable for everyone, regardless of experience.
                        </p>
                    </div>
                    <div className="glass-effect rounded-2xl p-8">
                        <div className="w-12 h-12 rounded-xl bg-cosmic-gold/20 flex items-center justify-center mb-4">
                            <Star className="w-6 h-6 text-cosmic-gold" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Continuous Learning</h3>
                        <p className="text-white/50 text-sm leading-relaxed">
                            The universe is vast and there's always more to discover. We encourage curiosity and provide resources for lifelong learning.
                        </p>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <h2 className="text-3xl font-black mb-4">Ready to Join the Circle?</h2>
                <p className="text-white/60 mb-8">Start your cosmic journey today and connect with fellow stargazers.</p>
                <Link 
                    href="/signup" 
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-xl font-bold hover:scale-105 transition-all"
                >
                    Get Started
                    <Star className="w-5 h-5" />
                </Link>
            </div>
        </div>
    )
}
