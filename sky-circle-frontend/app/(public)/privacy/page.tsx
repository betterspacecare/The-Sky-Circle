import { Shield } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
    return (
        <div className="min-h-screen py-16 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 glass-effect rounded-full text-sm font-medium text-cosmic-purple mb-6">
                        <Shield className="w-4 h-4" />
                        Legal
                    </div>
                    <h1 className="text-4xl font-black mb-4">Privacy Policy</h1>
                    <p className="text-white/50">Last updated: February 2026</p>
                </div>

                <div className="glass-effect rounded-2xl p-8 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold mb-4">1. Information We Collect</h2>
                        <div className="text-white/60 leading-relaxed space-y-3">
                            <p>We collect information you provide directly to us:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong className="text-white/80">Account Information:</strong> Name, email address, profile photo, and bio</li>
                                <li><strong className="text-white/80">Observation Data:</strong> Objects observed, dates, locations, and photos</li>
                                <li><strong className="text-white/80">Event Data:</strong> Event registrations and attendance</li>
                                <li><strong className="text-white/80">Communications:</strong> Messages, posts, and comments</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">2. Automatically Collected Information</h2>
                        <div className="text-white/60 leading-relaxed space-y-3">
                            <p>When you use our Service, we automatically collect:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Device information (type, operating system, browser)</li>
                                <li>Log data (IP address, access times, pages viewed)</li>
                                <li>Location data (with your permission, for observation logging)</li>
                                <li>Cookies and similar tracking technologies</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">3. How We Use Your Information</h2>
                        <div className="text-white/60 leading-relaxed space-y-3">
                            <p>We use the information we collect to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Provide, maintain, and improve our Service</li>
                                <li>Process transactions and send related information</li>
                                <li>Send notifications about events, missions, and updates</li>
                                <li>Respond to your comments and questions</li>
                                <li>Monitor and analyze trends and usage</li>
                                <li>Detect and prevent fraud and abuse</li>
                                <li>Personalize your experience</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">4. Information Sharing</h2>
                        <div className="text-white/60 leading-relaxed space-y-3">
                            <p>We may share your information in the following situations:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong className="text-white/80">With Your Consent:</strong> When you explicitly agree to sharing</li>
                                <li><strong className="text-white/80">Public Content:</strong> Posts and observations you make public</li>
                                <li><strong className="text-white/80">Service Providers:</strong> Third parties who assist in operating our Service</li>
                                <li><strong className="text-white/80">Legal Requirements:</strong> When required by law or to protect rights</li>
                            </ul>
                            <p className="mt-4">We do not sell your personal information to third parties.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">5. Data Security</h2>
                        <p className="text-white/60 leading-relaxed">
                            We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security but strive to use commercially acceptable means to protect your data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">6. Data Retention</h2>
                        <p className="text-white/60 leading-relaxed">
                            We retain your information for as long as your account is active or as needed to provide services. You can request deletion of your account and associated data at any time. Some information may be retained for legal or legitimate business purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">7. Your Rights</h2>
                        <div className="text-white/60 leading-relaxed space-y-3">
                            <p>You have the right to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Access your personal information</li>
                                <li>Correct inaccurate data</li>
                                <li>Request deletion of your data</li>
                                <li>Object to processing of your data</li>
                                <li>Export your data in a portable format</li>
                                <li>Withdraw consent at any time</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">8. Cookies</h2>
                        <p className="text-white/60 leading-relaxed">
                            We use cookies and similar technologies to collect information and improve your experience. You can control cookies through your browser settings. Disabling cookies may affect some features of the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">9. Children's Privacy</h2>
                        <p className="text-white/60 leading-relaxed">
                            Our Service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">10. Changes to This Policy</h2>
                        <p className="text-white/60 leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">11. Contact Us</h2>
                        <p className="text-white/60 leading-relaxed">
                            If you have questions about this Privacy Policy, please contact us at{' '}
                            <a href="mailto:privacy@theskycircle.com" className="text-cosmic-purple hover:underline">
                                privacy@theskycircle.com
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
