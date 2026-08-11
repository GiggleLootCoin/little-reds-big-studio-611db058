# Failover

When a free provider fails, the runtime records the failure, applies a short exponential cooldown, and tries the next compatible worker. A successful worker clears its cooldown. This is deliberately client-side and requires no paid service.
