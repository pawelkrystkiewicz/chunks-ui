import nextra from "nextra";

const withNextra = nextra({
  contentDirBasePath: "/",
});

export default withNextra({
  // Next 16.4 `next dev` writes an AGENTS.md here when it detects an AI agent
  agentRules: false,
  // The kitchen sink is a tab of /create
  redirects: async () => [
    { source: "/kitchen-sink", destination: "/create?preview=kitchen-sink", permanent: true },
  ],
  turbopack: {
    resolveAlias: {
      "next-mdx-import-source-file": "./mdx-components.tsx",
    },
  },
});
