import { FileText } from 'lucide-react'
import Link from 'next/link'

export default function TermsPage() {
    return (
        <div className="min-h-screen py-16 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 glass-effect rounded-full text-sm font-medium text-cosmic-purple mb-6">
                        <FileText className="w-4 h-4" />
                        Legal
                    </div>
                    <h1 className="text-4xl font-black mb-4">Terms & Conditions</h1>
                    <p className="text-white/50">Last updated: February 2026</p>
                </div>

                <div className="glass-effect rounded-2xl p-8 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold mb-4">1. Acceptance of Terms</h2>
                        <p className="text-white/60 leading-relaxed">
                            By accessing and using The Sky Circle platform ("Service"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">2. User Accounts</h2>
                        <div className="text-white/60 leading-relaxed space-y-3">
                            <p>When you create an account with us, you must provide accurate, complete, and current information. You are responsible for:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Maintaining the confidentiality of your account credentials</li>
                                <li>All activities that occur under your account</li>
                                <li>Notifying us immediately of any unauthorized use</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">3. User Content</h2>
                        <div className="text-white/60 leading-relaxed space-y-3">
                            <p>You retain ownership of content you post on The Sky Circle. By posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content within the Service.</p>
                            <p>You agree not to post content that:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Is illegal, harmful, or offensive</li>
                                <li>Infringes on intellectual property rights</li>
                                <li>Contains malware or harmful code</li>
                                <li>Violates the privacy of others</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">4. Events and Gatherings</h2>
                        <div className="text-white/60 leading-relaxed space-y-3">
                            <p>The Sky Circle organizes stargazing events and gatherings. By participating:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>You acknowledge that outdoor activities carry inherent risks</li>
                                <li>You agree to follow event guidelines and organizer instructions</li>
                                <li>You understand that events may be cancelled due to weather or other factors</li>
                                <li>You are responsible for your own safety and equipment</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">5. Points and Rewards</h2>
                        <p className="text-white/60 leading-relaxed">
                            Points earned through observations and activities are for gamification purposes only and hold no monetary value. We reserve the right to modify the points system at any time. Badges and achievements are non-transferable.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">6. Prohibited Activities</h2>
                        <div className="text-white/60 leading-relaxed space-y-3">
                            <p>You agree not to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Use the Service for any unlawful purpose</li>
                                <li>Attempt to gain unauthorized access to our systems</li>
                                <li>Interfere with or disrupt the Service</li>
                                <li>Create multiple accounts to abuse the rewards system</li>
                                <li>Harass, abuse, or harm other users</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">7. Termination</h2>
                        <p className="text-white/60 leading-relaxed">
                            We may terminate or suspend your account immediately, without prior notice, for any breach of these Terms. Upon termination, your right to use the Service will cease immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">8. Limitation of Liability</h2>
                        <p className="text-white/60 leading-relaxed">
                            The Sky Circle shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service. Our total liability shall not exceed the amount you paid us in the past twelve months.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">9. Changes to Terms</h2>
                        <p className="text-white/60 leading-relaxed">
                            We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the Service. Continued use after changes constitutes acceptance of the new terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">10. Contact Us</h2>
                        <p className="text-white/60 leading-relaxed">
                            If you have any questions about these Terms, please contact us at{' '}
                            <a href="mailto:legal@theskycircle.com" className="text-cosmic-purple hover:underline">
                                legal@theskycircle.com
                            </a>
                        </p>
                    </section>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-sm text-white/40 hover:text-white transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    )
}
