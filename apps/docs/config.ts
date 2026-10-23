export const config = {
  analytics: {
    scriptUrl: process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL,
    websiteId: process.env.NEXT_PUBLIC_ANALYTICS_ID,
    // Umami's data-domains: the tracker sends nothing on any other host (previews, the
    // per-deployment *.vercel.app URLs). VERCEL_URL is that per-deployment host, so it would
    // never match the domain visitors use.
    domains: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  },
};
