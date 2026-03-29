import { useState } from 'react';
import { Settings, Database, AlertTriangle, CheckCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDataSource } from '@/contexts/DataSourceContext';
import { cn } from '@/lib/utils';

export function DiagnosticsPanel() {
  const { 
    diagnostics, 
    refreshDiagnostics, 
    simulateAniListFailure, 
    resetToAniList,
    showDiagnostics,
    setShowDiagnostics 
  } = useDataSource();

  if (!showDiagnostics) {
    return (
      <button
        onClick={() => setShowDiagnostics(true)}
        className="fixed bottom-4 right-4 z-50 p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
        title="Open Dev Diagnostics"
      >
        <Settings className="w-5 h-5 text-muted-foreground" />
      </button>
    );
  }

  const isAniList = diagnostics.currentSource === 'anilist';
  const lastRequestTime = diagnostics.lastRequest?.timestamp 
    ? new Date(diagnostics.lastRequest.timestamp).toLocaleTimeString()
    : 'N/A';

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl bg-card border border-border shadow-elevated overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-secondary/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-coral" />
          <span className="font-medium text-sm">Dev Diagnostics</span>
        </div>
        <button 
          onClick={() => setShowDiagnostics(false)}
          className="p-1 rounded hover:bg-background/50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Current Source */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wider">Data Source</label>
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            isAniList ? "bg-teal/10 text-teal" : "bg-gold/10 text-gold"
          )}>
            {isAniList ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span className="font-medium">
              {isAniList ? 'AniList (Primary)' : 'Jikan (Fallback)'}
            </span>
          </div>
          {diagnostics.forceJikan && (
            <p className="text-xs text-gold">
              ⚠️ AniList failure simulated
            </p>
          )}
        </div>

        {/* Last Request */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wider">Last Request</label>
          <div className="text-sm space-y-1">
            <p className="font-mono text-xs bg-background/50 px-2 py-1 rounded truncate">
              {diagnostics.lastRequest?.endpoint || 'None'}
            </p>
            <p className="text-xs text-muted-foreground">
              Time: {lastRequestTime}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={refreshDiagnostics}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Status
          </Button>
          
          {isAniList ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-gold border-gold/30 hover:bg-gold/10"
              onClick={simulateAniListFailure}
            >
              <AlertTriangle className="w-4 h-4" />
              Simulate AniList Failure
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-teal border-teal/30 hover:bg-teal/10"
              onClick={resetToAniList}
            >
              <CheckCircle className="w-4 h-4" />
              Reset to AniList
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Floating source indicator for non-dev mode
export function SourceIndicator() {
  const { diagnostics } = useDataSource();
  
  // Don't show banner - Jikan is the normal data source on this network
  return null;
}
