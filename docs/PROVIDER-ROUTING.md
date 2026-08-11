# Free provider routing

The Studio treats public AI Spaces as interchangeable workers, not permanent infrastructure.

For each request the runtime:

1. Filters workers by capability.
2. Skips workers in local cooldown or runtime health cooldown.
3. Discovers the current Gradio API, including named and unnamed endpoints.
4. Selects a compatible endpoint from its current parameter schema.
5. Normalizes browser File/Blob inputs through the Gradio client.
6. Waits for a real result and rejects empty output.
7. Records the provider that actually succeeded.
8. On quota/capacity/error/timeout, records failure and immediately tries the next compatible worker.

This prevents one exhausted free GPU pool from blocking the entire Studio.
