# Self-healing runtime policy

Little Red's Big Studio is designed to fail over without exposing provider failures to the user.

## Runtime loop

1. Discover the live Gradio API schema before execution.
2. Match Buddy's semantic inputs to the endpoint's actual parameters.
3. Normalize browser files through Gradio's supported file handler.
4. Execute directly when supported; fall back to the Gradio queue when direct prediction fails.
5. Validate the returned artifact before considering the job successful.
6. If the route fails, discard its cached client/API schema, retry once with a fresh connection, then place the route into exponential backoff.
7. Select the healthiest remaining route instead of repeatedly using a failing provider.
8. Restore a recovered route automatically after a successful probe/job.

## Watchdog

`.github/workflows/self-healing-health.yml` checks the deployed site and important public AI control planes every 15 minutes. It never stores or requires user API keys. A production health failure creates a diagnostic GitHub issue while the browser runtime continues to fail over.

## Important architecture constraint

The production site is a static GitHub Pages application. There is intentionally no paid or API-key-gated backend. Therefore self-healing is implemented at the client runtime plus repository/deployment watchdog level. A static site cannot safely modify its own source code in production. Automatic model/provider failover is the safe self-healing mechanism; source changes remain reviewable Git commits.
