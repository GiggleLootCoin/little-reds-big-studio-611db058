# Provider health implementation

Provider cooldown state is stored locally in the browser. A failed provider is skipped for a short exponential window, capped at thirty minutes. A successful provider is cleared immediately. This avoids hammering exhausted public GPU endpoints while preserving the $0 core path.
