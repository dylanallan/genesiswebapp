// Cache bust: 2024-07-01-1
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Zap, Clock, Users, BarChart2, TrendingUp, Info } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';

interface ROICalculatorProps {
  averageSalary: number;
  hoursSavedPerWeek: number;
  increasedRevenue: number;
  employeeCount: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

export const EnterpriseROICalculator: React.FC<ROICalculatorProps> = ({
  averageSalary: initialSalary = 60000,
  hoursSavedPerWeek: initialHours = 5,
  increasedRevenue: initialRevenue = 10000,
  employeeCount: initialEmployees = 50,
}) => {
  const [inputs, setInputs] = useState({
    averageSalary: initialSalary,
    hoursSavedPerWeek: initialHours,
    increasedRevenue: initialRevenue,
    employeeCount: initialEmployees,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: Number(value) }));
  };

  const calculations = useMemo(() => {
    const hourlyRate = inputs.averageSalary / 52 / 40;
    const timeSavings = inputs.hoursSavedPerWeek * hourlyRate * 52 * inputs.employeeCount;
    const totalBenefits = timeSavings + inputs.increasedRevenue;
    const estimatedCost = 100 * inputs.employeeCount; // Placeholder cost
    const roi = (totalBenefits - estimatedCost) / estimatedCost;

    return { timeSavings, totalBenefits, estimatedCost, roi };
  }, [inputs]);

  const chartData = [
    { name: 'Time Savings', value: calculations.timeSavings, color: '#82ca9d' },
    { name: 'Revenue Gain', value: inputs.increasedRevenue, color: '#8884d8' },
    { name: 'Platform Cost', value: -calculations.estimatedCost, color: '#ff8042' },
  ];

  return (
    <motion.div 
      className="bg-white p-6 rounded-lg shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <DollarSign className="mr-2" />
        Enterprise ROI Calculator
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Average Employee Salary</label>
            <input type="number" name="averageSalary" value={inputs.averageSalary} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hours Saved per Employee/Week (Automation)</label>
            <input type="number" name="hoursSavedPerWeek" value={inputs.hoursSavedPerWeek} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Estimated Annual Revenue Gain (Cultural Insights)</label>
            <input type="number" name="increasedRevenue" value={inputs.increasedRevenue} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700">Number of Employees</label>
            <input type="number" name="employeeCount" value={inputs.employeeCount} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Results & Chart */}
        <div>
          <div className="mb-6 text-center">
            <h3 className="text-lg font-semibold text-gray-700">Estimated Annual ROI</h3>
            <p className={`text-5xl font-bold ${calculations.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(calculations.roi * 100).toFixed(0)}%
            </p>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Time Savings</p>
          <p className="text-2xl font-semibold text-green-600">{formatCurrency(calculations.timeSavings)}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Total Benefits</p>
          <p className="text-2xl font-semibold text-blue-600">{formatCurrency(calculations.totalBenefits)}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Est. Net Gain</p>
          <p className="text-2xl font-semibold text-purple-600">{formatCurrency(calculations.totalBenefits - calculations.estimatedCost)}</p>
        </div>
      </div>
    </motion.div>
  );
};