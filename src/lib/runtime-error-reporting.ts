export type RuntimeErrorContext = Record<string, unknown>;

export function reportRuntimeError(error: unknown, context: RuntimeErrorContext = {}) {
  if (typeof window === "undefined") return;

  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  console.error("Little Red's Big Studio runtime error", {
    message,
    stack: error instanceof Error ? error.stack : undefined,
    route: window.location.pathname,
    ...context,
  });
}
