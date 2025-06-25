import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';

interface GlobalData {
  userProfiles: any[];
  familyContacts: any[];
  timelineEvents: any[];
  culturalStories: any[];
  culturalArtifacts: any[];
  loading: boolean;
  error: Error | null;
}

const GlobalDataContext = createContext<GlobalData | undefined>(undefined);

export const GlobalDataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<GlobalData>({
    userProfiles: [],
    familyContacts: [],
    timelineEvents: [],
    culturalStories: [],
    culturalArtifacts: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchAll() {
      try {
        const [userProfiles, familyContacts, timelineEvents, culturalStories, culturalArtifacts] = await Promise.all([
          supabase.from('user_profiles').select('*'),
          supabase.from('family_contacts').select('*'),
          supabase.from('timeline_events').select('*'),
          supabase.from('cultural_stories').select('*'),
          supabase.from('cultural_artifacts').select('*'),
        ]);
        setData({
          userProfiles: userProfiles.data || [],
          familyContacts: familyContacts.data || [],
          timelineEvents: timelineEvents.data || [],
          culturalStories: culturalStories.data || [],
          culturalArtifacts: culturalArtifacts.data || [],
          loading: false,
          error: null,
        });
      } catch (error) {
        setData((d) => ({ ...d, loading: false, error: error instanceof Error ? error : new Error('Unknown error') }));
      }
    }
    fetchAll();
  }, []);

  return (
    <GlobalDataContext.Provider value={data}>
      {children}
    </GlobalDataContext.Provider>
  );
};

export const useGlobalData = () => {
  const context = useContext(GlobalDataContext);
  if (context === undefined) {
    throw new Error('useGlobalData must be used within a GlobalDataProvider');
  }
  return context;
}; 