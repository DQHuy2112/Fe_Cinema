'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/app/context/AuthContext';
import { LiveSearchProvider } from '@/app/context/LiveSearchContext';
import { ToastProvider } from '@/app/components/toast/Toast';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LiveSearchProvider>
        <ToastProvider>{children}</ToastProvider>
      </LiveSearchProvider>
    </AuthProvider>
  );
}