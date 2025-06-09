import React from 'react';
import { AuthProvider } from './components/AuthProvider';
import { SuperchargedDashboard } from './components/SuperchargedDashboard';
import { SystemHealthMonitor } from './components/SystemHealthMonitor';
import { ErrorBoundary } from './lib/error-boundary';
import { Toaster } from 'sonner';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-spiritual-50">
          <SuperchargedDashboard />
          
          {/* System Health Monitor - Only show in development or when needed */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed bottom-4 right-4 w-96 z-50">
              <SystemHealthMonitor />
            </div>
          )}
        </div>
      </AuthProvider>
      <Toaster position="top-right" />
    </ErrorBoundary>
  );
}

export default App;