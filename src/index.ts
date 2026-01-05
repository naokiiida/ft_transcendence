import { serve } from "bun";
import index from "./index.html";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes (SPA fallback)
    "/*": index,

    // Health check endpoint (required per Constitution)
    "/health": () => Response.json({ status: "ok", timestamp: new Date().toISOString() }),

    // API routes (Hono will be integrated here for microservices)
    "/api/hello": {
      async GET() {
        return Response.json({
          message: "Hello from ft_transcendence!",
          method: "GET",
        });
      },
      async POST(req) {
        const body = await req.json();
        return Response.json({
          message: "Hello from ft_transcendence!",
          method: "POST",
          received: body,
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
