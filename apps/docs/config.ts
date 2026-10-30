export const config = {
  analytics: {
    scriptUrl: process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL,
    websiteId: process.env.NEXT_PUBLIC_ANALYTICS_ID,
    // Umami's data-domains: the tracker sends nothing from any host but the production domain,
    // e.g. a deployment's own *.vercel.app URL or the chunks-ui-docs.vercel.app alias.
    // VERCEL_PROJECT_PRODUCTION_URL is the shortest production custom domain, so a shorter one
    // added later becomes the filter; VERCEL_URL would be the per-deployment host.
    domains: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  },
  // The landing's hero badge and Hire me section. Flip to false on hire: the claim never expires on its own.
  openToWork: true,
};
