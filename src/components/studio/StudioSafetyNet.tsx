import { useEffect } from "react";
import { requestPersistentStorage, saveProjectSnapshot } from "@/lib/studio-resilience";

/**
 * Global, deliberately quiet safety layer. It never blocks creation and never
 * exposes provider/model implementation details to the user.
 */
export function StudioSafetyNet() {
  useEffect(() => {
    void requestPersistentStorage();

    const onError = (event: ErrorEvent) => {
      window.dispatchEvent(new CustomEvent("studio:runtime-recovery", { detail: { message: event.message } }));
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      window.dispatchEvent(new CustomEvent("studio:runtime-recovery", { detail: { message: String(event.reason ?? "unknown") } }));
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        saveProjectSnapshot({
          id: "active-session",
          updatedAt: Date.now(),
          title: "Active Studio session",
          metadata: { pathname: window.location.pathname },
        });
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onVisibility);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onVisibility);
    };
  }, []);

  return null;
}
