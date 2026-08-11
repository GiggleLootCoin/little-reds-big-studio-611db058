# Output validation

A response is accepted only when it contains non-empty usable output. Blob outputs become browser object URLs; provider URLs are preserved. Empty responses are treated as failures and trigger the next provider.
