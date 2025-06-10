import React, { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { Dashboard } from './Dashboard';
import { Auth } from './Auth';
import { Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export const MainApp: React.FC = () => {
  const session = useSession();
  const [viewMode, setViewMode] = useState<'standard' | 'enterprise' | 'hackathon'>('standard');

  const handleViewModeChange = (mode: 'standard' | 'enterprise' | 'hackathon') => {
    setViewMode(mode);
    toast.success(`Switched to ${mode} view`);
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-spiritual-50">
      <Dashboard onViewModeChange={handleViewModeChange} />
    </div>
  );
};