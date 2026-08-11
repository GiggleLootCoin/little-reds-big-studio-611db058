# Final failsafe

A failed free provider cannot leave the Studio in a permanent busy state. Bounded timeouts return control to the router, which tries the next compatible worker or reports a clear retryable failure.
