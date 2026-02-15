'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import Footer from '@/components/Footer'

const faqs = [
  {
    question: "What is SkyGuild?",
    answer: "SkyGuild is an astronomy community platform that helps you log celestial observations, earn badges, complete missions, attend events, and connect with fellow stargazers worldwide. Whether you're a beginner or experienced astronomer, SkyGuild makes stargazing more engaging and social."
  },
  {
    question: "Is SkyGuild free to use?",
    answer: "Yes! SkyGuild is completely free to use. You can create an account, log observations, earn badges, join events, and connect with the community at no cost."
  },
  {
    question: "Do I need a telescope to use SkyGuild?",
    answer: "No, you don't need a telescope! Many celestial objects can be observed with the naked eye or binoculars. SkyGuild is designed for all levels of astronomy enthusiasts, from those just starting with naked-eye observations to experienced astrophotographers."
  },
  {
    question: "How do I earn badges?",
    answer: "You earn badges by completing various astronomy activities like logging your first observation, observing different types of celestial objects, attending events, completing missions, and reaching milestones in your stargazing journey. Each badge represents an achievement in your astronomical exploration."
  },
  {
    question: "What are missions?",
    answer: "Missions are seasonal challenges that encourage you to observe specific celestial objects or phenomena. They might include hunting for nebulae, tracking planets, observing meteor showers, or photographing constellations. Completing missions earns you bonus points and special badges."
  },
  {
    question: "How does the leveling system work?",
    answer: "As you log observations and complete activities, you earn points that help you level up from Naked Eye Explorer to Cosmic Voyager. There are 5 levels total, each unlocking new features and recognition within the community."
  },
  {
    question: "Can I share my astrophotography?",
    answer: "Absolutely! You can upload photos with your observations and share them with the community. Other members can like, comment, and learn from your captures. It's a great way to showcase your work and inspire others."
  },
  {
    question: "How do I find astronomy events near me?",
    answer: "Check the Events page to see upcoming astronomy events, observation nights, meteor showers, and eclipse viewings. You can filter by location and date to find events near you or join virtual events from anywhere."
  },
  {
    question: "What is a Guild?",
    answer: "Guilds are groups of astronomy enthusiasts who share common interests or locations. You can join existing guilds or create your own to organize group observations, share knowledge, and build a local astronomy community."
  },
  {
    question: "How do I log an observation?",
    answer: "Click on 'Observations' in your dashboard, then 'New Observation'. Select the celestial object you observed, add details like date, time, location, equipment used, and any notes. You can also upload photos. Each logged observation earns you points!"
  },
  {
    question: "Can I use SkyGuild on mobile?",
    answer: "Yes! SkyGuild is fully responsive and works great on mobile devices. You can even install it as a Progressive Web App (PWA) on your phone for quick access during observation sessions."
  },
  {
    question: "How do I connect with other stargazers?",
    answer: "Use the Community and Discover pages to find and follow other astronomy enthusiasts. You can see their observations, interact with their posts, join the same guilds, and attend events together."
  }
]

// Structured data for FAQ
const structuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cosmic-purple/20 to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-effect rounded-full text-sm font-medium text-cosmic-purple mb-6">
            <HelpCircle className="w-4 h-4" />
            Frequently Asked Questions
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            Got Questions? <span className="text-gradient">We've Got Answers</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Everything you need to know about SkyGuild and getting started with your astronomy journey.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 flex-1">
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="glass-effect rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-bold text-lg pr-4">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-cosmic-purple transition-transform flex-shrink-0 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5 text-white/70 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 text-center glass-effect rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="text-white/70 mb-6">
            Can't find the answer you're looking for? Feel free to reach out to us.
          </p>
          <a
            href="mailto:hello@theskycircle.com"
            className="inline-block px-6 py-3 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-full font-semibold hover:scale-105 transition-transform"
          >
            Contact Support
          </a>
        </div>
      </div>

      <Footer />
    </div>
  )
}
