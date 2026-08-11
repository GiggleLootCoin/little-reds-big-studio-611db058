import { useEffect } from "react";
import { requestPersistentStorage, saveProjectSnapshot } from "@/lib/studio-resilience";

export function StudioSafetyNet() {
  useEffect(() => {
    void requestPersistentStorage();
    const snapshot = () =>
      saveProjectSnapshot({
        id: "active-session",
        updatedAt: Date.now(),
        title: "Active Studio session",
        metadata: { pathname: window.location.pathname },
      });
    const onError = (event: ErrorEvent) =>
      window.dispatchEvent(
        new CustomEvent("studio:runtime-recovery", { detail: { message: event.message } }),
      );
    const onRejection = (event: PromiseRejectionEvent) =>
      window.dispatchEvent(
        new CustomEvent("studio:runtime-recovery", {
          detail: { message: String(event.reason ?? "unknown") },
        }),
      );
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    document.addEventListener("visibilitychange", snapshot);
    window.addEventListener("beforeunload", snapshot);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      document.removeEventListener("visibilitychange", snapshot);
      window.removeEventListener("beforeunload", snapshot);
    };
  }, []);
  return null;
}
