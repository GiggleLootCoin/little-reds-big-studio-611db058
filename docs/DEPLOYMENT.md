# Little Red's Big Studio — deployment policy

The Studio is intentionally deployment-provider neutral.

## Hard requirements

- No Lovable runtime or build dependency.
- No Netlify runtime dependency.
- No Cloudflare runtime dependency.
- No paid AI APIs or API keys for core features.
- Android-first; desktop browsers are supported where capabilities permit.
- Free/open-source model and browser runtimes are preferred.

## Important

The repository contains a static Vite application. Hosting is separate from the application runtime. The app must not assume a vendor-specific environment variable, serverless function, database, or provider SDK exists.

If GitHub Pages is used, the repository must meet GitHub's current Pages eligibility requirements and Pages must be enabled in repository settings. Do not add another hosting vendor merely to work around a disabled Pages setting.
