import { SessionProvider } from './lib/session-context';
import { MainApp } from './components/MainApp';
import { missingConfig } from './lib/config';

export default function App() {
  if (missingConfig.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="max-w-lg rounded-lg border border-red-200 bg-white p-6">
          <h1 className="text-xl font-bold text-red-700 mb-2">App is not configured</h1>
          <p className="text-gray-700 mb-3">These environment variables must be set when the site is built:</p>
          <ul className="list-disc pl-6 mb-3 font-mono text-sm">{missingConfig.map((k) => <li key={k}>{k}</li>)}</ul>
          <p className="text-sm text-gray-500">See env.example, then rebuild and redeploy.</p>
        </div>
      </div>
    );
  }
  return (
    <SessionProvider>
      <MainApp />
    </SessionProvider>
  );
}
