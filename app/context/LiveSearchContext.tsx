'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type LiveSearchContextValue = {
  liveQuery: string;
  setLiveQuery: (q: string) => void;
  clearLiveQuery: () => void;
};

const LiveSearchContext = createContext<LiveSearchContextValue | null>(null);

export function LiveSearchProvider({ children }: { children: ReactNode }) {
  const [liveQuery, setLiveQueryState] = useState('');
  const setLiveQuery = useCallback((q: string) => setLiveQueryState(q), []);
  const clearLiveQuery = useCallback(() => setLiveQueryState(''), []);

  return (
    <LiveSearchContext.Provider value={{ liveQuery, setLiveQuery, clearLiveQuery }}>
      {children}
    </LiveSearchContext.Provider>
  );
}

export function useLiveSearch() {
  const ctx = useContext(LiveSearchContext);
  if (!ctx) {
    throw new Error('useLiveSearch must be used within LiveSearchProvider');
  }
  return ctx;
}
