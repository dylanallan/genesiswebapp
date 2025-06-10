import { supabase } from './supabase';
import { toast } from 'sonner';

interface N8NCredentials {
  url: string;
  apiKey?: string;
  webhookUrl?: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  n8nDefinition: Record<string, any>;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  lastRun?: Date;
  nextRun?: Date;
  tags: string[];
  n8nUrl: string;
  n8nWorkflowId?: string;
  executionCount: number;
  successRate: number;
  averageExecutionTime: number;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'success' | 'error' | 'running';
  startTime: Date;
  endTime?: Date;
  executionTime?: number;
  error?: string;
  data?: Record<string, any>;
}

class AutomationIntegration {
  private static instance: AutomationIntegration;
  private isConnected: boolean = false;
  private n8nCredentials: N8NCredentials | null = null;
  private workflowTemplates: WorkflowTemplate[] = [];
  private workflows: Workflow[] = [];
  private webhookHandlers: Map<string, (data: any) => Promise<void>> = new Map();

  private constructor() {
    this.initialize();
  }

  static getInstance(): AutomationIntegration {
    if (!AutomationIntegration.instance) {
      AutomationIntegration.instance = new AutomationIntegration();
    }
    return AutomationIntegration.instance;
  }

  private async initialize() {
    try {
      // Load connection status from localStorage (for demo)
      this.isConnected = localStorage.getItem('n8n_connected') === 'true';
      
      if (this.isConnected) {
        this.n8nCredentials = {
          url: localStorage.getItem('n8n_url') || '',
          apiKey: localStorage.getItem('n8n_api_key') || '',
          webhookUrl: localStorage.getItem('n8n_webhook_url') || 'https://genesis-heritage.com/api/n8n-webhook'
        };
      }
      
      // Load templates
      await this.loadWorkflowTemplates();
      
      // Load existing workflows
      if (this.isConnected) {
        await this.loadWorkflows();
      }
      
      // Set up webhook listener
      this.setupWebhookListener();
    } catch (error) {
      console.error('Error initializing automation integration:', error);
    }
  }

  private async loadWorkflowTemplates() {
    try {
      // In a real implementation, fetch from database
      // For demo, we'll use hardcoded templates
      this.workflowTemplates = [
        {
          id: 'customer-onboarding',
          name: 'Customer Onboarding',
          description: 'Automate the customer onboarding process including welcome emails, data collection, and CRM updates',
          category: 'Customer Management',
          tags: ['customer', 'email', 'crm'],
          n8nDefinition: {
            nodes: [
              {
                name: 'Webhook',
                type: 'n8n-nodes-base.webhook',
                parameters: {
                  path: 'customer-onboarding',
                  responseMode: 'onReceived'
                }
              },
              {
                name: 'Send Welcome Email',
                type: 'n8n-nodes-base.emailSend',
                parameters: {
                  subject: 'Welcome to our service!',
                  text: 'Thank you for signing up!'
                }
              }
            ]
          }
        },
        {
          id: 'document-processing',
          name: 'Document Processing',
          description: 'Extract data from documents, update databases, and notify relevant team members',
          category: 'Document Management',
          tags: ['documents', 'data', 'notification'],
          n8nDefinition: {
            nodes: [
              {
                name: 'Webhook',
                type: 'n8n-nodes-base.webhook',
                parameters: {
                  path: 'document-processing',
                  responseMode: 'onReceived'
                }
              },
              {
                name: 'Extract Data',
                type: 'n8n-nodes-base.function',
                parameters: {
                  functionCode: 'return items;'
                }
              }
            ]
          }
        }
      ];
    } catch (error) {
      console.error('Error loading workflow templates:', error);
      throw error;
    }
  }

  private async loadWorkflows() {
    try {
      if (!this.isConnected || !this.n8nCredentials) {
        throw new Error('Not connected to n8n');
      }
      
      // In a real implementation, fetch from n8n API
      // For demo, we'll use mock data
      this.workflows = [
        {
          id: '1',
          name: 'Customer Onboarding',
          description: 'Automates the customer onboarding process including welcome emails, data collection, and CRM updates',
          status: 'active',
          lastRun: new Date('2025-06-10T15:30:00Z'),
          nextRun: new Date('2025-06-11T15:30:00Z'),
          tags: ['customer', 'email', 'crm'],
          n8nUrl: `${this.n8nCredentials.url}/workflow/1`,
          n8nWorkflowId: '1',
          executionCount: 342,
          successRate: 98.5,
          averageExecutionTime: 1.2
        },
        {
          id: '2',
          name: 'Invoice Processing',
          description: 'Extracts data from invoices, updates accounting system, and sends payment reminders',
          status: 'active',
          lastRun: new Date('2025-06-10T12:15:00Z'),
          nextRun: new Date('2025-06-11T12:15:00Z'),
          tags: ['finance', 'accounting', 'documents'],
          n8nUrl: `${this.n8nCredentials.url}/workflow/2`,
          n8nWorkflowId: '2',
          executionCount: 156,
          successRate: 99.2,
          averageExecutionTime: 2.5
        }
      ];
    } catch (error) {
      console.error('Error loading workflows:', error);
      throw error;
    }
  }

  private setupWebhookListener() {
    // In a real implementation, this would set up a server endpoint to receive webhooks
    // For demo purposes, we'll simulate webhook handling
    console.log('Webhook listener set up');
  }

  async connect(credentials: N8NCredentials): Promise<boolean> {
    try {
      // In a real implementation, test the connection to n8n
      // For demo, we'll simulate a successful connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.n8nCredentials = credentials;
      this.isConnected = true;
      
      // Save to localStorage for demo purposes
      localStorage.setItem('n8n_connected', 'true');
      localStorage.setItem('n8n_url', credentials.url);
      if (credentials.apiKey) {
        localStorage.setItem('n8n_api_key', credentials.apiKey);
      }
      if (credentials.webhookUrl) {
        localStorage.setItem('n8n_webhook_url', credentials.webhookUrl);
      }
      
      // In a real implementation, save to database
      try {
        await supabase
          .from('integration_settings')
          .upsert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            integration_type: 'n8n',
            settings: {
              url: credentials.url,
              api_key: credentials.apiKey,
              webhook_url: credentials.webhookUrl,
              connected_at: new Date().toISOString()
            },
            is_active: true
          });
      } catch (dbError) {
        console.warn('Failed to save to database, using localStorage fallback:', dbError);
      }
      
      // Load workflows after successful connection
      await this.loadWorkflows();
      
