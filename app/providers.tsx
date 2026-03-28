'use client';

import { useEffect, useState, ReactNode } from 'react';
import { AuthProvider } from '@/app/context/AuthContext';

export default function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
