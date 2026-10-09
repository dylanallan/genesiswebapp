import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Server, Shield, CheckCircle, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Health = 'checking' | 'ok' | 'down';
interface Checks { auth: Health; database: Health; functions: Health }

// Real checks, run on demand: no hardcoded green lights.
async function runChecks(): Promise<Checks> {
  const settle = async (fn: () => Promise<boolean>): Promise<Health> => {
    try { return (await fn()) ? 'ok' : 'down'; } catch { return 'down'; }
  };
  const [auth, database, functions] = await Promise.all([
    settle(async () => !(await supabase.auth.getSession()).error),
    settle(async () => !(await supabase.from('subscriptions').select('user_id', { head: true, count: 'exact' }).limit(1)).error),
    settle(async () => !(await supabase.functions.invoke('health-check', { method: 'GET' })).error),
  ]);
  return { auth, database, functions };
}

const ROWS: Array<{ key: keyof Checks; label: string; icon: React.ElementType }> = [
  { key: 'auth', label: 'Sign-in service', icon: Shield },
  { key: 'database', label: 'Database', icon: Database },
  { key: 'functions', label: 'AI & backend functions', icon: Server },
];

export const BackendStatusIndicator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [checks, setChecks] = useState<Checks>({ auth: 'checking', database: 'checking', functions: 'checking' });

  const refresh = useCallback(async () => {
    setChecks({ auth: 'checking', database: 'checking', functions: 'checking' });
    setChecks(await runChecks());
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const values = Object.values(checks);
  const overall: Health = values.includes('checking') ? 'checking' : values.every((v) => v === 'ok') ? 'ok' : 'down';
  const summary = { checking: 'Checking systems…', ok: 'All systems operational', down: 'Some systems are unavailable' }[overall];
  const dot = { checking: 'bg-gray-400', ok: 'bg-green-500', down: 'bg-red-500' }[overall];

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div className={`w-2 h-2 rounded-full ${dot}`} />
          <span className="text-sm font-medium text-gray-700">{summary}</span>
        </button>

        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-12 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-72">
            <h3 className="font-medium text-gray-900 mb-3">System Status</h3>
            <div className="space-y-2">
              {ROWS.map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">{label}</span>
                  </div>
                  {checks[key] === 'checking' ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" aria-label="Checking" />
                    : checks[key] === 'ok' ? <CheckCircle className="w-4 h-4 text-green-500" aria-label="OK" />
                    : <AlertTriangle className="w-4 h-4 text-red-500" aria-label="Unavailable" />}
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button onClick={refresh} className="w-full flex items-center justify-center space-x-1 text-sm text-blue-600 hover:text-blue-800 py-1 px-2 rounded hover:bg-blue-50">
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BackendStatusIndicator;
