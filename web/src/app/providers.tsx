'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { CurrencyProvider } from '@/lib/currency';
import { AuthProvider } from '@/lib/auth';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <AuthProvider>
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(18,22,39,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#e7e9f2',
                backdropFilter: 'blur(16px)',
              },
            }}
          />
        </AuthProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
}
