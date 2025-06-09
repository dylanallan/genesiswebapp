import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Brain, 
  Globe, 
  TrendingUp, 
  Users,
  ArrowRight,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  X
} from 'lucide-react';
import { toast } from 'sonner';

const HackathonPitch: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const slides = [
    {
      title: "Genesis Heritage Pro",
      subtitle: "AI-Powered Business Automation with Cultural Intelligence",
      content: (
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Brain className="w-24 h-24 text-genesis-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-genesis-600 to-spiritual-600 bg-clip-text text-transparent">
              Genesis Heritage Pro
            </h2>
            <p className="text-xl text-gray-600 mt-2">
              The world's first culturally-intelligent AI platform
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <Brain className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">AI-First</h3>
              <p className="text-sm text-gray-600">Built for the AI era, not retrofitted</p>
            </div>
            
            <div className="bg-spiritual-50 p-4 rounded-lg border border-spiritual-100">
              <Globe className="w-8 h-8 text-spiritual-500 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">Cultural Intelligence</h3>
              <p className="text-sm text-gray-600">Heritage-aware business automation</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">$37M Valuation</h3>
              <p className="text-sm text-gray-600">Validated by 50+ enterprise prospects</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "The Problem",
      subtitle: "Businesses lose $2.9M annually to inefficient workflows",
      content: (
        <div>
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              The Problem We're Solving
            </h3>
            <p className="text-gray-600 text-lg">
              Businesses lose $2.9M annually to inefficient workflows. Existing tools are one-size-fits-all and ignore cultural nuances that drive real business decisions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-50 p-5 rounded-lg border border-red-100">
              <h4 className="font-medium text-red-900 mb-3">Current Challenges</h4>
              <ul className="space-y-2">
                {[
                  "Generic automation ignores cultural context",
                  "Disconnected tools create data silos",
                  "Cultural heritage lost in digital transformation",
                  "No AI-native solutions built for modern business"
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mr-2" />
                    <span className="text-red-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
              <h4 className="font-medium text-blue-900 mb-3">Our Solution</h4>
              <ul className="space-y-2">
                {[
                  "AI-powered automation with cultural awareness",
                  "Unified platform for all business processes",
                  "Heritage preservation integrated with operations",
                  "Built from the ground up for the AI era"
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mr-2" />
                    <span className="text-blue-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "The Solution",
      subtitle: "AI-Native Business Intelligence Platform",
      content: (
        <div>
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Our Solution: Genesis Heritage Pro
            </h3>
            <p className="text-gray-600 text-lg">
              An AI-native business intelligence platform that combines advanced automation with cultural context awareness.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <Zap className="w-8 h-8 text-blue-500 mb-3" />
              <h4 className="font-medium text-gray-900 mb-2">AI-Powered Automation</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Multi-model AI routing system</li>
                <li>• Natural language workflow creation</li>
                <li>• Predictive business intelligence</li>
                <li>• Automated decision support</li>
              </ul>
            </div>
            
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <Globe className="w-8 h-8 text-spiritual-500 mb-3" />
              <h4 className="font-medium text-gray-900 mb-2">Cultural Intelligence</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Heritage-aware business practices</li>
                <li>• Cultural context in communications</li>
                <li>• Tradition preservation tools</li>
                <li>• Cross-cultural business insights</li>
              </ul>
            </div>
            
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <Users className="w-8 h-8 text-green-500 mb-3" />
              <h4 className="font-medium text-gray-900 mb-2">Enterprise Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Real-time collaboration</li>
                <li>• Enterprise-grade security</li>
                <li>• Custom integrations</li>
                <li>• White-label options</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Market Opportunity",
      subtitle: "$50B Total Addressable Market",
      content: (
        <div>
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Market Validation for $37M Valuation
            </h3>
            <p className="text-gray-600 text-lg">
              We're targeting a $50B market with a unique solution that has no direct competitors.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Comparable Companies</h4>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Zapier</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-bold">$5B</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Notion</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-bold">$10B</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Genesis Heritage Pro</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-bold">$37M target</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Key Metrics to Achieve</h4>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">ARR Growth</div>
                      <div className="text-xl font-bold text-gray-900">300%</div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Customer Retention</div>
                      <div className="text-xl font-bold text-gray-900">95%+</div>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Gross Margins</div>
                      <div className="text-xl font-bold text-gray-900">85%+</div>
                    </div>
                    <DollarSign className="w-8 h-8 text-purple-500" />
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Revenue Model",
      subtitle: "Tiered Subscription + White-label",
      content: (
        <div>
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Revenue Model Optimization
            </h3>
            <p className="text-gray-600 text-lg">
              Our multi-tiered approach targets businesses from SMBs to enterprise clients.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-2">Tier 1: Starter</h4>
              <div className="text-2xl font-bold text-gray-900 mb-1">$99/month</div>
              <p className="text-sm text-gray-500 mb-3">Basic AI automation</p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• 5 workflows</li>
                <li>• 10,000 AI requests</li>
                <li>• Email support</li>
              </ul>
              <div className="mt-3 text-xs text-blue-600">
                Target: Small businesses
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-genesis-50 to-spiritual-50 p-4 rounded-lg border border-spiritual-200 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-2">Tier 2: Professional</h4>
              <div className="text-2xl font-bold text-gray-900 mb-1">$499/month</div>
              <p className="text-sm text-gray-500 mb-3">Advanced analytics + cultural insights</p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Unlimited workflows</li>
                <li>• 50,000 AI requests</li>
                <li>• Priority support</li>
                <li>• Cultural heritage tools</li>
              </ul>
              <div className="mt-3 text-xs text-blue-600">
                Target: Mid-market companies
              </div>
            </div>
            
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 shadow-sm text-white">
              <h4 className="font-medium text-white mb-2">Tier 3: Enterprise</h4>
              <div className="text-2xl font-bold text-white mb-1">$2,999/month</div>
              <p className="text-sm text-gray-300 mb-3">Full platform + custom integrations</p>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• Unlimited everything</li>
                <li>• Custom AI training</li>
                <li>• Dedicated support</li>
                <li>• SSO & advanced security</li>
                <li>• SLA guarantees</li>
              </ul>
              <div className="mt-3 text-xs text-blue-300">
                Target: Large enterprises
              </div>
            </div>
            
            <div className="bg-blue-900 p-4 rounded-lg border border-blue-700 shadow-sm text-white">
              <h4 className="font-medium text-white mb-2">Tier 4: White-label</h4>
              <div className="text-xl font-bold text-white mb-1">$50K setup + 20%</div>
              <p className="text-sm text-blue-200 mb-3">Revenue share model</p>
              <ul className="space-y-1 text-sm text-blue-200">
                <li>• Custom branding</li>
                <li>• Reseller capabilities</li>
                <li>• Custom development</li>
                <li>• Dedicated infrastructure</li>
                <li>• Joint marketing</li>
              </ul>
              <div className="mt-3 text-xs text-blue-300">
                Target: Agencies & partners
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="flex items-start">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="ml-3">
                <h4 className="font-medium text-green-900">Projected Revenue</h4>
                <p className="text-sm text-green-700 mt-1">
                  Year 1: $2.5M ARR • Year 2: $7.5M ARR • Year 3: $22.5M ARR
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Competitive Advantages",
      subtitle: "5 Key Differentiators",
      content: (
        <div>
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Competitive Advantages
            </h3>
            <p className="text-gray-600 text-lg">
              Our unique positioning creates significant barriers to entry for competitors.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-spiritual-50 to-spiritual-100 p-5 rounded-lg border border-spiritual-200">
                <Globe className="w-8 h-8 text-spiritual-500 mb-3" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Cultural Intelligence</h4>
                <p className="text-gray-700">
                  No competitor offers heritage-aware business automation. Our cultural context engine provides a unique competitive advantage that's difficult to replicate.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200">
                <Brain className="w-8 h-8 text-blue-500 mb-3" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">AI-First Architecture</h4>
                <p className="text-gray-700">
                  Built for the AI era, not retrofitted like competitors. Our multi-model AI routing system selects the optimal AI for each specific task.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-5 rounded-lg border border-green-200">
                <Users className="w-8 h-8 text-green-500 mb-3" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Real-time Collaboration</h4>
                <p className="text-gray-700">
                  Seamless team workflows with conflict resolution, video integration, and AI-powered meeting transcription and insights.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-5 rounded-lg border border-purple-200">
                <TrendingUp className="w-8 h-8 text-purple-500 mb-3" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Predictive Analytics</h4>
                <p className="text-gray-700">
                  Business insights before problems occur. Our AI analyzes patterns to predict outcomes with 95% accuracy, allowing proactive decision-making.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-5 rounded-lg border border-red-200">
                <Shield className="w-8 h-8 text-red-500 mb-3" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Enterprise Security</h4>
                <p className="text-gray-700">
                  Bank-level data protection with end-to-end encryption, hardware key support, and automatic data governance for GDPR/CCPA compliance.
                </p>
              </div>
              
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Competitor Analysis</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Us</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Zapier</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Notion</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Cultural Intelligence</td>
                        <td className="px-3 py-2 whitespace-nowrap text-center"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                        <td className="px-3 py-2 whitespace-nowrap text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                        <td className="px-3 py-2 whitespace-nowrap text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">AI-First Architecture</td>
                        <td className="px-3 py-2 whitespace-nowrap text-center"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                        <td className="px-3 py-2 whitespace-nowrap text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                        <td className="px-3 py-2 whitespace-nowrap text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Predictive Analytics</td>
                        <td className="px-3 py-2 whitespace-nowrap text-center"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                        <td className="px-3 py-2 whitespace-nowrap text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                        <td className="px-3 py-2 whitespace-nowrap text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Demo Script",
      subtitle: "8-Minute Presentation Flow",
      content: (
        <div>
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Hackathon Demo Script
            </h3>
            <p className="text-gray-600 text-lg">
              A carefully crafted presentation flow to maximize impact in 8 minutes.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <h4 className="text-lg font-medium text-gray-900">Opening Hook (30 seconds)</h4>
              </div>
              <div className="ml-11">
                <p className="text-gray-700 italic">
                  "What if your business automation could understand not just your processes, but your cultural context and heritage? We've built the world's first culturally-intelligent AI platform."
                </p>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <h4 className="text-lg font-medium text-gray-900">Problem Statement (1 minute)</h4>
              </div>
              <div className="ml-11">
                <p className="text-gray-700 italic">
                  "Businesses lose $2.9M annually to inefficient workflows. Existing tools are one-size-fits-all and ignore cultural nuances that drive real business decisions."
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Show pain points with current solutions</li>
                    <li>Highlight cultural disconnects in business tools</li>
                    <li>Present market research statistics</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <h4 className="text-lg font-medium text-gray-900">Solution Demo (3 minutes)</h4>
              </div>
              <div className="ml-11">
                <p className="text-gray-700 italic">
                  "Watch as our AI creates custom automation workflows that respect your business culture while optimizing for maximum efficiency."
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Live demo of workflow creation</li>
                    <li>Show cultural intelligence in action</li>
                    <li>Demonstrate real-time analytics</li>
                    <li>Highlight mobile responsiveness</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <h4 className="text-lg font-medium text-gray-900">Business Impact (2 minutes)</h4>
              </div>
              <div className="ml-11">
                <p className="text-gray-700 italic">
                  "Our platform delivers 300% ROI within the first year through time savings, error reduction, and cultural alignment."
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Show ROI calculator with real numbers</li>
                    <li>Present case study preview</li>
                    <li>Demonstrate competitive advantages</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  5
                </div>
                <h4 className="text-lg font-medium text-gray-900">Market Validation (1 minute)</h4>
              </div>
              <div className="ml-11">
                <p className="text-gray-700 italic">
                  "We've already identified a $50B market opportunity with early validation from 50+ enterprise prospects."
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Show market size and growth projections</li>
                    <li>Present competitor analysis</li>
                    <li>Highlight unique positioning</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  6
                </div>
                <h4 className="text-lg font-medium text-gray-900">Closing & Call to Action (30 seconds)</h4>
              </div>
              <div className="ml-11">
                <p className="text-gray-700 italic">
                  "Genesis Heritage Pro is the future of business automation - culturally intelligent, AI-native, and built for the modern enterprise. Join us in transforming how businesses operate while honoring their heritage."
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Winning Strategy",
      subtitle: "Hackathon Victory Plan",
      content: (
        <div>
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Hackathon Winning Strategy
            </h3>
            <p className="text-gray-600 text-lg">
              Our approach to winning the hackathon and securing the $37M valuation.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                <h4 className="font-medium text-blue-900 mb-3">Technical Excellence (30%)</h4>
                <ul className="space-y-2">
                  {[
                    "Advanced AI integration with multiple models",
                    "Scalable architecture with error recovery",
                    "Performance optimization with circuit breakers",
                    "Clean, maintainable code with proper testing"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mr-2" />
                      <span className="text-blue-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-purple-50 p-5 rounded-lg border border-purple-100">
                <h4 className="font-medium text-purple-900 mb-3">Innovation (25%)</h4>
                <ul className="space-y-2">
                  {[
                    "Cultural intelligence (unique in market)",
                    "Multi-model AI routing system",
                    "Heritage-aware business automation",
                    "Predictive analytics with cultural context"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mr-2" />
                      <span className="text-purple-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-green-50 p-5 rounded-lg border border-green-100">
                <h4 className="font-medium text-green-900 mb-3">Market Potential (25%)</h4>
                <ul className="space-y-2">
                  {[
                    "$50B total addressable market",
                    "Clear monetization strategy with 4 tiers",
                    "85%+ gross margins (SaaS standard)",
                    "Unique positioning with no direct competitors"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mr-2" />
                      <span className="text-green-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-amber-50 p-5 rounded-lg border border-amber-100">
                <h4 className="font-medium text-amber-900 mb-3">Execution (20%)</h4>
                <ul className="space-y-2">
                  {[
                    "Professional presentation with clear narrative",
                    "Working demo with real-time functionality",
                    "Polished UI/UX with attention to detail",
                    "Comprehensive business model with ROI calculator"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mr-2" />
                      <span className="text-amber-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-8 bg-gradient-to-r from-genesis-100 to-spiritual-100 p-5 rounded-lg border border-genesis-200">
            <h4 className="font-medium text-gray-900 mb-3">Secret Sauce: Cultural AI Advantage</h4>
            <p className="text-gray-700">
              Our platform's unique positioning around cultural intelligence and heritage-aware automation is our strongest differentiator. No major player (Zapier, Microsoft, Google) offers this level of cultural context in business automation.
            </p>
            <p className="text-gray-700 mt-2 font-medium">
              This is our path to $37M and hackathon victory.
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    
    if (!isPlaying) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => {
          if (prev >= slides.length - 1) {
            clearInterval(interval);
            setIsPlaying(false);
            return slides.length - 1;
          }
          return prev + 1;
        });
      }, 10000); // 10 seconds per slide
      
      return () => clearInterval(interval);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-genesis-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{slides[currentSlide].title}</h2>
            <p className="text-sm text-gray-500">{slides[currentSlide].subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 min-h-[400px]">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {slides[currentSlide].content}
        </motion.div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handlePrev}
          disabled={currentSlide === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous</span>
        </button>
        
        <div className="flex items-center space-x-1">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                currentSlide === index
                  ? 'bg-genesis-500'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePlayPause}
            className={`p-2 rounded-full transition-colors ${
              isPlaying
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentSlide === slides.length - 1}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white rounded-lg hover:from-genesis-600 hover:to-spiritual-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HackathonPitch;