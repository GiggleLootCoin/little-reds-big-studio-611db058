# Router failsafe

No provider is allowed to hold the request indefinitely. Each provider has a bounded connection/discovery/generation timeout. Failure returns control to the router, which tries the next compatible free provider.
