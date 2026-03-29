import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if user dismissed the prompt before
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

      // Show prompt if not dismissed or dismissed more than 7 days ago
      if (!dismissed || daysSinceDismissed > 7) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setIsInstalled(true);
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error("Error installing PWA:", error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  const handleIOSInstructions = () => {
    setShowIOSInstructions(true);
  };

  // Don't render if already installed
  if (isInstalled) return null;

  // iOS-specific install instructions
  if (showIOSInstructions) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-area-inset-bottom">
        <div className="mx-auto max-w-md rounded-xl bg-card/95 backdrop-blur-md border border-border/50 p-4 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-coral/10 p-2">
                <Smartphone className="h-5 w-5 text-coral" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Install AInime</h3>
                <div className="mt-2 text-sm text-muted-foreground space-y-2">
                  <p>To install on iOS:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Tap the Share button <span className="inline-block w-4 h-4 align-middle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
                      </svg>
                    </span></li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" to confirm</li>
                  </ol>
                </div>
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
        </div>
      </div>
    );
  }

  // Show prompt for Android/Desktop or iOS
  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-area-inset-bottom">
      <div
        className={cn(
          "mx-auto max-w-md rounded-xl bg-card/95 backdrop-blur-md border border-border/50 p-4 shadow-xl",
          "animate-in slide-in-from-bottom-5 duration-300"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gradient-to-br from-coral to-violet p-2">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Install AInime</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get the full app experience with offline support and quick access.
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
          {isIOS ? (
            <Button
              onClick={handleIOSInstructions}
              variant="coral"
              size="sm"
              className="flex-1"
            >
              <Smartphone className="mr-2 h-4 w-4" />
              How to Install
            </Button>
          ) : (
            <Button
              onClick={handleInstallClick}
              variant="coral"
              size="sm"
              className="flex-1"
              disabled={!deferredPrompt}
            >
              <Download className="mr-2 h-4 w-4" />
              Install App
            </Button>
          )}
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
          >
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
