# Provider errors

Treat quota exceeded, capacity unavailable, invalid API, timeout, connection failure, malformed response, and missing artifact as retryable provider errors. They must not lock the Studio or be reported as successful generation.
