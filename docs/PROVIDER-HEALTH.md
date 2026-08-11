# Provider health

The browser maintains a lightweight per-request provider health cache. Successful providers are cleared from cooldown. Failed providers receive exponential cooldowns capped at thirty minutes. Runtime health remains authoritative for live endpoint failures.
