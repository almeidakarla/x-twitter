'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { connectSocket, disconnectSocket } from '@/lib/socket';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const { token, isAuthenticated, setLoading } = useAuthStore();

  useEffect(() => {
    // Hydrate auth state
    setLoading(false);
  }, [setLoading]);

  useEffect(() => {
    // Connect socket when authenticated
    if (isAuthenticated && token) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, token]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1d9bf0',
            color: '#fff',
            borderRadius: '9999px',
            padding: '12px 24px',
          },
        }}
      />
    </QueryClientProvider>
  );
}
