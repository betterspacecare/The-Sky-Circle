import { XCircle } from 'lucide-react'
import Link from 'next/link'

export default function CancellationPage() {
    return (
        <div className="min-h-screen py-16 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 glass-effect rounded-full text-sm font-medium text-cosmic-purple mb-6">
                        <XCircle className="w-4 h-4" />
                        Legal
                    </div>
                    <h1 className="text-4xl font-black mb-4">Cancellation & Refund Policy</h1>
                    <p className="text-white/50">Last updated: February 2026</p>
                </div>

                <div className="glass-effect rounded-2xl p-8 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold mb-4">1. Event Cancellations by Users</h2>
                        <div className="text-white/60 leading-relaxed space-y-3">
                            <p>If you need to cancel your registration for an event:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong className="text-white/80">Free Events:</strong> You can cancel anytime through your dashboard at no cost</li>
                                <li><strong className="text-white/80">Paid Events (7+ days before):</strong> Full refund minus processing fees</li>
                                <li><strong className="text-white/80">Paid Events (3-7 days before):</strong> 50% refund</li>
                                <li><strong className="text-white/80">Paid Events (less than 3 days):</strong> No refund, but you may transfer your spot to another user</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">2. Event Cancellations by The Sky Circle</h2>
                        <div className="text-white/60 leading-relaxed space-y-3">
                            <p>We may cancel events due to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Adverse weather conditions (cloudy skies, rain, storms)</li>
                                <li>Insufficient registrations (minimum attendance not met)</li>
                                <li>Venue unavailability</li>
                                <li>Safety concerns</li>
                                <li>Unforeseen circumstances</li>
                            </ul>
                            <p className="mt-4">
                                In case of cancellation by us, you will receive a <strong className="text-white/80">full refund</strong> within 5-7 business days, or you may choose to transfer your registration to a future event.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">3. Weather-Related Cancellations</h2>
                        <p className="text-white/60 leading-relaxed">
                            Stargazing events are weather-dependent. We monitor conditions closely and will notify registered participants at least 4 hours before the event if cancellation is necessary. Weather cancellations qualify for full refunds or event transfers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">4. How to Request a Refund</h2>
                        <div className="text-white/60 leading-relaxed space-y-3">
                            <p>To request a refund:</p>
                            <ol className="list-decimal list-inside space-y-2 ml-4">
                                <li>Go to your Dashboard → Events → My Registrations</li>
                                <li>Find the event and click "Cancel Registration"</li>
                                <li>Select "Request Refund" if applicable</li>
                                <li>Confirm your cancellation</li>
                            </ol>
                            <p className="mt-4">
                                Alternatively, email us at{' '}
                                <a href="mailto:refunds@theskycircle.com" className="text-cosmic-purple hover:underline">
                                    refunds@theskycircle.com
                                </a>{' '}
                                with your registration details.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">5. Refund Processing</h2>
                        <div className="text-white/60 leading-relaxed space-y-3">
                            <p>Refunds are processed as follows:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Refunds are issued to the original payment method</li>
                                <li>Processing time: 5-7 business days</li>
                                <li>Bank processing may take additional 3-5 days</li>
                                <li>You will receive email confirmation when refund is processed</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">6. Non-Refundable Items</h2>
                        <div className="text-white/60 leading-relaxed space-y-3">
                            <p>The following are non-refundable:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Processing fees and transaction charges</li>
                                <li>No-shows (failure to attend without cancellation)</li>
                                <li>Late arrivals that miss the event</li>
                                <li>Merchandise or physical goods (separate return policy applies)</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">7. Event Transfers</h2>
                        <p className="text-white/60 leading-relaxed">
                            If you cannot attend an event, you may transfer your registration to another person up to 24 hours before the event. Contact us with the new attendee's details. The new attendee must create a Sky Circle account if they don't have one.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">8. Account Cancellation</h2>
                        <div className="text-white/60 leading-relaxed space-y-3">
                            <p>If you wish to delete your account:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Go to Profile → Settings → Delete Account</li>
                                <li>Your observations and posts will be permanently deleted</li>
                                <li>Points and badges cannot be recovered</li>
                                <li>Active event registrations should be cancelled first</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">9. Disputes</h2>
                        <p className="text-white/60 leading-relaxed">
                            If you believe you are entitled to a refund that was denied, please contact us at{' '}
                            <a href="mailto:support@theskycircle.com" className="text-cosmic-purple hover:underline">
                                support@theskycircle.com
                            </a>{' '}
                            with your case details. We will review and respond within 48 hours.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">10. Contact Us</h2>
                        <p className="text-white/60 leading-relaxed">
                            For any questions about cancellations or refunds, reach out to us at{' '}
                            <a href="mailto:support@theskycircle.com" className="text-cosmic-purple hover:underline">
                                support@theskycircle.com
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
