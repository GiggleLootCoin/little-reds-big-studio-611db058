export const onRequestGet = async ({ request }: { request: Request }) => {
  void request;
  return Response.json({
    ok: true,
    service: "little-reds-big-studio",
    time: new Date().toISOString(),
    runtime: "cloudflare-pages-functions",
    policy: "free-first",
  }, { headers: { "Cache-Control": "no-store" } });
};
