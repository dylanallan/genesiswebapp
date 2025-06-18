import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Maximize, 
  Minimize,
  Zap,
  Brain,
  Globe,
  Users,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

const EnterpriseDemo: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const totalSteps = 5;

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    
    if (!isPlaying) {
      toast.success('Demo started - watch the automated walkthrough');
      
      // Auto-advance through steps
      const interval = setInterval(() => {
        setCurrentStep(current => {
          if (current >= totalSteps) {
            clearInterval(interval);
            setIsPlaying(false);
            return totalSteps;
          }
          return current + 1;
        });
      }, 5000);
      
      // Store interval ID for cleanup
      return () => clearInterval(interval);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    
    if (!isFullscreen) {
      toast.info('Full demo experience activated');
    }
  };

  const handleScheduleDemo = () => {
    toast.success('Live demo request received. Our team will contact you shortly.');
  };

  const renderDemoContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Brain className="w-16 h-16 text-genesis-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900">AI-Powered Business Automation</h3>
              <p className="text-gray-600 mt-2">
                Genesis Heritage Pro combines advanced AI with cultural context awareness to create the most powerful business automation platform available.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <Zap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900">10x Productivity</h4>
                <p className="text-sm text-gray-600">Automate repetitive tasks and focus on high-value work</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <Brain className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900">AI-First Design</h4>
                <p className="text-sm text-gray-600">Built from the ground up for the AI era</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <Globe className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900">Cultural Intelligence</h4>
                <p className="text-sm text-gray-600">Respects and integrates cultural context</p>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <h3 className="text-xl font-bold text-gray-900">Workflow Automation Demo</h3>
              <p className="text-gray-600 mt-2">
                Watch as our AI creates custom automation workflows in seconds.
              </p>
            </motion.div>
            
            <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
              <div className="p-4 bg-gray-800 text-white text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-2">Workflow Builder</span>
                </div>
              </div>
              
              <div className="p-6 h-64 flex items-center justify-center">
                <img 
                  src="https://images.pexels.com/photos/7567434/pexels-photo-7567434.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Workflow Automation Demo" 
                  className="max-h-full rounded-lg"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <h3 className="text-xl font-bold text-gray-900">Cultural Intelligence Module</h3>
              <p className="text-gray-600 mt-2">
                Our unique cultural context engine provides heritage-aware business insights.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-spiritual-50 to-spiritual-100 p-6 rounded-lg border border-spiritual-200">
                <Globe className="w-8 h-8 text-spiritual-500 mb-3" />
                <h4 className="font-medium text-gray-900 mb-2">Heritage-Aware Business Practices</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-spiritual-500 rounded-full mt-1.5 mr-2"></div>
                    <span>Culturally sensitive communication templates</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-spiritual-500 rounded-full mt-1.5 mr-2"></div>
                    <span>Traditional wisdom integration in decision-making</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-spiritual-500 rounded-full mt-1.5 mr-2"></div>
                    <span>Cultural calendar awareness for global operations</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3">Cultural Intelligence Dashboard</h4>
                <img 
                  src="https://images.pexels.com/photos/7567552/pexels-photo-7567552.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Cultural Intelligence Dashboard" 
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <h3 className="text-xl font-bold text-gray-900">Real-time Analytics & Insights</h3>
              <p className="text-gray-600 mt-2">
                Powerful business intelligence with predictive capabilities.
              </p>
            </motion.div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-blue-500 font-medium">CONVERSION RATE</div>
                  <div className="text-2xl font-bold text-gray-900">24.8%</div>
                  <div className="text-xs text-green-600">↑ 12% vs last month</div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-green-500 font-medium">AUTOMATION ROI</div>
                  <div className="text-2xl font-bold text-gray-900">387%</div>
                  <div className="text-xs text-green-600">↑ 45% vs last quarter</div>
                </div>
                
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-xs text-purple-500 font-medium">TIME SAVED</div>
                  <div className="text-2xl font-bold text-gray-900">1,240 hrs</div>
                  <div className="text-xs text-green-600">↑ 28% vs last month</div>
                </div>
                
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="text-xs text-amber-500 font-medium">CUSTOMER SATISFACTION</div>
                  <div className="text-2xl font-bold text-gray-900">94.2%</div>
                  <div className="text-xs text-green-600">↑ 5% vs last month</div>
                </div>
              </div>
              
              <img 
                src="https://images.pexels.com/photos/7567473/pexels-photo-7567473.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="Analytics Dashboard" 
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Users className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900">Ready to Transform Your Business?</h3>
              <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                Join the 500+ companies already using Genesis Heritage Pro to automate their operations while honoring their cultural heritage.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-3xl mx-auto">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="font-medium text-gray-900">300%</h4>
                <p className="text-sm text-gray-600">Average ROI</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="font-medium text-gray-900">95%+</h4>
                <p className="text-sm text-gray-600">Customer Retention</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="font-medium text-gray-900">85%+</h4>
                <p className="text-sm text-gray-600">Gross Margins</p>
              </div>
            </div>
            
            <div className="mt-8">
              <button
                onClick={handleScheduleDemo}
                className="px-6 py-3 bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white rounded-lg hover:from-genesis-600 hover:to-spiritual-600 transition-colors flex items-center mx-auto"
              >
                <span>Schedule Live Demo</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${isFullscreen ? 'fixed inset-0 z-50 overflow-auto' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Play className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Enterprise Demo</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleFullscreen}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
        {renderDemoContent()}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                currentStep === index + 1 ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button
            onClick={handlePlayPause}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentStep === totalSteps}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
        
        <button
          onClick={handleScheduleDemo}
          className="px-4 py-2 bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white rounded-lg hover:from-genesis-600 hover:to-spiritual-600 transition-colors text-sm"
        >
          Schedule Live Demo
        </button>
      </div>
    </div>
  );
};

export default EnterpriseDemo;