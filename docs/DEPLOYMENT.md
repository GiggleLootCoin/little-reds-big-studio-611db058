# Little Red's Big Studio — deployment policy

The Studio is a browser-first, provider-light static application. The repository uses GitHub Pages as its zero-cost production host while keeping the application itself free of hosting-vendor SDKs and paid AI services.

## Hard requirements

- No Lovable, Netlify or Cloudflare runtime/build dependency.
- No paid AI APIs or API keys for core features.
- Android-first; desktop browsers are supported where capabilities permit.
- Free/open-source model and browser runtimes are preferred.
- Browser storage remains the default project/profile storage.

## GitHub Pages

The production workflow is `.github/workflows/pages.yml`.

It:

1. checks out `main`;
2. installs the locked npm dependencies;
3. builds with `VITE_BASE_PATH=/little-reds-big-studio-611db058/`;
4. copies the SPA entry point to `dist/404.html` so direct Pages navigation can recover client-side routes;
5. uploads the static artifact; and
6. deploys it through GitHub Pages.

The application uses `import.meta.env.BASE_URL` for router and static asset navigation, so the same source continues to work at the origin root on other static hosts.

Production URL:

`https://gigglelootcoin.github.io/little-reds-big-studio-611db058/`

## AI execution

GitHub Pages only hosts the Studio. Heavy AI generation is handed off to configured free/open browser Spaces or free GPU workspaces. The Studio does not require a paid inference gateway, API key, database, or vendor-specific server function.
