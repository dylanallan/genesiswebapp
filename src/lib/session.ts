import { supabase } from './supabase';
import { UserSession, UserPreferences, Interaction, FlowData, Document } from './store';

export async function initializeSession(userId: string): Promise<UserSession> {
  try {
    // Get user data from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userError) throw userError;

    // Get user preferences
    const { data: prefsData, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (prefsError && prefsError.code !== 'PGNF') throw prefsError;

    // Get user interactions
    const { data: interactionsData, error: interactionsError } = await supabase
      .from('interactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (interactionsError) throw interactionsError;

    // Get flow data
    const { data: flowData, error: flowError } = await supabase
      .from('flows')
      .select('*')
      .eq('user_id', userId)
      .order('updated', { ascending: false });

    if (flowError) throw flowError;

    // Get documents
    const { data: documentsData, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('updated', { ascending: false });

    if (documentsError) throw documentsError;

    // Create default preferences if none exist
    const preferences: UserPreferences = prefsData || {
      theme: 'light',
      notifications: true,
      language: 'en',
      culturalContext: userData.cultural_background || '',
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
    };

    if (!prefsData) {
      await supabase
        .from('user_preferences')
        .insert([{ user_id: userId, ...preferences }]);
    }

    return {
      id: userId,
      email: userData.email,
      preferences,
      lastActive: new Date(),
      interactions: interactionsData || [],
      flowData: flowData || [],
      documents: documentsData || []
    };
  } catch (error) {
    console.error('Error initializing session:', error);
    throw error;
  }
}

export async function saveInteraction(interaction: Interaction): Promise<void> {
  try {
    const { error } = await supabase
      .from('interactions')
      .insert([interaction]);

    if (error) throw error;
  } catch (error) {
    console.error('Error saving interaction:', error);
    throw error;
  }
}

export async function saveFlowData(flowData: FlowData): Promise<void> {
  try {
    const { error } = await supabase
      .from('flows')
      .insert([flowData]);

    if (error) throw error;
  } catch (error) {
    console.error('Error saving flow data:', error);
    throw error;
  }
}

export async function saveDocument(document: Document): Promise<void> {
  try {
    const { error } = await supabase
      .from('documents')
      .insert([document]);

    if (error) throw error;
  } catch (error) {
    console.error('Error saving document:', error);
    throw error;
  }
}

export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .update(preferences)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
}

export async function getInteractionHistory(
  userId: string,
  type?: string,
  limit = 100
): Promise<Interaction[]> {
  try {
    let query = supabase
      .from('interactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching interaction history:', error);
    throw error;
  }
}

export async function getFlowHistory(userId: string): Promise<FlowData[]> {
  try {
    const { data, error } = await supabase
      .from('flows')
      .select('*')
      .eq('user_id', userId)
      .order('updated', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching flow history:', error);
    throw error;
  }
}

export async function getDocuments(userId: string): Promise<Document[]> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('updated', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
}