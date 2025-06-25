import React from 'react';
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from './lib/session-context';
import Auth from './components/Auth';
import GlobalIntelligenceDashboard from './components/GlobalIntelligenceDashboard';
import Chat from './components/Chat';
import VoicePlayer from './components/VoicePlayer';
import AutomationHub from './components/AutomationHub';
import DNAInsights from './components/DNAInsights';
import CulturalRecipeBook from './components/CulturalRecipeBook';
import TimelineBuilder from './components/TimelineBuilder';
import VoiceCloning from './components/VoiceCloning';
import FamilyTreeVoiceAgent from './components/FamilyTreeVoiceAgent';
import AdvancedAnalyticsDashboard from './components/AdvancedAnalyticsDashboard';
import SystemDashboard from './components/SystemDashboard';
import MarketingAutomation from './components/MarketingAutomation';
import { CulturalBusinessFusion } from './components/CulturalBusinessFusion';
import { InnovationShowcase } from './components/InnovationShowcase';
import CompetitiveIntelligenceDashboard from './components/CompetitiveIntelligenceDashboard';
import DataAnalyticsDashboard from './components/DataAnalyticsDashboard';
import HyperintelligenceBotInterface from './components/HyperintelligenceBotInterface';

// Create a client
const queryClient = new QueryClient();

function App() {
  const features = [
    {
      id: 'dashboard',
      name: 'Global Intelligence',
      icon: '🌍',
      component: () => (
        <div className="h-full p-4">
          <GlobalIntelligenceDashboard />
        </div>
      ),
      description: 'Global intelligence and cross-domain analytics'
    },
    {
      id: 'hyperintelligence-bots',
      name: 'Hyperintelligence Bots',
      icon: '🤖',
      component: () => (
        <div className="h-full p-4">
          <HyperintelligenceBotInterface />
        </div>
      ),
      description: 'Advanced AI bots with comprehensive data access'
    },
    {
      id: 'chat',
      name: 'AI Chat',
      icon: '💬',
      component: () => (
        <div className="h-full p-4">
          <Chat />
        </div>
      ),
      description: 'Advanced AI chat interface'
    },
    {
      id: 'voice',
      name: 'Voice Synthesis',
      icon: '🎤',
      component: () => (
        <div className="h-full p-4">
          <VoicePlayer />
        </div>
      ),
      description: 'Morgan Freeman-style voice synthesis'
    },
    {
      id: 'automation',
      name: 'Automation Hub',
      icon: '⚡',
      component: () => (
        <div className="h-full p-4">
          <AutomationHub />
        </div>
      ),
      description: 'Business process automation'
    },
    {
      id: 'dna',
      name: 'DNA Insights',
      icon: '🧬',
      component: () => (
        <div className="h-full p-4">
          <DNAInsights />
        </div>
      ),
      description: 'Genetic heritage analysis'
    },
    {
      id: 'recipes',
      name: 'Cultural Recipes',
      icon: '📖',
      component: () => (
        <div className="h-full p-4">
          <CulturalRecipeBook />
        </div>
      ),
      description: 'Family recipe preservation'
    },
    {
      id: 'timeline',
      name: 'Timeline Builder',
      icon: '📅',
      component: () => (
        <div className="h-full p-4">
          <TimelineBuilder />
        </div>
      ),
      description: 'Family history timeline'
    },
    {
      id: 'voice-cloning',
      name: 'Voice Cloning',
      icon: '🎭',
      component: () => (
        <div className="h-full p-4">
          <VoiceCloning />
        </div>
      ),
      description: 'Advanced voice cloning technology'
    },
    {
      id: 'family-tree',
      name: 'Family Tree Agent',
      icon: '🌳',
      component: () => (
        <div className="h-full p-4">
          <FamilyTreeVoiceAgent />
        </div>
      ),
      description: 'AI-powered family tree assistant'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: '📊',
      component: () => (
        <div className="h-full p-4">
          <AdvancedAnalyticsDashboard />
        </div>
      ),
      description: 'Advanced analytics dashboard'
    },
    {
      id: 'system',
      name: 'System',
      icon: '⚙️',
      component: () => (
        <div className="h-full p-4">
          <SystemDashboard />
        </div>
      ),
      description: 'System monitoring and control'
    },
    {
      id: 'marketing',
      name: 'Marketing',
      icon: '📈',
      component: () => (
        <div className="h-full p-4">
          <MarketingAutomation />
        </div>
      ),
      description: 'Marketing automation tools'
    },
    {
      id: 'cultural-business',
      name: 'Cultural Business Fusion',
      icon: '🏢',
      component: () => (
        <div className="h-full p-4">
          <CulturalBusinessFusion />
        </div>
      ),
      description: 'Cultural intelligence in business'
    },
    {
      id: 'innovation',
      name: 'Innovation Showcase',
      icon: '🚀',
      component: () => (
        <div className="h-full p-4">
          <InnovationShowcase />
        </div>
      ),
      description: 'Showcase of cutting-edge innovations'
    },
    {
      id: 'competitive-intelligence',
      name: 'Competitive Intelligence',
      icon: '🎯',
      component: () => (
        <div className="h-full p-4">
          <CompetitiveIntelligenceDashboard />
        </div>
      ),
      description: 'Real-time competitive intelligence analysis'
    },
    {
      id: 'data-analytics',
      name: 'Data Analytics',
      icon: '📊',
      component: () => (
        <div className="h-full p-4">
          <DataAnalyticsDashboard />
        </div>
      ),
      description: 'Advanced data analytics and insights'
    }
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <Auth>
              <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-white text-center mb-8">
                  🧬 Genesis Heritage Pro
                </h1>
                <p className="text-xl text-blue-200 text-center mb-12">
                  AI-Powered Cultural Heritage & Business Intelligence Platform
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {features.map((feature) => (
                    <div
                      key={feature.id}
                      className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all cursor-pointer group"
                      onClick={() => {
                        // Handle navigation to feature
                        console.log(`Navigating to ${feature.name}`);
                      }}
                    >
                      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {feature.name}
                      </h3>
                      <p className="text-blue-200 text-sm">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Auth>
          </div>
        </Router>
      </SessionProvider>
    </QueryClientProvider>
  );
}

export default App; 