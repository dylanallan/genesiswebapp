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
    // Implement schedule trigger logic
    return false;
  }

  private async checkEventTrigger(parameters: any): Promise<boolean> {
    // Implement event trigger logic
    return false;
  }

  private async checkDataCondition(parameters: any): Promise<boolean> {
    // Implement data condition logic
    return false;
  }

  private async sendEmail(parameters: any): Promise<void> {
    // Implement email sending logic
  }

  private async updateData(parameters: any): Promise<void> {
    // Implement data update logic
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
        .single();

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