import { Switch, Route } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Dashboard from '@/pages/dashboard';

function App() {
  // For GitHub Pages, just render Dashboard directly - no routing needed for single page app
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Dashboard />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
