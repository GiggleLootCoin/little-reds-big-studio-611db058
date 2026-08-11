# Retry policy

Retry provider selection, not the same failing provider. Exponential cooldown prevents repeated quota/capacity failures. A successful provider is immediately eligible again for future jobs.
