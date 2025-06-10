import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, RefreshCw, Calendar, User, Info, ArrowRight, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';

interface ProfileChange {
  id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  reason: string | null;
  created_at: string;
  ip_address: string | null;
}

interface ProfileHistoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileHistoryViewer: React.FC<ProfileHistoryViewerProps> = ({
  isOpen,
  onClose
}) => {
  const [changes, setChanges] = useState<ProfileChange[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    if (isOpen) {
      loadProfileHistory();
    }
  }, [isOpen, page]);

  const loadProfileHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc(
        'get_user_profile_history',
        {
          p_limit: pageSize,
          p_offset: page * pageSize
        }
      );
      
      if (error) throw error;
      
      if (data.length < pageSize) {
        setHasMore(false);
      }
      
      if (page === 0) {
        setChanges(data);
      } else {
        setChanges(prev => [...prev, ...data]);
      }
    } catch (error) {
      console.error('Error loading profile history:', error);
      toast.error('Failed to load profile history');
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldLabel = (fieldName: string): string => {
    const fieldLabels: Record<string, string> = {
      'name': 'Name',
      'ancestry': 'Ancestry',
      'businessGoals': 'Business Goals',
      'location': 'Location',
      'language': 'Language',
      'timezone': 'Timezone',
      'culturalBackground': 'Cultural Background',
      'familyTraditions': 'Family Traditions',
      'businessType': 'Business Type',
      'industryFocus': 'Industry Focus'
    };
    
    return fieldLabels[fieldName] || fieldName;
  };

  const filteredChanges = changes.filter(change => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      getFieldLabel(change.field_name).toLowerCase().includes(searchLower) ||
      (change.old_value && change.old_value.toLowerCase().includes(searchLower)) ||
      (change.new_value && change.new_value.toLowerCase().includes(searchLower)) ||
      (change.reason && change.reason.toLowerCase().includes(searchLower))
    );
  });

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <History className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Profile Update History</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search profile changes..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {isLoading && page === 0 ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filteredChanges.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No profile changes found</h3>
          <p className="text-gray-500">
            {searchTerm 
              ? `No results for "${searchTerm}"` 
              : 'Your profile history will appear here when you make changes'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredChanges.map((change, index) => (
            <motion.div
              key={change.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-50 rounded-full">
                    <User className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Updated {getFieldLabel(change.field_name)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(change.created_at)}
                    </p>
                  </div>
                </div>
                
                {change.reason && (
                  <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                    {change.reason}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Previous Value</p>
                  <p className="text-gray-700">
                    {change.old_value || <span className="text-gray-400 italic">Not set</span>}
                  </p>
                </div>
                
                <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                
                <div className="flex-1 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-500 mb-1">New Value</p>
                  <p className="text-gray-700">
                    {change.new_value || <span className="text-gray-400 italic">Not set</span>}
                  </p>
                </div>
              </div>
              
              {change.ip_address && (
                <div className="text-xs text-gray-500 mt-2">
                  IP: {change.ip_address}
                </div>
              )}
            </motion.div>
          ))}
          
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// X icon component
const X = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);