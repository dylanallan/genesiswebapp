import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calculator, 
  DollarSign, 
  Clock, 
  Users, 
  TrendingUp,
  Download,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

const EnterpriseROICalculator: React.FC = () => {
  const [formData, setFormData] = useState({
    employees: 50,
    hourlyRate: 50,
    hoursPerWeek: 40,
    manualProcesses: 10,
    automationPercentage: 70,
    implementationCost: 10000
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  const calculateROI = () => {
    // Calculate time savings
    const weeklyHoursSaved = formData.employees * formData.hoursPerWeek * (formData.manualProcesses / 100) * (formData.automationPercentage / 100);
    const annualHoursSaved = weeklyHoursSaved * 52;
    
    // Calculate cost savings
    const annualCostSavings = annualHoursSaved * formData.hourlyRate;
    
    // Calculate ROI
    const roi = ((annualCostSavings - formData.implementationCost) / formData.implementationCost) * 100;
    
    // Calculate payback period (in months)
    const paybackPeriod = (formData.implementationCost / (annualCostSavings / 12));
    
    return {
      weeklyHoursSaved,
      annualHoursSaved,
      annualCostSavings,
      roi,
      paybackPeriod
    };
  };

  const results = calculateROI();

  const handleDownloadReport = () => {
    toast.success('ROI Report generated! Check your email for the detailed PDF.');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calculator className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Enterprise ROI Calculator</h2>
        </div>
        <button
          onClick={handleDownloadReport}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-6">
          <h3 className="font-medium text-gray-900 mb-4">Business Parameters</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Employees
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="employees"
                  value={formData.employees}
                  onChange={handleChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Average Hourly Rate ($)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hours Worked Per Week
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="hoursPerWeek"
                  value={formData.hoursPerWeek}
                  onChange={handleChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                % of Time Spent on Manual Processes
              </label>
              <div className="relative">
                <input
                  type="range"
                  name="manualProcesses"
                  min="1"
                  max="100"
                  value={formData.manualProcesses}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1%</span>
                  <span>{formData.manualProcesses}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                % of Processes That Can Be Automated
              </label>
              <div className="relative">
                <input
                  type="range"
                  name="automationPercentage"
                  min="1"
                  max="100"
                  value={formData.automationPercentage}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1%</span>
                  <span>{formData.automationPercentage}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Implementation Cost ($)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="implementationCost"
                  value={formData.implementationCost}
                  onChange={handleChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          <h3 className="font-medium text-gray-900 mb-4">ROI Analysis</h3>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                className="bg-white rounded-lg p-4 shadow-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-500">Annual Hours Saved</h4>
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{Math.round(results.annualHoursSaved).toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {Math.round(results.weeklyHoursSaved).toLocaleString()} hours weekly
                </p>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-lg p-4 shadow-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-500">Annual Cost Savings</h4>
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">${Math.round(results.annualCostSavings).toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">
                  ${Math.round(results.annualCostSavings / 12).toLocaleString()} monthly
                </p>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-lg p-4 shadow-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-500">ROI</h4>
                  <TrendingUp className="w-5 h-5 text-spiritual-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{Math.round(results.roi)}%</p>
                <p className="text-sm text-gray-500 mt-1">
                  First year return on investment
                </p>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-lg p-4 shadow-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-500">Payback Period</h4>
                  <Calendar className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{results.paybackPeriod.toFixed(1)} months</p>
                <p className="text-sm text-gray-500 mt-1">
                  Time to recoup investment
                </p>
              </motion.div>
            </div>
            
            <div className="mt-6 bg-blue-100 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Calculator className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">3-Year Projection</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    Total 3-year savings: <span className="font-bold">${Math.round(results.annualCostSavings * 3).toLocaleString()}</span>
                  </p>
                  <p className="mt-1 text-sm text-blue-700">
                    3-year ROI: <span className="font-bold">{Math.round(((results.annualCostSavings * 3) - formData.implementationCost) / formData.implementationCost * 100)}%</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => toast.success('Custom ROI analysis scheduled with our team')}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span>Schedule Custom ROI Analysis</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseROICalculator;