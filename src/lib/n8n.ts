import { supabase } from './supabase';

// Client for the n8n-proxy Edge Function (talks to the user's own n8n instance).
async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('n8n-proxy', { body });
  if (error) {
    let message = 'Could not reach the automation service.';
    try { const b = await (error as { context?: Response }).context?.json(); if (b?.error) message = b.error; } catch { /* default */ }
    throw new Error(message);
  }
  return data as T;
}

export interface N8nWorkflow { name: string; nodes: unknown[]; connections: Record<string, unknown>; settings?: Record<string, unknown> }

export const n8n = {
  connect: (url: string, apiKey: string) => call<{ ok: true; url: string }>({ action: 'test', url, apiKey }),
  createWorkflow: (workflow: N8nWorkflow) => call<{ ok: true; id: string; url: string }>({ action: 'create_workflow', workflow }),
  listWorkflows: () => call<{ ok: true; workflows: Array<{ id: string; name: string; active: boolean; updatedAt: string }> }>({ action: 'list_workflows' }),
  async status(): Promise<{ connected: boolean; url: string }> {
    const { data } = await supabase.from('integration_settings').select('url,is_active').eq('integration_type', 'n8n').maybeSingle();
    return { connected: !!data?.is_active, url: data?.url ?? '' };
  },
  async disconnect() {
    const { error } = await supabase.from('integration_settings').update({ is_active: false, api_key: null }).eq('integration_type', 'n8n');
    if (error) throw error;
  },
};

// A minimal, valid starter workflow: a webhook trigger, a placeholder next step and a note
// explaining what to build. Users finish it in n8n's editor.
export function starterWorkflow(name: string, description: string): N8nWorkflow {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'genesis';
  return {
    name: `Genesis – ${name}`,
    nodes: [
      { parameters: { content: `## ${name}\n${description}\n\nReplace "Next step" with the actions you need.`, height: 220, width: 340 },
        name: 'About this workflow', type: 'n8n-nodes-base.stickyNote', typeVersion: 1, position: [180, 60] },
      { parameters: { httpMethod: 'POST', path: `${slug}-${Math.random().toString(36).slice(2, 8)}`, responseMode: 'onReceived', options: {} },
        name: 'Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 1, position: [240, 340] },
      { parameters: {}, name: 'Next step', type: 'n8n-nodes-base.noOp', typeVersion: 1, position: [500, 340] },
    ],
    connections: { Webhook: { main: [[{ node: 'Next step', type: 'main', index: 0 }]] } },
    settings: {},
  };
}
