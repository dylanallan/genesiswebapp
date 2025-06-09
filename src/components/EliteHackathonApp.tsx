import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Bot, 
  TrendingUp, 
  Users, 
  Shield, 
  Zap, 
  Globe, 
  Brain, 
  BarChart3,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Target,
  Clock,
  Activity,
  Sparkles,
  Rocket,
  Crown,
  Award
} from 'lucide-react';

const EliteHackathonApp = () => {
  // Advanced state management
  const [currentView, setCurrentView] = useState('dashboard');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    activeUsers: 1247,
    automationsRunning: 89,
    culturalInsights: 156,
    revenueToday: 47832,
    predictionAccuracy: 94.7
  });
  const [automationDemo, setAutomationDemo] = useState(false);
  const [culturalContext, setCulturalContext] = useState('global');
  const [notifications, setNotifications] = useState([]);

  // Simulated real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeMetrics(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10 - 5),
        automationsRunning: prev.automationsRunning + Math.floor(Math.random() * 6 - 3),
        revenueToday: prev.revenueToday + Math.floor(Math.random() * 1000),
        predictionAccuracy: Math.min(99.9, prev.predictionAccuracy + (Math.random() * 0.2 - 0.1))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // AI Demo Simulation
  const runAIDemo = useCallback(async () => {
    setAiProcessing(true);
    setAutomationDemo(true);
    
    // Simulate AI processing steps
    const steps = [
      'Analyzing business context...',
      'Detecting cultural patterns...',
      'Generating automation rules...',
      'Optimizing for efficiency...',
      'Validating compliance...',
      'Deploying automation...'
    ];
    
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNotifications(prev => [...prev.slice(-2), {
        id: Date.now() + i,
        message: steps[i],
        type: 'info'
      }]);
    }
    
    setAiProcessing(false);
    setNotifications(prev => [...prev.slice(-2), {
      id: Date.now(),
      message: 'Automation deployed successfully! 🚀',
      type: 'success'
    }]);
  }, []);

  // Memoized components for performance
  const MetricCard = useMemo(() => ({ title, value, icon: Icon, change, color = 'blue' }) => (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 border-${color}-500 transform hover:scale-105 transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p className={`text-sm mt-1 flex items-center ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              {change > 0 ? '+' : ''}{change}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-8 h-8 text-${color}-600`} />
        </div>
      </div>
    </div>
  ), []);

  const CulturalInsightCard = useMemo(() => ({ culture, insight, confidence, impact }) => (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">{culture} Context</h4>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          confidence > 90 ? 'bg-green-100 text-green-800' :
          confidence > 75 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {confidence}% confident
        </span>
      </div>
      <p className="text-gray-700 mb-3">{insight}</p>
      <div className="flex items-center text-sm text-gray-600">
        <Target className="w-4 h-4 mr-1" />
        Potential Impact: {impact}
      </div>
    </div>
  ), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Elite Header */}
      <header className="bg-white shadow-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CulturalAI Pro
                </h1>
                <p className="text-sm text-gray-600">Elite Business Automation Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-800 text-sm font-medium">Live Demo</span>
              </div>
              <button
                onClick={runAIDemo}
                disabled={aiProcessing}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg disabled:opacity-50"
              >
                {aiProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    <span>Run AI Demo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'automation', label: 'AI Automation', icon: Bot },
              { id: 'cultural', label: 'Cultural Intelligence', icon: Globe },
              { id: 'analytics', label: 'Predictive Analytics', icon: TrendingUp },
              { id: 'collaboration', label: 'Team Workspace', icon: Users }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentView(id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors duration-200 ${
                  currentView === id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.slice(-3).map(notif => (
            <div
              key={notif.id}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg animate-slide-in ${
                notif.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                notif.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
                'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              {notif.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {notif.type === 'error' && <AlertTriangle className="w-5 h-5" />}
              {notif.type === 'info' && <Activity className="w-5 h-5" />}
              <span className="font-medium">{notif.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentView === 'dashboard' && (
          <div className="space-y-8">
            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <MetricCard
                title="Active Users"
                value={realTimeMetrics.activeUsers.toLocaleString()}
                icon={Users}
                change={12.5}
                color="blue"
              />
              <MetricCard
                title="Automations Running"
                value={realTimeMetrics.automationsRunning}
                icon={Bot}
                change={8.3}
                color="green"
              />
              <MetricCard
                title="Cultural Insights"
                value={realTimeMetrics.culturalInsights}
                icon={Globe}
                change={15.7}
                color="purple"
              />
              <MetricCard
                title="Revenue Today"
                value={`$${realTimeMetrics.revenueToday.toLocaleString()}`}
                icon={DollarSign}
                change={23.1}
                color="emerald"
              />
              <MetricCard
                title="AI Accuracy"
                value={`${realTimeMetrics.predictionAccuracy.toFixed(1)}%`}
                icon={Target}
                change={2.1}
                color="orange"
              />
            </div>

            {/* AI-Powered Insights */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">AI-Powered Business Insights</h2>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Updated 2 minutes ago</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CulturalInsightCard
                  culture="East Asian"
                  insight="Teams prefer consensus-based decision making. Recommend implementing group approval workflows for major business decisions."
                  confidence={94}
                  impact="23% efficiency increase"
                />
                <CulturalInsightCard
                  culture="Nordic"
                  insight="High trust culture enables autonomous workflows. Reduce approval steps and increase individual authority levels."
                  confidence={87}
                  impact="31% faster execution"
                />
              </div>
            </div>

            {/* Real-time Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">System Performance</h3>
                <div className="space-y-4">
                  {[
                    { label: 'API Response Time', value: '< 100ms', status: 'excellent' },
                    { label: 'Database Performance', value: '99.9% uptime', status: 'excellent' },
                    { label: 'AI Processing Speed', value: '2.3s average', status: 'good' },
                    { label: 'Security Score', value: 'A+ Grade', status: 'excellent' }
                  ].map(({ label, value, status }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-gray-700">{label}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{value}</span>
                        <div className={`w-3 h-3 rounded-full ${
                          status === 'excellent' ? 'bg-green-500' :
                          status === 'good' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Revenue Projections</h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      $37M
                    </div>
                    <p className="text-gray-600 mt-2">Projected Valuation</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">$2.1M</div>
                      <p className="text-sm text-gray-600">Monthly ARR</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">94%</div>
                      <p className="text-sm text-gray-600">Retention Rate</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'automation' && (
          <div className="space-y-8">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">AI-Powered Automation Engine</h2>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Create intelligent workflows that understand your business culture and optimize automatically
              </p>
              
              {automationDemo ? (
                <div className="bg-white rounded-xl shadow-xl p-8 max-w-4xl mx-auto">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <span className="font-medium text-green-900">Customer Onboarding Automation</span>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        Active
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">847</div>
                        <div className="text-sm text-gray-600">Customers Processed</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">94.2%</div>
                        <div className="text-sm text-gray-600">Success Rate</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">3.2hrs</div>
                        <div className="text-sm text-gray-600">Time Saved</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={runAIDemo}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg transform hover:scale-105"
                >
                  Launch AI Automation Demo
                </button>
              )}
            </div>
          </div>
        )}

        {currentView === 'cultural' && (
          <div className="space-y-8">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-6">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Cultural Intelligence Engine</h2>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                The world's first AI that understands cultural context in business automation
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Cultural Adaptation Matrix</h3>
                <div className="space-y-4">
                  {[
                    { culture: 'Japanese', adaptation: 'Consensus-driven workflows', impact: '+31% efficiency' },
                    { culture: 'German', adaptation: 'Process-focused automation', impact: '+27% accuracy' },
                    { culture: 'Brazilian', adaptation: 'Relationship-centric flows', impact: '+43% adoption' },
                    { culture: 'Scandinavian', adaptation: 'Trust-based approvals', impact: '+38% speed' }
                  ].map(({ culture, adaptation, impact }) => (
                    <div key={culture} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-gray-900">{culture}</div>
                        <div className="text-sm text-gray-600">{adaptation}</div>
                      </div>
                      <div className="text-green-600 font-semibold">{impact}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Heritage Integration</h3>
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Crown className="w-5 h-5 text-amber-600" />
                      <span className="font-semibold text-amber-900">Family Business Traditions</span>
                    </div>
                    <p className="text-amber-800 text-sm">
                      AI detects multi-generational business practices and preserves them in modern workflows
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Award className="w-5 h-5 text-emerald-600" />
                      <span className="font-semibold text-emerald-900">Cultural Values Alignment</span>
                    </div>
                    <p className="text-emerald-800 text-sm">
                      Automation respects cultural values and adapts communication styles accordingly
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'analytics' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Predictive Business Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                  <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-blue-600">94.7%</div>
                  <div className="text-gray-600">Prediction Accuracy</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                  <Target className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-green-600">$2.3M</div>
                  <div className="text-gray-600">Revenue Predicted</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EliteHackathonApp;