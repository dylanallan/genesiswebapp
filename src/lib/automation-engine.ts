import { supabase } from './supabase';
import { securityMonitor } from './security';
import { aiRouter } from './ai-router';
import { toast } from 'sonner';

interface AutomationRule {
  id: string;
  trigger: TriggerCondition;
  actions: AutomationAction[];
  isActive: boolean;
  lastExecuted?: Date;
}

interface TriggerCondition {
  type: string;
  parameters: Record<string, any>;
}

interface AutomationAction {
  type: string;
  parameters: Record<string, any>;
}

class AutomationEngine {
  private static instance: AutomationEngine;
  private rules: Map<string, AutomationRule> = new Map();
  private isProcessing: boolean = false;

  private constructor() {
    this.initializeEngine();
  }

  static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine();
    }
    return AutomationEngine.instance;
  }

  private async initializeEngine() {
    try {
      // Load automation rules
      const { data: rules, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      rules?.forEach(rule => {
        this.rules.set(rule.id, {
          id: rule.id,
          trigger: rule.trigger_conditions,
          actions: rule.actions,
          isActive: true
        });
      });

      // Start processing loop
      this.startProcessing();
    } catch (error) {
      console.error('Failed to initialize automation engine:', error);
      toast.error('Automation engine initialization failed');
    }
  }

  private startProcessing() {
    setInterval(async () => {
      if (!this.isProcessing) {
        await this.processRules();
      }
    }, 5000); // Check every 5 seconds
  }

  private async processRules() {
    this.isProcessing = true;

    try {
      for (const rule of this.rules.values()) {
        if (!rule.isActive) continue;

        // Validate rule security
        if (!await this.validateRuleSecurity(rule)) {
          continue;
        }

        // Check if trigger conditions are met
        if (await this.checkTriggerConditions(rule.trigger)) {
          await this.executeActions(rule.actions);
          await this.updateRuleExecution(rule.id);
        }
      }
    } catch (error) {
      console.error('Error processing automation rules:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async validateRuleSecurity(rule: AutomationRule): Promise<boolean> {
    try {
      return await securityMonitor.validateRequest(rule, {
        type: 'automation_rule',
        id: rule.id
      });
    } catch (error) {
      console.error('Rule security validation failed:', error);
      return false;
    }
  }

  private async checkTriggerConditions(trigger: TriggerCondition): Promise<boolean> {
    try {
      switch (trigger.type) {
        case 'schedule':
          return this.checkScheduleTrigger(trigger.parameters);
        case 'event':
          return this.checkEventTrigger(trigger.parameters);
        case 'data_condition':
          return this.checkDataCondition(trigger.parameters);
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking trigger conditions:', error);
      return false;
    }
  }

  private async executeActions(actions: AutomationAction[]): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'send_email':
            await this.sendEmail(action.parameters);
            break;
          case 'update_data':
            await this.updateData(action.parameters);
            break;
          case 'ai_process':
            await this.processWithAI(action.parameters);
            break;
          default:
            console.warn(`Unknown action type: ${action.type}`);
        }
      } catch (error) {
        console.error(`Error executing action ${action.type}:`, error);
      }
    }
  }

  private async updateRuleExecution(ruleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('automation_workflows')
        .update({
          last_executed: new Date().toISOString(),
          execution_count: supabase.sql`execution_count + 1`
        })
        .eq('id', ruleId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating rule execution:', error);
    }
  }

  private checkScheduleTrigger(parameters: any): boolean {
    try {
      const { schedule, timezone = 'UTC' } = parameters;
      
      if (!schedule) return false;
      
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        timeZone: timezone 
      });
      
      // Check if current time matches the schedule
      if (schedule.type === 'daily' && schedule.time) {
        return currentTime === schedule.time;
      }
      
      if (schedule.type === 'weekly' && schedule.day && schedule.time) {
        const currentDay = now.toLocaleDateString('en-US', { 
          weekday: 'long', 
          timeZone: timezone 
        }).toLowerCase();
        return currentDay === schedule.day.toLowerCase() && currentTime === schedule.time;
      }
      
      if (schedule.type === 'monthly' && schedule.day && schedule.time) {
        const currentDay = now.getDate().toString();
        return currentDay === schedule.day && currentTime === schedule.time;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking schedule trigger:', error);
      return false;
    }
  }

  private async checkEventTrigger(parameters: any): Promise<boolean> {
    try {
      const { eventType, conditions } = parameters;
      
      if (!eventType) return false;
      
      // Check for specific event types
      switch (eventType) {
        case 'user_login':
          // This would be triggered by auth events
          return false; // Handled by auth hooks
          
        case 'data_change':
          if (conditions && conditions.table && conditions.field) {
            // Check if data has changed in the specified table/field
            const { data, error } = await supabase
              .from(conditions.table)
              .select(conditions.field)
              .order('updated_at', { ascending: false })
              .limit(1);
              
            if (!error && data && data.length > 0) {
              const lastUpdate = new Date(data[0].updated_at);
              const timeSinceUpdate = Date.now() - lastUpdate.getTime();
              return timeSinceUpdate < (conditions.timeWindow || 60000); // Default 1 minute
            }
          }
          return false;
          
        case 'ai_request':
          // Check if AI has been used recently
          const { data, error } = await supabase
            .from('ai_request_logs')
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (!error && data && data.length > 0) {
            const lastRequest = new Date(data[0].created_at);
            const timeSinceRequest = Date.now() - lastRequest.getTime();
            return timeSinceRequest < (conditions?.timeWindow || 300000); // Default 5 minutes
          }
          return false;
          
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking event trigger:', error);
      return false;
    }
  }

  private async checkDataCondition(parameters: any): Promise<boolean> {
    try {
      const { table, field, operator, value, conditions } = parameters;
      
      if (!table || !field || !operator || value === undefined) return false;
      
      let query = supabase.from(table).select(field);
      
      // Apply additional conditions if provided
      if (conditions) {
        Object.entries(conditions).forEach(([key, val]) => {
          query = query.eq(key, val);
        });
      }
      
      const { data, error } = await query;
      
      if (error || !data || data.length === 0) return false;
      
      const fieldValue = data[0][field];
      
      // Apply the operator
      switch (operator) {
        case 'equals':
          return fieldValue === value;
        case 'not_equals':
          return fieldValue !== value;
        case 'greater_than':
          return fieldValue > value;
        case 'less_than':
          return fieldValue < value;
        case 'contains':
          return String(fieldValue).includes(String(value));
        case 'not_contains':
          return !String(fieldValue).includes(String(value));
        case 'is_empty':
          return !fieldValue || fieldValue === '';
        case 'is_not_empty':
          return fieldValue && fieldValue !== '';
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking data condition:', error);
      return false;
    }
  }

  private async sendEmail(parameters: any): Promise<void> {
    try {
      const { to, subject, template, data } = parameters;
      
      // Use Supabase Edge Function for email sending
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to,
            subject,
            template,
            data
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to send email');
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  private async updateData(parameters: any): Promise<void> {
    try {
      const { table, updates, conditions } = parameters;
      
      if (!table || !updates) return;
      
      let query = supabase.from(table).update(updates);
      
      // Apply conditions if provided
      if (conditions) {
        Object.entries(conditions).forEach(([key, val]) => {
          query = query.eq(key, val);
        });
      }
      
      const { error } = await query;
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating data:', error);
      throw error;
    }
  }

  private async processWithAI(parameters: any): Promise<void> {
    try {
      await aiRouter.routeRequest(parameters.prompt, parameters.context);
    } catch (error) {
      console.error('Error processing with AI:', error);
    }
  }

  async addRule(rule: Omit<AutomationRule, 'id'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('automation_workflows')
        .insert([{
          trigger_conditions: rule.trigger,
          actions: rule.actions,
          is_active: rule.isActive
        }])
        .select()
        .maybeSingle();

      if (error) throw error;

      const newRule = {
        id: data.id,
        ...rule
      };

      this.rules.set(data.id, newRule);
      return data.id;
    } catch (error) {
      console.error('Error adding automation rule:', error);
      throw error;
    }
  }

  async updateRule(ruleId: string, updates: Partial<AutomationRule>): Promise<void> {
    try {
      const { error } = await supabase
        .from('automation_workflows')
        .update({
          trigger_conditions: updates.trigger,
          actions: updates.actions,
          is_active: updates.isActive
        })
        .eq('id', ruleId);

      if (error) throw error;

      const existingRule = this.rules.get(ruleId);
      if (existingRule) {
        this.rules.set(ruleId, {
          ...existingRule,
          ...updates
        });
      }
    } catch (error) {
      console.error('Error updating automation rule:', error);
      throw error;
    }
  }

  async deleteRule(ruleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('automation_workflows')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      this.rules.delete(ruleId);
    } catch (error) {
      console.error('Error deleting automation rule:', error);
      throw error;
    }
  }
}

export const automationEngine = AutomationEngine.getInstance();