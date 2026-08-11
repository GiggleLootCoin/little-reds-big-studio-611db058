# Generation failure handling

Every generation action must satisfy all of these rules:

- A provider returning HTTP success is not enough; a non-empty, usable artifact is required.
- Quota, ZeroGPU exhaustion, capacity, timeout, invalid endpoint, and malformed output errors are provider failures.
- Failed providers are cooled down with exponential backoff so one unavailable service cannot stall the Studio.
- The next compatible free provider is attempted automatically.
- If every compatible provider is unavailable, the UI reports that plainly and leaves the user's inputs intact for retry.
- No paid API key is required by the core free path.
- The UI must never remain indefinitely in a busy state.
- Provider names shown after success must identify the provider that actually returned the artifact.
