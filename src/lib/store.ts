import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface UserSession {
  id: string;
  email: string;
  preferences: UserPreferences;
  lastActive: Date;
  interactions: Interaction[];
  flowData: FlowData[];
  documents: Document[];
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
  culturalContext: string;
  automationPreferences: AutomationPreferences;
}

export interface AutomationPreferences {
  workflowTriggers: string[];
  notificationSettings: NotificationSettings;
  integrations: Integration[];
}

export interface NotificationSettings {
  email: boolean;
  inApp: boolean;
  desktop: boolean;
  frequency: 'realtime' | 'daily' | 'weekly';
}

export interface Integration {
  id: string;
  type: string;
  config: Record<string, any>;
  enabled: boolean;
}

export interface Interaction {
  id: string;
  type: 'chat' | 'flow' | 'document' | 'automation';
  content: any;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface FlowData {
  id: string;
  name: string;
  nodes: any[];
  edges: any[];
  created: Date;
  updated: Date;
  metadata: Record<string, any>;
}

export interface Document {
  id: string;
  type: string;
  content: string;
  created: Date;
  updated: Date;
  tags: string[];
}

export interface ConversationHistory {
  id: string;
  messages: Message[];
  context: string;
  timestamp: Date;
  analysis: Analysis[];
}

export interface Message {
  role: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Analysis {
  type: string;
  results: Record<string, any>;
  confidence: number;
  timestamp: Date;
}

// Persistent storage atoms
export const userSessionAtom = atomWithStorage<UserSession | null>('genesis.session', null);
export const userPreferencesAtom = atomWithStorage<UserPreferences>('genesis.preferences', {
  theme: 'light',
  notifications: true,
  language: 'en',
  culturalContext: '',
  automationPreferences: {
    workflowTriggers: [],
    notificationSettings: {
      email: true,
      inApp: true,
      desktop: false,
      frequency: 'realtime'
    },
    integrations: []
  }
});

// Memory-only atoms for real-time state
export const conversationHistoryAtom = atom<ConversationHistory[]>([]);
export const activeFlowAtom = atom<FlowData | null>(null);
export const interactionsQueueAtom = atom<Interaction[]>([]);
export const systemStateAtom = atom<Record<string, any>>({});
export const isLoadingAtom = atom(false);
export const currentPathwayAtom = atom<string | null>(null);

// Derived atoms for analytics and insights
export const userInsightsAtom = atom((get) => {
  const session = get(userSessionAtom);
  const history = get(conversationHistoryAtom);
  
  if (!session) return null;
  
  return {
    interactionCount: session.interactions.length,
    lastActive: session.lastActive,
    topFlows: session.flowData
      .sort((a, b) => b.updated.getTime() - a.updated.getTime())
      .slice(0, 5),
    recentDocuments: session.documents
      .sort((a, b) => b.updated.getTime() - a.updated.getTime())
      .slice(0, 5),
    conversationSummary: history.length > 0 ? {
      totalMessages: history.reduce((acc, conv) => acc + conv.messages.length, 0),
      lastConversation: history[0].timestamp,
      topContexts: [...new Set(history.map(conv => conv.context))].slice(0, 3)
    } : null
  };
});