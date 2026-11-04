import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import RoutesComponent from './app.tsx';
import './index.standalone.css';
import { Toaster } from '@client/src/components/ui/sonner';

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-slate-50">
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
      <h2 className="text-xl font-semibold text-red-600 mb-2">页面出错了</h2>
      <p className="text-sm text-gray-500 mb-4">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        重试
      </button>
    </div>
  </div>
);

const BASE_PATH = import.meta.env.BASE_URL || '/';

const MainApp = () => {
  return (
    <BrowserRouter basename={BASE_PATH}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <RoutesComponent />
        <Toaster position="top-center" />
      </ErrorBoundary>
    </BrowserRouter>
  );
};

createRoot(document.getElementById('root')!).render(<MainApp />);
