import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Rocket, BarChart3, Globe, Zap, Award, Users, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const stats = [
  { label: 'Active Users', value: '1,247' },
  { label: 'Data Sources', value: '112+' },
  { label: 'AI Models', value: '7' },
  { label: 'Uptime', value: '99.99%' },
];

const showcase = [
  { icon: Brain, title: 'Hyperintelligence', desc: 'Multi-provider, RAG, source-citing, hallucination-free AI.' },
  { icon: Globe, title: 'Global Data Hub', desc: '100+ authoritative sources, real-time ingestion, analytics.' },
  { icon: Zap, title: 'Automation', desc: 'Business, genealogy, and cultural process automation.' },
  { icon: Award, title: 'Voice & DNA', desc: 'ElevenLabs voice, DNA insights, family tree, and more.' },
];

export const GenesisHome: React.FC = () => {
  const navigate = useNavigate?.() ?? (() => {});
  return (
    <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-spiritual-50 flex flex-col items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center mb-10">
        <div className="flex items-center justify-center mb-4">
          <Brain className="w-12 h-12 text-genesis-600 mr-2" />
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-genesis-600 to-spiritual-600 bg-clip-text text-transparent">Genesis Heritage Pro</h1>
        </div>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">The world's most advanced genealogy, cultural, and business AI platform. Unify your heritage, automate your future, and unlock hyperintelligence.</p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }} className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-genesis-500 flex flex-col items-center">
            <span className="text-2xl font-bold text-genesis-700">{stat.value}</span>
            <span className="text-gray-600 text-sm mt-1">{stat.label}</span>
          </div>
        ))}
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: 0.7 }} className="w-full max-w-4xl mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <button onClick={() => navigate('/dashboard')} className="bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white rounded-xl shadow-xl p-8 flex flex-col items-center hover:scale-105 transition-transform">
            <Home className="w-8 h-8 mb-2" />
            <span className="text-xl font-bold">Power Dashboard</span>
            <span className="text-sm mt-2">Full-featured, modular, and analytics-rich</span>
          </button>
          <button onClick={() => navigate('/hackathon')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-xl p-8 flex flex-col items-center hover:scale-105 transition-transform">
            <Rocket className="w-8 h-8 mb-2" />
            <span className="text-xl font-bold">Hackathon Mode</span>
            <span className="text-sm mt-2">Live demo, real-time metrics, and AI showcase</span>
          </button>
          <button onClick={() => navigate('/intelligence')} className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl shadow-xl p-8 flex flex-col items-center hover:scale-105 transition-transform">
            <BarChart3 className="w-8 h-8 mb-2" />
            <span className="text-xl font-bold">Intelligence Hub</span>
            <span className="text-sm mt-2">Global, competitive, and advanced analytics</span>
          </button>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.7 }} className="w-full max-w-5xl">
        <h2 className="text-2xl font-bold text-genesis-700 mb-6 text-center">Why Genesis is #1</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {showcase.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center">
              <Icon className="w-8 h-8 text-genesis-600 mb-2" />
              <span className="font-semibold text-lg text-gray-900">{title}</span>
              <span className="text-gray-600 text-sm mt-2 text-center">{desc}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default GenesisHome; 