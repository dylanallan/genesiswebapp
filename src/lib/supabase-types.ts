import { Database } from '@supabase/supabase-js'

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

export type UserProfile = Tables<'user_profiles'>
export type Celebration = Tables<'celebrations'>
export type Tradition = Tables<'traditions'>
export type CulturalStory = Tables<'cultural_stories'>
export type CulturalArtifact = Tables<'cultural_artifacts'>
export type FamilyContact = Tables<'family_contacts'>
export type Recipe = Tables<'recipes'>
export type TimelineEvent = Tables<'timeline_events'>
export type AutomationWorkflow = Tables<'automation_workflows'>
export type AIModel = Tables<'ai_models'>
export type SecurityAlert = Tables<'security_alerts'>
export type UserData = Tables<'user_data'>

// Define Database interface to match your Supabase schema
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          ancestry: string | null
          business_goals: string | null
          cultural_background: string | null
          location: string | null
          timezone: string | null
          language: string
          onboarding_completed: boolean
          preferences: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          ancestry?: string | null
          business_goals?: string | null
          cultural_background?: string | null
          location?: string | null
          timezone?: string | null
          language?: string
          onboarding_completed?: boolean
          preferences?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          ancestry?: string | null
          business_goals?: string | null
          cultural_background?: string | null
          location?: string | null
          timezone?: string | null
          language?: string
          onboarding_completed?: boolean
          preferences?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      celebrations: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          date_or_season: string | null
          significance: string | null
          location: string | null
          participants: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          date_or_season?: string | null
          significance?: string | null
          location?: string | null
          participants?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          date_or_season?: string | null
          significance?: string | null
          location?: string | null
          participants?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      traditions: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          origin: string | null
          historical_context: string | null
          modern_application: string | null
          frequency: string | null
          participants: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          origin?: string | null
          historical_context?: string | null
          modern_application?: string | null
          frequency?: string | null
          participants?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          origin?: string | null
          historical_context?: string | null
          modern_application?: string | null
          frequency?: string | null
          participants?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      cultural_stories: {
        Row: {
          id: string
          user_id: string | null
          title: string
          content: string
          storyteller: string | null
          date_recorded: string | null
          location: string | null
          themes: string[] | null
          language: string | null
          translation: string | null
          verification_status: string | null
          verification_details: Record<string, any> | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          content: string
          storyteller?: string | null
          date_recorded?: string | null
          location?: string | null
          themes?: string[] | null
          language?: string | null
          translation?: string | null
          verification_status?: string | null
          verification_details?: Record<string, any> | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          content?: string
          storyteller?: string | null
          date_recorded?: string | null
          location?: string | null
          themes?: string[] | null
          language?: string | null
          translation?: string | null
          verification_status?: string | null
          verification_details?: Record<string, any> | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      cultural_artifacts: {
        Row: {
          id: string
          user_id: string | null
          title: string
          description: string | null
          category: string
          media_url: string | null
          media_type: string | null
          metadata: Record<string, any> | null
          tags: string[] | null
          created_at: string | null
          updated_at: string | null
          fts: unknown | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          description?: string | null
          category: string
          media_url?: string | null
          media_type?: string | null
          metadata?: Record<string, any> | null
          tags?: string[] | null
          created_at?: string | null
          updated_at?: string | null
          fts?: unknown | null
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          description?: string | null
          category?: string
          media_url?: string | null
          media_type?: string | null
          metadata?: Record<string, any> | null
          tags?: string[] | null
          created_at?: string | null
          updated_at?: string | null
          fts?: unknown | null
        }
      }
      family_contacts: {
        Row: {
          id: string
          user_id: string | null
          name: string
          relationship: string | null
          contact_info: Record<string, any> | null
          birth_date: string | null
          location: string | null
          notes: string | null
          related_names: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          relationship?: string | null
          contact_info?: Record<string, any> | null
          birth_date?: string | null
          location?: string | null
          notes?: string | null
          related_names?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          relationship?: string | null
          contact_info?: Record<string, any> | null
          birth_date?: string | null
          location?: string | null
          notes?: string | null
          related_names?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      recipes: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          ingredients: Record<string, any> | null
          instructions: Record<string, any> | null
          cultural_significance: string | null
          origin: string | null
          serving_size: number | null
          preparation_time: unknown | null
          difficulty_level: string | null
          tags: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          ingredients: Record<string, any> | null
          instructions: Record<string, any> | null
          cultural_significance?: string | null
          origin?: string | null
          serving_size?: number | null
          preparation_time?: unknown | null
          difficulty_level?: string | null
          tags?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          ingredients?: Record<string, any> | null
          instructions?: Record<string, any> | null
          cultural_significance?: string | null
          origin?: string | null
          serving_size?: number | null
          preparation_time?: unknown | null
          difficulty_level?: string | null
          tags?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      timeline_events: {
        Row: {
          id: string
          user_id: string | null
          title: string
          description: string | null
          event_date: string
          location: string | null
          people: string[] | null
          category: string | null
          media_urls: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          description?: string | null
          event_date: string
          location?: string | null
          people?: string[] | null
          category?: string | null
          media_urls?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          description?: string | null
          event_date?: string
          location?: string | null
          people?: string[] | null
          category?: string | null
          media_urls?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      automation_workflows: {
        Row: {
          id: string
          user_id: string | null
          name: string
          trigger_conditions: Record<string, any>
          actions: Record<string, any>
          is_active: boolean | null
          metrics: Record<string, any> | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          trigger_conditions: Record<string, any>
          actions: Record<string, any>
          is_active?: boolean | null
          metrics?: Record<string, any> | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          trigger_conditions?: Record<string, any>
          actions?: Record<string, any>
          is_active?: boolean | null
          metrics?: Record<string, any> | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      ai_models: {
        Row: {
          id: string
          name: string
          version: string
          capabilities: string[]
          context_window: number
          api_endpoint: string
          api_key: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          version: string
          capabilities?: string[]
          context_window?: number
          api_endpoint: string
          api_key?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          version?: string
          capabilities?: string[]
          context_window?: number
          api_endpoint?: string
          api_key?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      security_alerts: {
        Row: {
          id: string
          anomaly_score: number
          metrics: Record<string, any>
          timestamp: string | null
          resolved: boolean | null
          resolution_notes: string | null
          resolved_at: string | null
        }
        Insert: {
          id?: string
          anomaly_score: number
          metrics: Record<string, any>
          timestamp?: string | null
          resolved?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
        }
        Update: {
          id?: string
          anomaly_score?: number
          metrics?: Record<string, any>
          timestamp?: string | null
          resolved?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
        }
      }
      user_data: {
        Row: {
          user_id: string
          preferences: Record<string, any> | null
          settings: Record<string, any> | null
          last_login: string | null
          login_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          preferences?: Record<string, any> | null
          settings?: Record<string, any> | null
          last_login?: string | null
          login_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          preferences?: Record<string, any> | null
          settings?: Record<string, any> | null
          last_login?: string | null
          login_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      admin_roles: {
        Row: {
          id: string
          user_id: string | null
          role_name: string
          permissions: Record<string, any> | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          role_name?: string
          permissions?: Record<string, any> | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          role_name?: string
          permissions?: Record<string, any> | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      system_health_metrics: {
        Row: {
          id: string
          ts: string
          metric_name: string
          metric_value: number
          metadata: Record<string, any> | null
        }
        Insert: {
          id?: string
          ts?: string
          metric_name: string
          metric_value: number
          metadata?: Record<string, any> | null
        }
        Update: {
          id?: string
          ts?: string
          metric_name?: string
          metric_value?: number
          metadata?: Record<string, any> | null
        }
      }
    }
    Views: {
      user_activity_summary: {
        Row: {
          user_id: string | null
          total_events: number | null
          unique_event_types: number | null
          first_activity: string | null
          last_activity: string | null
          events_last_30_days: number | null
          event_type_counts: Record<string, any> | null
        }
      }
      business_metrics_dashboard: {
        Row: {
          user_id: string | null
          workflow_count: number | null
          total_workflow_executions: number | null
          integration_count: number | null
          campaign_count: number | null
          contact_count: number | null
          successful_executions: number | null
          failed_executions: number | null
        }
      }
      heritage_insights: {
        Row: {
          user_id: string | null
          connected_regions: number | null
          region_names: Record<string, any> | null
          family_member_count: number | null
          family_event_count: number | null
          document_count: number | null
          has_dna_analysis: boolean | null
        }
      }
    }
    Functions: {
      get_user_profile: {
        Args: {
          p_user_id?: string
        }
        Returns: Record<string, any>
      }
      update_user_profile: {
        Args: {
          p_display_name?: string
          p_ancestry?: string
          p_business_goals?: string
          p_cultural_background?: string
          p_location?: string
          p_timezone?: string
          p_language?: string
          p_preferences?: Record<string, any>
          p_onboarding_completed?: boolean
        }
        Returns: Record<string, any>
      }
      get_user_heritage_data: {
        Args: {
          p_user_id?: string
        }
        Returns: Record<string, any>
      }
      get_user_business_data: {
        Args: {
          p_user_id?: string
        }
        Returns: Record<string, any>
      }
      execute_workflow: {
        Args: {
          p_workflow_id: string
        }
        Returns: Record<string, any>
      }
      track_user_activity: {
        Args: {
          p_user_id: string
          p_event_type: string
          p_event_source: string
          p_event_data?: Record<string, any>
        }
        Returns: string
      }
      log_security_alert: {
        Args: {
          p_alert_type: string
          p_severity: string
          p_user_id: string
          p_description: string
          p_details?: Record<string, any>
        }
        Returns: string
      }
      update_updated_at_column: {
        Args: Record<string, never>
        Returns: unknown
      }
      audit_log_changes: {
        Args: Record<string, never>
        Returns: unknown
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}