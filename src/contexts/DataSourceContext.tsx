import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getDiagnostics, setForceJikan, DataSource } from '@/lib/animeData';

interface DiagnosticsInfo {
  currentSource: DataSource;
  lastRequest: { endpoint: string; variables?: unknown; timestamp: number } | null;
  forceJikan: boolean;
}

interface DataSourceContextType {
  diagnostics: DiagnosticsInfo;
  refreshDiagnostics: () => void;
  simulateAniListFailure: () => void;
  resetToAniList: () => void;
  showDiagnostics: boolean;
  setShowDiagnostics: (show: boolean) => void;
}

const DataSourceContext = createContext<DataSourceContextType | undefined>(undefined);

export function DataSourceProvider({ children }: { children: React.ReactNode }) {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsInfo>(getDiagnostics());
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const refreshDiagnostics = useCallback(() => {
    setDiagnostics(getDiagnostics());
  }, []);

  // Refresh diagnostics periodically and on window focus
  useEffect(() => {
    const interval = setInterval(refreshDiagnostics, 2000);
    window.addEventListener('focus', refreshDiagnostics);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refreshDiagnostics);
    };
  }, [refreshDiagnostics]);

  const simulateAniListFailure = useCallback(() => {
    setForceJikan(true);
    refreshDiagnostics();
  }, [refreshDiagnostics]);

  const resetToAniList = useCallback(() => {
    setForceJikan(false);
    refreshDiagnostics();
  }, [refreshDiagnostics]);

  return (
    <DataSourceContext.Provider value={{
      diagnostics,
      refreshDiagnostics,
      simulateAniListFailure,
      resetToAniList,
      showDiagnostics,
      setShowDiagnostics,
    }}>
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSource() {
  const context = useContext(DataSourceContext);
  if (!context) {
    throw new Error('useDataSource must be used within a DataSourceProvider');
  }
  return context;
}
