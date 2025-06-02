import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Workflow, 
  Mail, 
  Gift, 
  Users, 
  Settings,
  ChevronRight,
  Plus,
  Edit,
  Trash,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { marketingAutomation } from '../lib/marketing-automation';
import { cn } from '../lib/utils';

interface FunnelStageProps {
  stage: any;
  isActive: boolean;
  onClick: () => void;
}

const FunnelStage: React.FC<FunnelStageProps> = ({ stage, isActive, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={cn(
      "p-4 rounded-lg border cursor-pointer transition-colors",
      isActive 
        ? "bg-blue-50 border-blue-200" 
        : "bg-white border-gray-200 hover:border-blue-200"
    )}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {stage.type === 'lead_magnet' && <Gift className="w-5 h-5 text-purple-500" />}
        {stage.type === 'email_sequence' && <Mail className="w-5 h-5 text-blue-500" />}
        {stage.type === 'workshop' && <Users className="w-5 h-5 text-green-500" />}
        <span className="font-medium text-gray-900">{stage.name}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </div>
    
    {isActive && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="mt-4 space-y-3"
      >
        <div className="text-sm text-gray-600">
          {stage.description}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Edit stage
            }}
            className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
          >
            <Edit className="w-4 h-4" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Delete stage
            }}
            className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded-md hover:bg-red-100"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    )}
  </motion.div>
);

export const MarketingAutomation: React.FC = () => {
  const [funnels, setFunnels] = useState<any[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadFunnels();
  }, []);

  const loadFunnels = async () => {
    setIsLoading(true);
    try {
      const { data: funnelsData, error } = await supabase
        .from('marketing_funnels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFunnels(funnelsData || []);
    } catch (error) {
      console.error('Error loading funnels:', error);
      toast.error('Failed to load marketing funnels');
    } finally {
      setIsLoading(false);
    }
  };

  const createFunnel = async () => {
    const name = prompt('Enter funnel name:');
    if (!name) return;

    try {
      const funnelId = await marketingAutomation.createFunnel({
        name,
        description: 'New marketing funnel',
        stages: [],
        metrics: {
          totalLeads: 0,
          conversions: 0,
          conversionRate: 0,
          averageDaysToConvert: 0,
          revenueGenerated: 0
        },
        settings: {
          autoResponders: true,
          notificationEmails: [],
          tagging: true,
          customFields: {}
        }
      });

      await loadFunnels();
      setSelectedFunnel(funnelId);
    } catch (error) {
      console.error('Error creating funnel:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Workflow className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Marketing Automation</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button
              onClick={createFunnel}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Funnel</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Funnel List */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Marketing Funnels</h3>
              {funnels.map(funnel => (
                <motion.div
                  key={funnel.id}
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-colors",
                    selectedFunnel === funnel.id
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-gray-200 hover:border-blue-200"
                  )}
                  onClick={() => setSelectedFunnel(funnel.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{funnel.name}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    {funnel.stages?.length || 0} stages
                  </div>
                  
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span>{funnel.metrics?.totalLeads || 0} leads</span>
                    <span>{funnel.metrics?.conversionRate || 0}% conversion</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Funnel Stages */}
            {selectedFunnel && (
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-medium text-gray-900">Funnel Stages</h3>
                {funnels
                  .find(f => f.id === selectedFunnel)
                  ?.stages?.map((stage: any) => (
                    <FunnelStage
                      key={stage.id}
                      stage={stage}
                      isActive={activeStage === stage.id}
                      onClick={() => setActiveStage(
                        activeStage === stage.id ? null : stage.id
                      )}
                    />
                  ))}
                
                <button
                  onClick={() => {
                    // Add new stage
                  }}
                  className="w-full p-4 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-colors"
                >
                  <Plus className="w-5 h-5 mx-auto" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};