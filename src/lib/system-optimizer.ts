import { supabase } from './supabase';
import { toast } from 'sonner';

// Real system health for the System Dashboard. Every number here is measured when you ask for it:
// each component is probed, its latency recorded, and its status derived from that measurement.
// "Optimize" re-runs the probe, and for the database also runs real maintenance (admins only).

interface SystemComponent {
  id: string;
  name: string;
  status: 'optimal' | 'needs_optimization' | 'critical';
  performance: number; // 0-1, derived from measured latency (1 = fast, 0 = unreachable)
  lastOptimized: Date; // when this component was last checked or maintained
  dependencies: string[];
}

interface Probe {
  id: string;
  name: string;
  dependencies: string[];
  goodMs: number; // at or under this latency the component scores 1.0
  run: () => Promise<boolean>; // resolves true when the component answered correctly
}

const PROBES: Probe[] = [
  {
    id: 'authentication', name: 'Sign-in Service', dependencies: [], goodMs: 300,
    run: async () => !(await supabase.auth.getSession()).error,
  },
  {
    id: 'database-layer', name: 'Database', dependencies: [], goodMs: 250,
    run: async () => !(await supabase.from('health_check').select('id').limit(1)).error,
  },
  {
    id: 'edge-functions', name: 'Backend Functions', dependencies: ['database-layer'], goodMs: 800,
    run: async () => !(await supabase.functions.invoke('health-check', { method: 'GET' })).error,
  },
  {
    id: 'storage', name: 'File Storage', dependencies: ['authentication'], goodMs: 500,
    run: async () => !(await supabase.storage.from('voice-stories').list('', { limit: 1 })).error,
  },
];

// 1.0 at or below goodMs, falling linearly to 0.3 at 10x goodMs; 0 when the probe failed.
function score(ok: boolean, ms: number, goodMs: number): number {
  if (!ok) return 0;
  if (ms <= goodMs) return 1;
  return Math.max(0.3, 1 - 0.7 * ((ms - goodMs) / (9 * goodMs)));
}

function statusFor(performance: number): SystemComponent['status'] {
  if (performance === 0) return 'critical';
  return performance >= 0.8 ? 'optimal' : 'needs_optimization';
}

class SystemOptimizer {
  private static instance: SystemOptimizer;
  private components = new Map<string, SystemComponent>();

  static getInstance(): SystemOptimizer {
    if (!SystemOptimizer.instance) SystemOptimizer.instance = new SystemOptimizer();
    return SystemOptimizer.instance;
  }

  private async check(probe: Probe): Promise<SystemComponent> {
    const started = performance.now();
    let ok = false;
    try {
      ok = await probe.run();
    } catch {
      ok = false;
    }
    const perf = score(ok, performance.now() - started, probe.goodMs);
    const component: SystemComponent = {
      id: probe.id,
      name: probe.name,
      status: statusFor(perf),
      performance: Math.round(perf * 100) / 100,
      lastOptimized: new Date(),
      dependencies: probe.dependencies,
    };
    this.components.set(probe.id, component);
    return component;
  }

  async getSystemStatus(): Promise<SystemComponent[]> {
    return Promise.all(PROBES.map((p) => this.check(p)));
  }

  async forceOptimization(componentId: string): Promise<void> {
    const probe = PROBES.find((p) => p.id === componentId);
    if (!probe) {
      toast.error('Unknown component');
      return;
    }
    if (componentId === 'database-layer') {
      // Refreshes planner statistics on the busiest tables; the database only allows admins.
      const { error } = await supabase.rpc('optimize_database_performance');
      if (error) {
        toast.error(/admin/i.test(error.message) ? 'Database maintenance is available to administrators only.' : 'Database maintenance failed.');
      } else {
        toast.success('Database maintenance complete');
      }
    }
    const result = await this.check(probe);
    await supabase.from('system_optimization_logs').insert({
      component: componentId,
      status: result.status,
      metadata: { performance: result.performance, checkedAt: result.lastOptimized.toISOString() },
    });
    toast.info(`${result.name}: ${result.status === 'optimal' ? 'healthy' : result.status === 'critical' ? 'not responding' : 'slow'} (score ${Math.round(result.performance * 100)}%)`);
  }
}

export const systemOptimizer = SystemOptimizer.getInstance();
