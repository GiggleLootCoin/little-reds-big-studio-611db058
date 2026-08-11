# Runtime checklist

A feature is considered working only when the browser receives a usable artifact or a completed Buddy response.

## Required behaviours

- No generation depends on a single public Space.
- Provider quota/capacity failures trigger automatic failover.
- Provider failures are cooled down locally to avoid repeated stalls.
- Gradio APIs are discovered at runtime, including unnamed endpoints.
- Browser File/Blob inputs are normalized for Gradio.
- Empty responses are rejected.
- Successful provider identity is retained for artifact resolution.
- Busy states have explicit timeouts.
- Song length is automatic; users do not choose a duration.
- Buddy has local/browser speech fallbacks before remote services.
- No paid API key is mandatory for the core free path.
