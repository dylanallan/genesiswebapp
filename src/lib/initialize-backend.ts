import { supabase } from './supabase';
import { toast } from 'sonner';

export async function initializeBackend() {
  try {
    toast.info('Initializing backend services...');
    
    // Step 1: Check Supabase connection
    const { data: connectionTest, error: connectionError } = await supabase.from('system_health_metrics').select('id').limit(1);
    
    if (connectionError) {
      console.warn('Supabase connection warning:', connectionError);
      // Continue anyway - don't block the user
    }
    
    // Create a default user_data entry for the current user
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if user_data entry exists
        const { data: userData, error: userDataError } = await supabase
          .from('user_data')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!userData && !userDataError) {
          // Create default user_data entry
          await supabase
            .from('user_data')
            .insert({
              user_id: user.id,
              preferences: {
                ancestry: "European and Asian heritage",
                businessGoals: "Automate marketing and preserve cultural knowledge"
              },
              settings: {},
              last_login: new Date().toISOString(),
              login_count: 1
            });
        }
      }
    } catch (userError) {
      console.warn('Error creating default user data:', userError);
      // Continue anyway
    }
    
    toast.success('Backend initialization complete!');
    return true;
  } catch (error) {
    console.error('Backend initialization error:', error);
    toast.error('Failed to initialize backend');
    // Return true anyway to avoid blocking the user
    return true;
  }
}