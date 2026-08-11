# Free provider failover

Public AI Spaces are optional workers. They are never treated as permanent infrastructure.

For each request the runtime filters workers by capability, skips workers in cooldown, discovers the current Gradio API including unnamed endpoints, maps current parameters, requires a real artifact, records the successful provider, and automatically moves to the next compatible free worker after quota, capacity, endpoint, timeout, or output failures.