      return true;
    } catch (error) {
      console.error('Error connecting to n8n:', error);
      throw error;
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      this.n8nCredentials = null;
      this.isConnected = false;
      this.workflows = [];
      
      // Remove from localStorage for demo purposes
      localStorage.removeItem('n8n_connected');
      localStorage.removeItem('n8n_url');
      localStorage.removeItem('n8n_api_key');
      localStorage.removeItem('n8n_webhook_url');
      
      // In a real implementation, update database
      try {
        await supabase
          .from('integration_settings')
          .update({ is_active: false })
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .eq('integration_type', 'n8n');
      } catch (dbError) {
        console.warn('Failed to update database, using localStorage fallback:', dbError);
      }
      
      return true;
    } catch (error) {
      console.error('Error disconnecting from n8n:', error);
      throw error;
    }
  }

  async getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    return this.workflowTemplates;
  }

  async getWorkflows(): Promise<Workflow[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to n8n');
    }
    
    return this.workflows;
  }

  async createWorkflow(name: string, description: string, templateId?: string): Promise<Workflow> {
    if (!this.isConnected || !this.n8nCredentials) {
      throw new Error('Not connected to n8n');
    }
    
    try {
      // In a real implementation, call n8n API to create workflow
      // For demo, we'll simulate a successful creation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let template;
      if (templateId) {
        template = this.workflowTemplates.find(t => t.id === templateId);
      }
      
      const newWorkflow: Workflow = {
        id: Date.now().toString(),
        name,
        description,
        status: 'draft',
        tags: template?.tags || ['custom'],
        n8nUrl: `${this.n8nCredentials.url}/workflow/new`,
        n8nWorkflowId: Date.now().toString(),
        executionCount: 0,
        successRate: 0,
        averageExecutionTime: 0
      };
      
      this.workflows.push(newWorkflow);
      
      return newWorkflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow> {
    if (!this.isConnected) {
      throw new Error('Not connected to n8n');
    }
    
    try {
      // In a real implementation, call n8n API to update workflow
      // For demo, we'll simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const workflowIndex = this.workflows.findIndex(w => w.id === id);
      if (workflowIndex === -1) {
        throw new Error('Workflow not found');
      }
      
      const updatedWorkflow = {
        ...this.workflows[workflowIndex],
        ...updates
      };
      
      this.workflows[workflowIndex] = updatedWorkflow;
      
      return updatedWorkflow;
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Not connected to n8n');
    }
    
    try {
      // In a real implementation, call n8n API to delete workflow
      // For demo, we'll simulate a successful deletion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const workflowIndex = this.workflows.findIndex(w => w.id === id);
      if (workflowIndex === -1) {
        throw new Error('Workflow not found');
      }
      
      this.workflows.splice(workflowIndex, 1);
      
      return true;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
  }

  async executeWorkflow(id: string, data?: Record<string, any>): Promise<WorkflowExecution> {
    if (!this.isConnected) {
      throw new Error('Not connected to n8n');
    }
    
    try {
      // In a real implementation, call n8n API to execute workflow
      // For demo, we'll simulate a successful execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const workflow = this.workflows.find(w => w.id === id);
      if (!workflow) {
        throw new Error('Workflow not found');
      }
      
      const execution: WorkflowExecution = {
        id: Date.now().toString(),
        workflowId: id,
        status: 'success',
        startTime: new Date(),
        endTime: new Date(Date.now() + 2000),
        executionTime: 2,
        data: data || {}
      };
      
      // Update workflow stats
      workflow.executionCount++;
      workflow.lastRun = new Date();
      workflow.averageExecutionTime = (workflow.averageExecutionTime * (workflow.executionCount - 1) + 2) / workflow.executionCount;
      
      return execution;
    } catch (error) {
      console.error('Error executing workflow:', error);
      throw error;
    }
  }

  async getWorkflowExecutions(workflowId: string, limit: number = 10): Promise<WorkflowExecution[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to n8n');
    }
    
    try {
      // In a real implementation, call n8n API to get workflow executions
      // For demo, we'll return mock data
      return [
        {
          id: '1',
          workflowId,
          status: 'success',
          startTime: new Date(Date.now() - 3600000),
          endTime: new Date(Date.now() - 3598000),
          executionTime: 2,
          data: {}
        },
        {
          id: '2',
          workflowId,
          status: 'success',
          startTime: new Date(Date.now() - 7200000),
          endTime: new Date(Date.now() - 7197000),
          executionTime: 3,
          data: {}
        }
      ];
    } catch (error) {
      console.error('Error getting workflow executions:', error);
      throw error;
    }
  }

  async registerWebhookHandler(path: string, handler: (data: any) => Promise<void>): Promise<void> {
    this.webhookHandlers.set(path, handler);
  }

  async unregisterWebhookHandler(path: string): Promise<void> {
    this.webhookHandlers.delete(path);
  }

  async handleWebhook(path: string, data: any): Promise<void> {
    const handler = this.webhookHandlers.get(path);
    if (handler) {
      await handler(data);
    } else {
      console.warn(`No handler registered for webhook path: ${path}`);
    }
  }

  isN8NConnected(): boolean {
    return this.isConnected;
  }

  getN8NCredentials(): N8NCredentials | null {
    return this.n8nCredentials;
  }
}

export const automationIntegration = AutomationIntegration.getInstance();