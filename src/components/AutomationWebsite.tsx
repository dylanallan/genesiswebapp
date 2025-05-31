import React from 'react';
import { Workflow, Sparkles, Users, Brain, CheckCircle2, ArrowRight, Globe, Shield, Dna, History, Lightbulb, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export const AutomationWebsite: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-genesis-50 to-spiritual-50">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Unlock Your
              <span className="text-spiritual-600"> Ancestral Wisdom</span>
              <br />
              Power Your
              <span className="text-genesis-600"> Business Future</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Genesis Ancestral Awakening bridges ancient wisdom with modern business automation. We help cultural entrepreneurs transform their heritage into powerful, automated business solutions while preserving their unique identity.
            </p>
            <div className="flex justify-center gap-4">
              <button className="px-8 py-4 bg-spiritual-600 text-white rounded-lg hover:bg-spiritual-700 transition-colors font-medium flex items-center">
                Discover Your Heritage <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button className="px-8 py-4 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 transition-colors font-medium flex items-center">
                Start Automating <Sparkles className="ml-2 w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Value Proposition */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Where Tradition Meets Innovation</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Transform your cultural heritage into a competitive advantage with our AI-powered automation platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Dna className="w-8 h-8 text-spiritual-500" />,
                title: "Cultural DNA Integration",
                description: "Preserve and amplify your cultural identity while modernizing your business operations."
              },
              {
                icon: <Brain className="w-8 h-8 text-genesis-500" />,
                title: "AI-Powered Automation",
                description: "Leverage cutting-edge AI to automate tasks while maintaining cultural authenticity."
              },
              {
                icon: <History className="w-8 h-8 text-spiritual-500" />,
                title: "Heritage-Driven Innovation",
                description: "Transform ancestral wisdom into modern business advantages."
              },
              {
                icon: <Target className="w-8 h-8 text-genesis-500" />,
                title: "Precision Automation",
                description: "Streamline operations with culturally-aware automated workflows."
              },
              {
                icon: <Lightbulb className="w-8 h-8 text-spiritual-500" />,
                title: "Cultural Intelligence",
                description: "Make decisions informed by both data and cultural wisdom."
              },
              {
                icon: <Globe className="w-8 h-8 text-genesis-500" />,
                title: "Global Impact",
                description: "Scale your cultural business model to reach international markets."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-genesis-50 to-spiritual-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Transform Your Heritage Into Success</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Experience the power of combining ancestral wisdom with modern automation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              "Preserve cultural authenticity while scaling operations",
              "Reduce operational costs by up to 70%",
              "Automate with cultural intelligence",
              "Build stronger community connections",
              "Access ancient wisdom through AI",
              "Create sustainable business growth"
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm"
              >
                <CheckCircle2 className="w-6 h-6 text-spiritual-500 flex-shrink-0" />
                <span className="text-gray-700">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-genesis-600 to-spiritual-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Ready to Awaken Your Business Potential?
          </h2>
          <button className="px-8 py-4 bg-white text-spiritual-600 rounded-lg hover:bg-spiritual-50 transition-colors font-medium">
            Begin Your Journey
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>About Us</li>
                <li>Our Mission</li>
                <li>Contact</li>
                <li>Blog</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Solutions</h3>
              <ul className="space-y-2">
                <li>Cultural Integration</li>
                <li>Business Automation</li>
                <li>Heritage Mapping</li>
                <li>Custom Development</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>Knowledge Base</li>
                <li>Case Studies</li>
                <li>Cultural Insights</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Cultural Guidelines</li>
                <li>Compliance</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            © 2025 Genesis Ancestral Awakening. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};