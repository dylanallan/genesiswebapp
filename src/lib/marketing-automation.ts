import { supabase } from './supabase';
import { toast } from 'sonner';

interface MarketingFunnel {
  id: string;
  name: string;
  description: string;
  stages: FunnelStage[];
  metrics: FunnelMetrics;
  settings: FunnelSettings;
}

interface FunnelStage {
  id: string;
  name: string;
  type: 'lead_magnet' | 'email_sequence' | 'workshop' | 'offer' | 'membership';
  content: any;
  conditions: StageCondition[];
}

interface StageCondition {
  type: string;
  value: any;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
}

interface FunnelMetrics {
  totalLeads: number;
  conversions: number;
  conversionRate: number;
  averageDaysToConvert: number;
  revenueGenerated: number;
}

interface FunnelSettings {
  autoResponders: boolean;
  notificationEmails: string[];
  tagging: boolean;
  customFields: Record<string, string>;
}

interface LeadMagnet {
  id: string;
  title: string;
  type: 'quiz' | 'guide' | 'workshop' | 'meditation';
  content: any;
  conversionRate: number;
  downloads: number;
}

interface EmailSequence {
  id: string;
  name: string;
  triggerType: 'immediate' | 'delay' | 'condition';
  emails: Email[];
  metrics: EmailMetrics;
}

interface Email {
  id: string;
  subject: string;
  content: string;
  delay?: number;
  conditions?: EmailCondition[];
}

interface EmailCondition {
  field: string;
  operator: string;
  value: any;
}

interface EmailMetrics {
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
}

interface ClientJourney {
  id: string;
  clientEmail: string;
  funnelId: string;
  currentStage: string;
  journeyData: Record<string, any>;
  startedAt: Date;
  updatedAt: Date;
}

interface AutomationWorkflow {
  id: string;
  name: string;
  triggerConditions: TriggerCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  metrics: WorkflowMetrics;
}

interface TriggerCondition {
  type: string;
  parameters: Record<string, any>;
}

interface AutomationAction {
  type: string;
  parameters: Record<string, any>;
}

interface WorkflowMetrics {
  triggered: number;
  completed: number;
  failed: number;
  averageExecutionTime: number;
}

export class MarketingAutomation {
  private static instance: MarketingAutomation;

  private constructor() {}

  static getInstance(): MarketingAutomation {
    if (!MarketingAutomation.instance) {
      MarketingAutomation.instance = new MarketingAutomation();
    }
    return MarketingAutomation.instance;
  }

  async createFunnel(funnel: Partial<MarketingFunnel>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('marketing_funnels')
        .insert([funnel])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Marketing funnel created successfully');
      return data.id;
    } catch (error) {
      console.error('Error creating funnel:', error);
      toast.error('Failed to create marketing funnel');
      throw error;
    }
  }

  async createLeadMagnet(leadMagnet: Partial<LeadMagnet>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('lead_magnets')
        .insert([leadMagnet])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Lead magnet created successfully');
      return data.id;
    } catch (error) {
      console.error('Error creating lead magnet:', error);
      toast.error('Failed to create lead magnet');
      throw error;
    }
  }

  async createEmailSequence(sequence: Partial<EmailSequence>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('email_sequences')
        .insert([sequence])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Email sequence created successfully');
      return data.id;
    } catch (error) {
      console.error('Error creating email sequence:', error);
      toast.error('Failed to create email sequence');
      throw error;
    }
  }

  async createAutomationWorkflow(workflow: Partial<AutomationWorkflow>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('automation_workflows')
        .insert([workflow])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Automation workflow created successfully');
      return data.id;
    } catch (error) {
      console.error('Error creating automation workflow:', error);
      toast.error('Failed to create automation workflow');
      throw error;
    }
  }

  async updateClientJourney(
    journeyId: string,
    stage: string,
    journeyData?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('update_journey_stage', {
          p_journey_id: journeyId,
          p_new_stage: stage,
          p_journey_data: journeyData
        });

      if (error) throw error;
      
      toast.success('Client journey updated successfully');
    } catch (error) {
      console.error('Error updating client journey:', error);
      toast.error('Failed to update client journey');
      throw error;
    }
  }

  async getFunnelAnalytics(funnelId: string): Promise<FunnelMetrics> {
    try {
      const { data, error } = await supabase
        .from('funnel_performance_summary')
        .select('*')
        .eq('funnel_id', funnelId)
        .single();

      if (error) throw error;
      
      return {
        totalLeads: data.total_leads,
        conversions: data.conversions,
        conversionRate: data.conversion_rate,
        averageDaysToConvert: data.avg_days_to_convert,
        revenueGenerated: data.revenue_generated || 0
      };
    } catch (error) {
      console.error('Error fetching funnel analytics:', error);
      throw error;
    }
  }

  async processAutomationRules(): Promise<void> {
    try {
      await supabase.rpc('process_automation_rules');
    } catch (error) {
      console.error('Error processing automation rules:', error);
      throw error;
    }
  }

  async getClientJourney(clientEmail: string): Promise<ClientJourney | null> {
    try {
      const { data, error } = await supabase
        .from('client_journeys')
        .select(`
          *,
          marketing_funnels (
            name,
            stages
          )
        `)
        .eq('client_email', clientEmail)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching client journey:', error);
      return null;
    }
  }

  async trackConversion(
    journeyId: string,
    conversionData: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('client_journeys')
        .update({
          current_stage: 'converted',
          journey_data: conversionData,
          updated_at: new Date().toISOString()
        })
        .eq('id', journeyId);

      if (error) throw error;
      
      toast.success('Conversion tracked successfully');
    } catch (error) {
      console.error('Error tracking conversion:', error);
      toast.error('Failed to track conversion');
      throw error;
    }
  }
}

export const marketingAutomation = MarketingAutomation.getInstance();