import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      // Check for updates every hour
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error("SW registration error:", error);
    },
  });

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 p-4 safe-area-inset-bottom">
      <div
        className={cn(
          "mx-auto max-w-md rounded-xl bg-card/95 backdrop-blur-md border border-border/50 p-4 shadow-xl",
          "animate-in slide-in-from-bottom-5 duration-300"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-violet/10 p-2">
              <RefreshCw className="h-5 w-5 text-violet" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Update Available</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                A new version of AInime is ready. Refresh to get the latest features.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            onClick={handleUpdate}
            variant="violet"
            size="sm"
            className="flex-1"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Update Now
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}
