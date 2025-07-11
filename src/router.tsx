import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { ConvexProvider, ConvexReactClient } from "convex/react";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

export function createRouter() {
  const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
  if (!CONVEX_URL) {
    console.error("missing envar CONVEX_URL");
  }
  const convexReactClient = new ConvexReactClient(
    import.meta.env.VITE_CONVEX_URL as string
  );

  // Create a new router instance
  const router = createTanStackRouter({
    routeTree,
    context: {},
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultPreloadStaleTime: 0,
    defaultViewTransition: true,
    Wrap: ({ children }) => (
      <ConvexProvider client={convexReactClient}>{children}</ConvexProvider>
    ),
  });

  return router;
}

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
