# Little Red's Big Studio — Free Runtime Policy

## Non-negotiable rule

The Studio must not require paid compute, paid APIs, paid model credits, subscriptions, or a user-supplied API key for any core feature.

## Provider order

1. Browser-local/open models when the device can reasonably run them.
2. Public open-source workers that are genuinely free to use.
3. A free public API only when it provides a meaningful capability that cannot reasonably be supplied by the first two layers.
4. Another free provider.
5. A truthful graceful fallback when no compatible free provider is available.

A paid provider must never become a hidden fallback.

## Provider admission

A provider is active only after Buddy verifies:

- public accessibility without a paid account;
- current API/schema or UI capability;
- requested input compatibility;
- expected output type;
- successful artifact retrieval;
- acceptable recent health.

A provider that fails verification is quarantined temporarily and is not presented to users as working.

## User experience

Provider selection, retries, model swaps, queue handling, and recovery remain invisible to the user. The UI reports success only after a usable artifact exists.

If no free provider can complete a request, Buddy must say so plainly rather than fabricate success or silently introduce a paid dependency.

## Mobile-first

Android/browser is the primary target. Desktop browsers may use stronger local hardware when available without changing the product workflow.

Colab is not a required runtime.
