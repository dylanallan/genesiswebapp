export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admin_roles: {
        Row: {
          created_at: string | null
          id: string
          permissions: Json | null
          role_name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role_name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role_name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_conversations: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          is_archived: boolean | null
          message_count: number | null
          summary: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          message_count?: number | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          message_count?: number | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_feedback: {
        Row: {
          created_at: string | null
          feedback_text: string | null
          id: string
          is_helpful: boolean | null
          message_id: string
          rating: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          is_helpful?: boolean | null
          message_id: string
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          is_helpful?: boolean | null
          message_id?: string
          rating?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          model_id: string | null
          processing_time_ms: number | null
          role: string
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model_id?: string | null
          processing_time_ms?: number | null
          role: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model_id?: string | null
          processing_time_ms?: number | null
          role?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_messages_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_models: {
        Row: {
          capabilities: string[] | null
          configuration: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          max_tokens: number | null
          model_type: string
          name: string
          provider: string
          token_cost: number | null
          updated_at: string | null
        }
        Insert: {
          capabilities?: string[] | null
          configuration?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model_type: string
          name: string
          provider: string
          token_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          capabilities?: string[] | null
          configuration?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model_type?: string
          name?: string
          provider?: string
          token_cost?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_prompts: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          is_public: boolean | null
          is_template: boolean | null
          title: string
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          title: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          title?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_source: string
          event_type: string
          id: string
          ip_address: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_source: string
          event_type: string
          id?: string
          ip_address?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_source?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      analytics_metrics: {
        Row: {
          created_at: string | null
          dimension: string | null
          dimension_value: string | null
          end_time: string | null
          id: string
          metric_name: string
          metric_value: number
          start_time: string | null
          time_period: string | null
        }
        Insert: {
          created_at?: string | null
          dimension?: string | null
          dimension_value?: string | null
          end_time?: string | null
          id?: string
          metric_name: string
          metric_value: number
          start_time?: string | null
          time_period?: string | null
        }
        Update: {
          created_at?: string | null
          dimension?: string | null
          dimension_value?: string | null
          end_time?: string | null
          id?: string
          metric_name?: string
          metric_value?: number
          start_time?: string | null
          time_period?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      automation_workflows: {
        Row: {
          created_at: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          last_executed: string | null
          name: string
          settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          last_executed?: string | null
          name: string
          settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          last_executed?: string | null
          name?: string
          settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_workflows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      business_integrations: {
        Row: {
          configuration: Json | null
          created_at: string | null
          credentials: Json | null
          id: string
          is_active: boolean | null
          last_used: string | null
          service_name: string
          service_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          configuration?: Json | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          service_name: string
          service_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          configuration?: Json | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          service_name?: string
          service_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      community_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          like_count: number | null
          parent_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          like_count?: number | null
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          like_count?: number | null
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      community_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      community_groups: {
        Row: {
          created_at: string | null
          description: string | null
          group_type: string
          id: string
          is_public: boolean | null
          member_count: number | null
          name: string
          owner_id: string | null
          rules: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          group_type: string
          id?: string
          is_public?: boolean | null
          member_count?: number | null
          name: string
          owner_id?: string | null
          rules?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          group_type?: string
          id?: string
          is_public?: boolean | null
          member_count?: number | null
          name?: string
          owner_id?: string | null
          rules?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      community_posts: {
        Row: {
          comment_count: number | null
          content: string
          created_at: string | null
          group_id: string
          id: string
          is_announcement: boolean | null
          is_pinned: boolean | null
          like_count: number | null
          media_urls: string[] | null
          post_type: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          comment_count?: number | null
          content: string
          created_at?: string | null
          group_id: string
          id?: string
          is_announcement?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          post_type?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          comment_count?: number | null
          content?: string
          created_at?: string | null
          group_id?: string
          id?: string
          is_announcement?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          post_type?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      dna_analysis: {
        Row: {
          analysis_type: string
          analyzed_at: string | null
          created_at: string | null
          ethnicity_breakdown: Json | null
          health_insights: Json | null
          id: string
          provider: string | null
          raw_data_url: string | null
          relative_matches: Json | null
          results: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_type: string
          analyzed_at?: string | null
          created_at?: string | null
          ethnicity_breakdown?: Json | null
          health_insights?: Json | null
          id?: string
          provider?: string | null
          raw_data_url?: string | null
          relative_matches?: Json | null
          results: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_type?: string
          analyzed_at?: string | null
          created_at?: string | null
          ethnicity_breakdown?: Json | null
          health_insights?: Json | null
          id?: string
          provider?: string | null
          raw_data_url?: string | null
          relative_matches?: Json | null
          results?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dna_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      family_documents: {
        Row: {
          created_at: string | null
          description: string | null
          document_type: string
          file_type: string | null
          file_url: string | null
          id: string
          metadata: Json | null
          related_members: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_type: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          related_members?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_type?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          related_members?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      family_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string | null
          event_location: string | null
          event_type: string
          id: string
          media_urls: string[] | null
          participants: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_location?: string | null
          event_type: string
          id?: string
          media_urls?: string[] | null
          participants?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_location?: string | null
          event_type?: string
          id?: string
          media_urls?: string[] | null
          participants?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      family_members: {
        Row: {
          birth_date: string | null
          birth_location: string | null
          created_at: string | null
          death_date: string | null
          gender: string | null
          id: string
          is_living: boolean | null
          metadata: Json | null
          name: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          birth_location?: string | null
          created_at?: string | null
          death_date?: string | null
          gender?: string | null
          id?: string
          is_living?: boolean | null
          metadata?: Json | null
          name: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          birth_date?: string | null
          birth_location?: string | null
          created_at?: string | null
          death_date?: string | null
          gender?: string | null
          id?: string
          is_living?: boolean | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      family_relationships: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          notes: string | null
          person1_id: string
          person2_id: string
          relationship_type: string
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          person1_id: string
          person2_id: string
          relationship_type: string
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          person1_id?: string
          person2_id?: string
          relationship_type?: string
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_relationships_person1_id_fkey"
            columns: ["person1_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_relationships_person2_id_fkey"
            columns: ["person2_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_relationships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      heritage_artifacts: {
        Row: {
          created_at: string | null
          cultural_significance: string | null
          description: string | null
          historical_context: string | null
          id: string
          image_url: string | null
          name: string
          region_id: string | null
          tags: string[] | null
          time_period: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cultural_significance?: string | null
          description?: string | null
          historical_context?: string | null
          id?: string
          image_url?: string | null
          name: string
          region_id?: string | null
          tags?: string[] | null
          time_period?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cultural_significance?: string | null
          description?: string | null
          historical_context?: string | null
          id?: string
          image_url?: string | null
          name?: string
          region_id?: string | null
          tags?: string[] | null
          time_period?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "heritage_artifacts_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "heritage_regions"
            referencedColumns: ["id"]
          }
        ]
      }
      heritage_regions: {
        Row: {
          coordinates: unknown | null
          created_at: string | null
          cultural_notes: string | null
          description: string | null
          geographic_area: string | null
          historical_significance: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          coordinates?: unknown | null
          created_at?: string | null
          cultural_notes?: string | null
          description?: string | null
          geographic_area?: string | null
          historical_significance?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          coordinates?: unknown | null
          created_at?: string | null
          cultural_notes?: string | null
          description?: string | null
          geographic_area?: string | null
          historical_significance?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      heritage_stories: {
        Row: {
          content: string
          created_at: string | null
          cultural_significance: string | null
          id: string
          origin: string | null
          region_id: string | null
          tags: string[] | null
          time_period: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          cultural_significance?: string | null
          id?: string
          origin?: string | null
          region_id?: string | null
          tags?: string[] | null
          time_period?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          cultural_significance?: string | null
          id?: string
          origin?: string | null
          region_id?: string | null
          tags?: string[] | null
          time_period?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "heritage_stories_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "heritage_regions"
            referencedColumns: ["id"]
          }
        ]
      }
      heritage_traditions: {
        Row: {
          created_at: string | null
          description: string | null
          historical_context: string | null
          id: string
          modern_practice: string | null
          name: string
          region_id: string | null
          significance: string | null
          time_period: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          historical_context?: string | null
          id?: string
          modern_practice?: string | null
          name: string
          region_id?: string | null
          significance?: string | null
          time_period?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          historical_context?: string | null
          id?: string
          modern_practice?: string | null
          name?: string
          region_id?: string | null
          significance?: string | null
          time_period?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "heritage_traditions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "heritage_regions"
            referencedColumns: ["id"]
          }
        ]
      }
      marketing_campaigns: {
        Row: {
          budget: number | null
          campaign_type: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          metrics: Json | null
          name: string
          start_date: string | null
          status: string
          target_audience: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget?: number | null
          campaign_type: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          metrics?: Json | null
          name: string
          start_date?: string | null
          status: string
          target_audience?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget?: number | null
          campaign_type?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          metrics?: Json | null
          name?: string
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      marketing_contacts: {
        Row: {
          consent_date: string | null
          consent_given: boolean | null
          created_at: string | null
          custom_fields: Json | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          source: string | null
          status: string
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          consent_date?: string | null
          consent_given?: boolean | null
          created_at?: string | null
          custom_fields?: Json | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          source?: string | null
          status: string
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          consent_date?: string | null
          consent_given?: boolean | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      marketing_messages: {
        Row: {
          campaign_id: string | null
          content: string
          created_at: string | null
          id: string
          is_template: boolean | null
          message_type: string
          metrics: Json | null
          scheduled_for: string | null
          sent_at: string | null
          subject: string | null
          template_variables: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_template?: boolean | null
          message_type: string
          metrics?: Json | null
          scheduled_for?: string | null
          sent_at?: string | null
          subject?: string | null
          template_variables?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_template?: boolean | null
          message_type?: string
          metrics?: Json | null
          scheduled_for?: string | null
          sent_at?: string | null
          subject?: string | null
          template_variables?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          description: string
          details: Json | null
          id: string
          is_resolved: boolean | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          description: string
          details?: Json | null
          id?: string
          is_resolved?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          description?: string
          details?: Json | null
          id?: string
          is_resolved?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      security_settings: {
        Row: {
          allowed_ip_ranges: string[] | null
          created_at: string | null
          failed_login_attempts: number | null
          id: string
          last_password_change: string | null
          login_notifications: boolean | null
          password_expiry_days: number | null
          two_factor_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allowed_ip_ranges?: string[] | null
          created_at?: string | null
          failed_login_attempts?: number | null
          id?: string
          last_password_change?: string | null
          login_notifications?: boolean | null
          password_expiry_days?: number | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allowed_ip_ranges?: string[] | null
          created_at?: string | null
          failed_login_attempts?: number | null
          id?: string
          last_password_change?: string | null
          login_notifications?: boolean | null
          password_expiry_days?: number | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      system_health_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_name: string
          metric_value: number
          ts: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_value: number
          ts?: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_value?: number
          ts?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          is_public: boolean | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_heritage: {
        Row: {
          connection_strength: number | null
          created_at: string | null
          id: string
          notes: string | null
          region_id: string
          updated_at: string | null
          user_id: string
          verified: boolean | null
        }
        Insert: {
          connection_strength?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          region_id: string
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
        }
        Update: {
          connection_strength?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          region_id?: string
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_heritage_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "heritage_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_heritage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          ancestry: string | null
          avatar_url: string | null
          business_goals: string | null
          created_at: string | null
          cultural_background: string | null
          display_name: string | null
          id: string
          language: string | null
          location: string | null
          onboarding_completed: boolean | null
          preferences: Json | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          ancestry?: string | null
          avatar_url?: string | null
          business_goals?: string | null
          created_at?: string | null
          cultural_background?: string | null
          display_name?: string | null
          id: string
          language?: string | null
          location?: string | null
          onboarding_completed?: boolean | null
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          ancestry?: string | null
          avatar_url?: string | null
          business_goals?: string | null
          created_at?: string | null
          cultural_background?: string | null
          display_name?: string | null
          id?: string
          language?: string | null
          location?: string | null
          onboarding_completed?: boolean | null
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          context: Json | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          result: Json | null
          started_at: string
          status: string
          user_id: string | null
          workflow_id: string | null
        }
        Insert: {
          completed_at?: string | null
          context?: Json | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          result?: Json | null
          started_at?: string
          status: string
          user_id?: string | null
          workflow_id?: string | null
        }
        Update: {
          completed_at?: string | null
          context?: Json | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          result?: Json | null
          started_at?: string
          status?: string
          user_id?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_steps: {
        Row: {
          configuration: Json
          created_at: string | null
          description: string | null
          id: string
          is_required: boolean | null
          name: string
          retry_count: number | null
          step_order: number
          step_type: string
          timeout_seconds: number | null
          updated_at: string | null
          workflow_id: string
        }
        Insert: {
          configuration: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          name: string
          retry_count?: number | null
          step_order: number
          step_type: string
          timeout_seconds?: number | null
          updated_at?: string | null
          workflow_id: string
        }
        Update: {
          configuration?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          name?: string
          retry_count?: number | null
          step_order?: number
          step_type?: string
          timeout_seconds?: number | null
          updated_at?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_triggers: {
        Row: {
          configuration: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          last_triggered: string | null
          trigger_type: string
          updated_at: string | null
          workflow_id: string
        }
        Insert: {
          configuration: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          trigger_type: string
          updated_at?: string | null
          workflow_id: string
        }
        Update: {
          configuration?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          trigger_type?: string
          updated_at?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_triggers_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      business_metrics_dashboard: {
        Row: {
          campaign_count: number | null
          contact_count: number | null
          failed_executions: number | null
          integration_count: number | null
          successful_executions: number | null
          total_workflow_executions: number | null
          user_id: string | null
          workflow_count: number | null
        }
        Relationships: []
      }
      heritage_insights: {
        Row: {
          connected_regions: number | null
          document_count: number | null
          family_event_count: number | null
          family_member_count: number | null
          has_dna_analysis: boolean | null
          region_names: Json | null
          user_id: string | null
        }
        Relationships: []
      }
      user_activity_summary: {
        Row: {
          event_type_counts: Json | null
          events_last_30_days: number | null
          first_activity: string | null
          last_activity: string | null
          total_events: number | null
          unique_event_types: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_security_score: {
        Args: {
          user_id: string
        }
        Returns: number
      }
      enable_emergency_security_measures: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      execute_workflow: {
        Args: {
          p_workflow_id: string
        }
        Returns: Json
      }
      get_user_business_data: {
        Args: {
          p_user_id?: string
        }
        Returns: Json
      }
      get_user_heritage_data: {
        Args: {
          p_user_id?: string
        }
        Returns: Json
      }
      get_user_profile: {
        Args: {
          p_user_id?: string
        }
        Returns: Json
      }
      log_security_alert: {
        Args: {
          p_alert_type: string
          p_severity: string
          p_user_id: string
          p_description: string
          p_details?: Json
        }
        Returns: string
      }
      track_user_activity: {
        Args: {
          p_user_id: string
          p_event_type: string
          p_event_source: string
          p_event_data?: Json
        }
        Returns: string
      }
      update_security_scores: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
          p_preferences?: Json
          p_onboarding_completed?: boolean
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never