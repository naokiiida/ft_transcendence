import { serve } from "bun";
import index from "./index.html";
import { initiateOAuthFlow, handleOAuthCallback, refreshAccessToken, fetchUserProfile } from "./lib/auth";
import type { SessionData } from "./lib/auth";
import { db } from "./lib/db";

// In-memory session store (in production, use Redis or database)
const sessions = new Map<string, SessionData>();

/**
 * Create or update user in database from 42 profile
 */
async function upsertUser(user42: {
  id: number;
  login: string;
  email: string;
  displayname: string;
  image: { link: string };
}) {
  return db.user.upsert({
    where: { id42: user42.id },
    create: {
      id42: user42.id,
      login: user42.login,
      email: user42.email,
      displayName: user42.displayname,
      imageUrl: user42.image.link,
    },
    update: {
      email: user42.email,
      displayName: user42.displayname,
      imageUrl: user42.image.link,
      isOnline: true,
      lastSeen: new Date(),
    },
  });
}

function generateSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

const PORT = parseInt(process.env.PORT ?? "3000", 10);

const server = serve({
  port: PORT,
  routes: {
    // Serve index.html for all unmatched routes (SPA fallback)
    "/*": index,

    // Health check endpoint (required per Constitution)
    "/health": () => Response.json({ status: "ok", timestamp: new Date().toISOString() }),

    // ============ Auth Routes ============

    // Initiate 42 OAuth flow
    "/auth/login": {
      async GET() {
        try {
          const { url } = await initiateOAuthFlow();
          return Response.redirect(url, 302);
        } catch (error) {
          console.error("OAuth initiation failed:", error);
          return Response.json({ error: "Failed to initiate OAuth" }, { status: 500 });
        }
      },
    },

    // OAuth callback from 42
    "/callback": {
      async GET(req) {
        const url = new URL(req.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
          console.error("OAuth error:", error);
          return Response.redirect("/?error=oauth_denied", 302);
        }

        if (!code || !state) {
          return Response.redirect("/?error=invalid_callback", 302);
        }

        try {
          const { tokens, user: user42 } = await handleOAuthCallback(code, state);

          // Create or update user in database
          const dbUser = await upsertUser(user42);

          // Create session with database user ID
          const sessionId = generateSessionId();
          const session: SessionData = {
            userId: dbUser.id, // Use database ID, not 42 ID
            login: dbUser.login,
            displayName: dbUser.displayName,
            email: dbUser.email,
            imageUrl: dbUser.imageUrl ?? "",
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: Date.now() + tokens.expires_in * 1000,
          };

          sessions.set(sessionId, session);

          // Set session cookie and redirect to home
          return new Response(null, {
            status: 302,
            headers: {
              Location: "/",
              "Set-Cookie": `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
            },
          });
        } catch (error) {
          console.error("OAuth callback failed:", error);
          return Response.redirect("/?error=auth_failed", 302);
        }
      },
    },

    // Get current user info
    "/auth/me": {
      async GET(req) {
        const cookie = req.headers.get("cookie");
        const sessionId = cookie
          ?.split(";")
          .find(c => c.trim().startsWith("session="))
          ?.split("=")[1];

        if (!sessionId) {
          return Response.json({ user: null }, { status: 401 });
        }

        const session = sessions.get(sessionId);
        if (!session) {
          return Response.json({ user: null }, { status: 401 });
        }

        // Check if token needs refresh
        if (Date.now() > session.expiresAt - 5 * 60 * 1000) {
          try {
            const tokens = await refreshAccessToken(session.refreshToken);
            session.accessToken = tokens.access_token;
            session.refreshToken = tokens.refresh_token;
            session.expiresAt = Date.now() + tokens.expires_in * 1000;
          } catch (error) {
            console.error("Token refresh failed:", error);
            sessions.delete(sessionId);
            return Response.json({ user: null }, { status: 401 });
          }
        }

        return Response.json({
          user: {
            id: session.userId,
            login: session.login,
            displayName: session.displayName,
            email: session.email,
            imageUrl: session.imageUrl,
          },
        });
      },
    },

    // Logout
    "/auth/logout": {
      async GET(req) {
        const cookie = req.headers.get("cookie");
        const sessionId = cookie
          ?.split(";")
          .find(c => c.trim().startsWith("session="))
          ?.split("=")[1];

        if (sessionId) {
          sessions.delete(sessionId);
        }

        return new Response(null, {
          status: 302,
          headers: {
            Location: "/",
            "Set-Cookie": "session=; Path=/; HttpOnly; Max-Age=0",
          },
        });
      },
    },

    // ============ API Routes ============

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

    // Get leaderboard
    "/api/leaderboard": {
      async GET(req) {
        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);

        const users = await db.user.findMany({
          select: {
            id: true,
            login: true,
            displayName: true,
            imageUrl: true,
            wins: true,
            losses: true,
            rating: true,
          },
          orderBy: [{ rating: "desc" }, { wins: "desc" }],
          take: Math.min(limit, 100), // Cap at 100
        });

        return Response.json({ leaderboard: users });
      },
    },

    // Get user profile by login
    "/api/users/:login": async req => {
      const login = req.params.login;

      const user = await db.user.findUnique({
        where: { login },
        select: {
          id: true,
          login: true,
          displayName: true,
          imageUrl: true,
          wins: true,
          losses: true,
          rating: true,
          isOnline: true,
          lastSeen: true,
          createdAt: true,
        },
      });

      if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      return Response.json({ user });
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
