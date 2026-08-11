# Provider cooldown

The runtime applies local exponential backoff after provider failures. This is intentionally short-lived and resets on success, preventing exhausted public services from consuming the user's time while preserving automatic retry later.
