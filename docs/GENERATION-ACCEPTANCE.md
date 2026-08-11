# Generation acceptance

A generation feature is only considered working when the browser receives a usable media artifact or completed Buddy response.

Required runtime properties:

- No single public Space is a hard dependency.
- Quota/capacity failures trigger automatic failover.
- Failed providers receive exponential local cooldowns.
- Gradio APIs are discovered at runtime, including unnamed endpoints.
- Browser File/Blob inputs are normalized before inference.
- Empty responses are rejected.
- The provider that actually returned the artifact is recorded.
- Busy states have explicit timeouts.
- Song duration is automatic; there is no user-facing length selector.
- Buddy prefers local/browser speech paths before remote services.
- No paid API key is mandatory for the core free path.
