import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dna, Globe, Users, TrendingUp, MapPin, Calendar, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface DNAResult {
  id?: string;
  user_id?: string;
  ethnicity: {
    region: string;
    percentage: number;
    confidence: number;
  }[];
  healthInsights: {
    trait: string;
    likelihood: string;
    description: string;
  }[];
  ancestralMigration: {
    period: string;
    from: string;
    to: string;
    reason: string;
  }[];
  relatives: {
    name: string;
    relationship: string;
    sharedDNA: number;
    location: string;
  }[];
  created_at?: string;
  updated_at?: string;
}

export const DNAInsights: React.FC = () => {
  const [dnaData, setDnaData] = useState<DNAResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'ethnicity' | 'health' | 'migration' | 'relatives'>('ethnicity');

  useEffect(() => {
    fetchDNAData();
  }, []);

  const fetchDNAData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('dna_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      if (data) {
        setDnaData(data);
      }
    } catch (error) {
      console.error('Error fetching DNA data:', error);
      toast.error('Failed to load DNA insights');
    }
  };

  const uploadDNAFile = async (file: File) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Simulate DNA analysis (in a real app, this would call an AI service)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const dnaResult: DNAResult = {
        user_id: user.id,
        ethnicity: [
          { region: 'Western Europe', percentage: 45, confidence: 95 },
          { region: 'Eastern Europe', percentage: 30, confidence: 92 },
          { region: 'Scandinavia', percentage: 15, confidence: 88 },
          { region: 'Iberian Peninsula', percentage: 10, confidence: 85 }
        ],
        healthInsights: [
          { trait: 'Lactose Tolerance', likelihood: 'Likely', description: 'High probability of lactose tolerance' },
          { trait: 'Caffeine Sensitivity', likelihood: 'Low', description: 'Lower sensitivity to caffeine' },
          { trait: 'Athletic Performance', likelihood: 'Enhanced', description: 'Genetic markers for endurance' }
        ],
        ancestralMigration: [
          { period: '1800-1850', from: 'Ireland', to: 'United States', reason: 'Economic opportunity' },
          { period: '1920-1930', from: 'Poland', to: 'United States', reason: 'Political instability' }
        ],
        relatives: [
          { name: 'Sarah Johnson', relationship: '3rd cousin', sharedDNA: 0.78, location: 'California, USA' },
          { name: 'Michael O\'Brien', relationship: '4th cousin', sharedDNA: 0.45, location: 'Dublin, Ireland' }
        ]
      };

      // Save to Supabase
      const { error } = await supabase
        .from('dna_insights')
        .insert([dnaResult]);

      if (error) throw error;

      setDnaData(dnaResult);
      toast.success('DNA analysis complete!');
    } catch (error) {
      console.error('DNA analysis error:', error);
      toast.error('Failed to analyze DNA data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadDNAFile(file);
    }
  };

  const deleteDNAData = async () => {
    if (!dnaData?.id) return;
    
    if (!confirm('Are you sure you want to delete your DNA insights? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('dna_insights')
        .delete()
        .eq('id', dnaData.id);

      if (error) throw error;

      setDnaData(null);
      toast.success('DNA insights deleted successfully');
    } catch (error) {
      console.error('Error deleting DNA data:', error);
      toast.error('Failed to delete DNA insights');
    }
  };

  const renderEthnicityBreakdown = () => (
    <div className="space-y-4">
      {dnaData?.ethnicity.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-4 bg-blue-50 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <Globe className="w-5 h-5 text-blue-500" />
            <span className="font-medium">{item.region}</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-600">{item.percentage}%</div>
            <div className="text-xs text-blue-500">{item.confidence}% confidence</div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderHealthInsights = () => (
    <div className="space-y-4">
      {dnaData?.healthInsights.map((insight, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-4 bg-green-50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-green-900">{insight.trait}</h4>
            <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs">
              {insight.likelihood}
            </span>
          </div>
          <p className="text-green-700 text-sm">{insight.description}</p>
        </motion.div>
      ))}
    </div>
  );

  const renderMigrationHistory = () => (
    <div className="space-y-4">
      {dnaData?.ancestralMigration.map((migration, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="p-4 bg-purple-50 rounded-lg"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span className="font-medium text-purple-900">{migration.period}</span>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <MapPin className="w-4 h-4 text-purple-500" />
            <span className="text-purple-700">{migration.from} → {migration.to}</span>
          </div>
          <p className="text-purple-600 text-sm">{migration.reason}</p>
        </motion.div>
      ))}
    </div>
  );

  const renderRelatives = () => (
    <div className="space-y-4">
      {dnaData?.relatives.map((relative, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-4 bg-amber-50 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-amber-900">{relative.name}</h4>
              <p className="text-amber-700 text-sm">{relative.relationship}</p>
              <p className="text-amber-600 text-xs">{relative.location}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-amber-600">{relative.sharedDNA}%</div>
              <div className="text-xs text-amber-500">shared DNA</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Dna className="w-6 h-6 text-blue-500" />
        <h2 className="text-xl font-semibold">DNA Heritage Insights</h2>
      </div>

      {!dnaData && (
        <div className="text-center py-12">
          <input
            type="file"
            accept=".txt,.csv"
            onChange={handleFileUpload}
            className="hidden"
            id="dna-upload"
          />
          <label
            htmlFor="dna-upload"
            className="cursor-pointer inline-flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Analyzing DNA...</span>
              </>
            ) : (
              <>
                <Dna className="w-5 h-5" />
                <span>Upload DNA Data</span>
              </>
            )}
          </label>
          <p className="text-gray-500 text-sm mt-2">
            Upload your raw DNA data from 23andMe, AncestryDNA, or similar services
          </p>
        </div>
      )}

      {dnaData && (
        <div>
          <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'ethnicity', label: 'Ethnicity', icon: Globe },
              { id: 'health', label: 'Health', icon: Heart },
              { id: 'migration', label: 'Migration', icon: TrendingUp },
              { id: 'relatives', label: 'Relatives', icon: Users }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                    selectedTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="min-h-[400px]">
            {selectedTab === 'ethnicity' && renderEthnicityBreakdown()}
            {selectedTab === 'health' && renderHealthInsights()}
            {selectedTab === 'migration' && renderMigrationHistory()}
            {selectedTab === 'relatives' && renderRelatives()}
          </div>
        </div>
      )}
    </div>
  );
};