import { serve } from "bun";
import index from "./index.html";
import {
  initiateOAuthFlow,
  handleOAuthCallback,
  refreshAccessToken,
  hashPassword,
  verifyPassword,
  validatePassword,
  validateEmail,
  validateUsername,
} from "./lib/auth";
import type { SessionData, RegisterRequest, LoginRequest } from "./lib/auth";
import { db } from "./lib/db";
import { websocketHandlers, findOrCreateQuickMatch, getGameRoomsInfo, type WebSocketData } from "./lib/game";

// In-memory session store (in production, use Redis or database)
const sessions = new Map<string, SessionData>();

/**
 * Create or update user in database from 42 profile
 */
async function upsertUser42(user42: {
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
      authMethod: "oauth42",
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

/**
 * Create local user with email/password
 */
async function createLocalUser(data: {
  email: string;
  username: string;
  passwordHash: string;
  displayName: string;
}) {
  return db.user.create({
    data: {
      email: data.email,
      login: data.username,
      displayName: data.displayName,
      passwordHash: data.passwordHash,
      authMethod: "local",
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
          const dbUser = await upsertUser42(user42);

          // Create session with database user ID
          const sessionId = generateSessionId();
          const session: SessionData = {
            userId: dbUser.id, // Use database ID, not 42 ID
            login: dbUser.login,
            displayName: dbUser.displayName,
            email: dbUser.email,
            imageUrl: dbUser.imageUrl ?? "",
            authMethod: "oauth42",
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

        // Check if OAuth token needs refresh (only for OAuth users)
        if (
          session.authMethod === "oauth42" &&
          session.expiresAt &&
          session.refreshToken &&
          Date.now() > session.expiresAt - 5 * 60 * 1000
        ) {
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
            authMethod: session.authMethod,
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

    // ============ Local Auth Routes (Email/Password) ============

    // Register new user with email/password
    "/auth/register": {
      async POST(req) {
        try {
          const body = (await req.json()) as RegisterRequest;
          const { email, username, password, displayName } = body;

          // Validate inputs
          const emailError = validateEmail(email);
          if (emailError) {
            return Response.json({ error: emailError }, { status: 400 });
          }

          const usernameError = validateUsername(username);
          if (usernameError) {
            return Response.json({ error: usernameError }, { status: 400 });
          }

          const passwordError = validatePassword(password);
          if (passwordError) {
            return Response.json({ error: passwordError }, { status: 400 });
          }

          // Check if email already exists
          const existingEmail = await db.user.findUnique({
            where: { email },
            select: { id: true },
          });
          if (existingEmail) {
            return Response.json({ error: "Email already registered" }, { status: 409 });
          }

          // Check if username already exists
          const existingUsername = await db.user.findUnique({
            where: { login: username },
            select: { id: true },
          });
          if (existingUsername) {
            return Response.json({ error: "Username already taken" }, { status: 409 });
          }

          // Hash password with bcrypt (salt included in hash)
          const passwordHash = await hashPassword(password);

          // Create user
          const dbUser = await createLocalUser({
            email,
            username,
            passwordHash,
            displayName: displayName || username,
          });

          // Create session
          const sessionId = generateSessionId();
          const session: SessionData = {
            userId: dbUser.id,
            login: dbUser.login,
            displayName: dbUser.displayName,
            email: dbUser.email,
            imageUrl: dbUser.imageUrl ?? "",
            authMethod: "local",
          };

          sessions.set(sessionId, session);

          // Return success with session cookie
          return new Response(
            JSON.stringify({
              success: true,
              user: {
                id: dbUser.id,
                login: dbUser.login,
                displayName: dbUser.displayName,
                email: dbUser.email,
                imageUrl: dbUser.imageUrl,
                authMethod: "local",
              },
            }),
            {
              status: 201,
              headers: {
                "Content-Type": "application/json",
                "Set-Cookie": `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
              },
            }
          );
        } catch (error) {
          console.error("Registration failed:", error);
          return Response.json({ error: "Registration failed" }, { status: 500 });
        }
      },
    },

    // Login with email/password
    "/auth/local/login": {
      async POST(req) {
        try {
          const body = (await req.json()) as LoginRequest;
          const { email, password } = body;

          if (!email || !password) {
            return Response.json({ error: "Email and password required" }, { status: 400 });
          }

          // Find user by email
          const dbUser = await db.user.findUnique({
            where: { email },
            select: {
              id: true,
              login: true,
              displayName: true,
              email: true,
              imageUrl: true,
              passwordHash: true,
              authMethod: true,
            },
          });

          if (!dbUser) {
            // Use generic error to prevent user enumeration
            return Response.json({ error: "Invalid email or password" }, { status: 401 });
          }

          // Check if user has local auth
          if (dbUser.authMethod !== "local" || !dbUser.passwordHash) {
            return Response.json(
              { error: "This account uses 42 OAuth login. Please use 42 login instead." },
              { status: 400 }
            );
          }

          // Verify password (constant-time comparison via bcrypt)
          const isValid = await verifyPassword(password, dbUser.passwordHash);
          if (!isValid) {
            return Response.json({ error: "Invalid email or password" }, { status: 401 });
          }

          // Update last seen
          await db.user.update({
            where: { id: dbUser.id },
            data: { isOnline: true, lastSeen: new Date() },
          });

          // Create session
          const sessionId = generateSessionId();
          const session: SessionData = {
            userId: dbUser.id,
            login: dbUser.login,
            displayName: dbUser.displayName,
            email: dbUser.email,
            imageUrl: dbUser.imageUrl ?? "",
            authMethod: "local",
          };

          sessions.set(sessionId, session);

          return new Response(
            JSON.stringify({
              success: true,
              user: {
                id: dbUser.id,
                login: dbUser.login,
                displayName: dbUser.displayName,
                email: dbUser.email,
                imageUrl: dbUser.imageUrl,
                authMethod: "local",
              },
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Set-Cookie": `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
              },
            }
          );
        } catch (error) {
          console.error("Login failed:", error);
          return Response.json({ error: "Login failed" }, { status: 500 });
        }
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

    // ============ User Management Routes ============

    // Update current user profile
    "/api/users/me": {
      async PATCH(req) {
        // Get session
        const cookie = req.headers.get("cookie");
        const sessionId = cookie
          ?.split(";")
          .find(c => c.trim().startsWith("session="))
          ?.split("=")[1];

        if (!sessionId) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const session = sessions.get(sessionId);
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
          const body = await req.json();
          const { displayName } = body;

          // Validate displayName if provided
          if (displayName !== undefined) {
            if (typeof displayName !== "string" || displayName.length < 1 || displayName.length > 50) {
              return Response.json({ error: "Display name must be 1-50 characters" }, { status: 400 });
            }
          }

          // Update user
          const updatedUser = await db.user.update({
            where: { id: session.userId },
            data: {
              ...(displayName !== undefined && { displayName }),
              updatedAt: new Date(),
            },
            select: {
              id: true,
              login: true,
              displayName: true,
              imageUrl: true,
              wins: true,
              losses: true,
              rating: true,
            },
          });

          // Update session if displayName changed
          if (displayName !== undefined) {
            session.displayName = displayName;
          }

          return Response.json({ user: updatedUser });
        } catch (error) {
          console.error("Profile update failed:", error);
          return Response.json({ error: "Failed to update profile" }, { status: 500 });
        }
      },
    },

    // Upload avatar
    "/api/users/me/avatar": {
      async POST(req) {
        // Get session
        const cookie = req.headers.get("cookie");
        const sessionId = cookie
          ?.split(";")
          .find(c => c.trim().startsWith("session="))
          ?.split("=")[1];

        if (!sessionId) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const session = sessions.get(sessionId);
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
          const contentType = req.headers.get("content-type") ?? "";
          if (!contentType.includes("multipart/form-data")) {
            return Response.json({ error: "Content-Type must be multipart/form-data" }, { status: 400 });
          }

          const formData = await req.formData();
          const file = formData.get("avatar");

          if (!file || !(file instanceof File)) {
            return Response.json({ error: "No avatar file provided" }, { status: 400 });
          }

          // Validate file type
          const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
          if (!allowedTypes.includes(file.type)) {
            return Response.json({ error: "File must be JPEG, PNG, GIF, or WebP" }, { status: 400 });
          }

          // Validate file size (2MB max per Constitution)
          const MAX_SIZE = 2 * 1024 * 1024;
          if (file.size > MAX_SIZE) {
            return Response.json({ error: "File size must be under 2MB" }, { status: 400 });
          }

          // Read file content and convert to data URL for storage
          // (In production, upload to cloud storage like S3/Cloudflare R2)
          const buffer = await file.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const dataUrl = `data:${file.type};base64,${base64}`;

          // Update user avatar
          const updatedUser = await db.user.update({
            where: { id: session.userId },
            data: {
              imageUrl: dataUrl,
              updatedAt: new Date(),
            },
            select: {
              id: true,
              login: true,
              displayName: true,
              imageUrl: true,
            },
          });

          // Update session
          session.imageUrl = dataUrl;

          return Response.json({ user: updatedUser });
        } catch (error) {
          console.error("Avatar upload failed:", error);
          return Response.json({ error: "Failed to upload avatar" }, { status: 500 });
        }
      },
    },

    // ============ Friends Routes ============

    // Get current user's friends list
    "/api/friends": {
      async GET(req) {
        const cookie = req.headers.get("cookie");
        const sessionId = cookie
          ?.split(";")
          .find(c => c.trim().startsWith("session="))
          ?.split("=")[1];

        if (!sessionId) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const session = sessions.get(sessionId);
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get friendships where user is either user1 or user2
        const friendships = await db.friendship.findMany({
          where: {
            OR: [{ user1Id: session.userId }, { user2Id: session.userId }],
          },
          include: {
            user1: {
              select: {
                id: true,
                login: true,
                displayName: true,
                imageUrl: true,
                isOnline: true,
                lastSeen: true,
              },
            },
            user2: {
              select: {
                id: true,
                login: true,
                displayName: true,
                imageUrl: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        });

        // Extract the friend (not the current user) from each friendship
        const friends = friendships.map(f =>
          f.user1Id === session.userId ? f.user2 : f.user1
        );

        return Response.json({ friends });
      },
    },

    // Get pending friend requests (received)
    "/api/friends/requests": {
      async GET(req) {
        const cookie = req.headers.get("cookie");
        const sessionId = cookie
          ?.split(";")
          .find(c => c.trim().startsWith("session="))
          ?.split("=")[1];

        if (!sessionId) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const session = sessions.get(sessionId);
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get received pending requests
        const received = await db.friendRequest.findMany({
          where: {
            receiverId: session.userId,
            status: "pending",
          },
          include: {
            sender: {
              select: {
                id: true,
                login: true,
                displayName: true,
                imageUrl: true,
              },
            },
          },
        });

        // Get sent pending requests
        const sent = await db.friendRequest.findMany({
          where: {
            senderId: session.userId,
            status: "pending",
          },
          include: {
            receiver: {
              select: {
                id: true,
                login: true,
                displayName: true,
                imageUrl: true,
              },
            },
          },
        });

        return Response.json({
          received: received.map(r => ({
            id: r.id,
            sender: r.sender,
            createdAt: r.createdAt,
          })),
          sent: sent.map(s => ({
            id: s.id,
            receiver: s.receiver,
            createdAt: s.createdAt,
          })),
        });
      },
    },

    // Send friend request
    "/api/friends/request/:login": {
      async POST(req) {
        const cookie = req.headers.get("cookie");
        const sessionId = cookie
          ?.split(";")
          .find(c => c.trim().startsWith("session="))
          ?.split("=")[1];

        if (!sessionId) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const session = sessions.get(sessionId);
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const targetLogin = req.params.login;

        // Find target user
        const targetUser = await db.user.findUnique({
          where: { login: targetLogin },
          select: { id: true },
        });

        if (!targetUser) {
          return Response.json({ error: "User not found" }, { status: 404 });
        }

        if (targetUser.id === session.userId) {
          return Response.json({ error: "Cannot send friend request to yourself" }, { status: 400 });
        }

        // Check if already friends
        const existingFriendship = await db.friendship.findFirst({
          where: {
            OR: [
              { user1Id: session.userId, user2Id: targetUser.id },
              { user1Id: targetUser.id, user2Id: session.userId },
            ],
          },
        });

        if (existingFriendship) {
          return Response.json({ error: "Already friends" }, { status: 409 });
        }

        // Check for existing pending request in either direction
        const existingRequest = await db.friendRequest.findFirst({
          where: {
            OR: [
              { senderId: session.userId, receiverId: targetUser.id, status: "pending" },
              { senderId: targetUser.id, receiverId: session.userId, status: "pending" },
            ],
          },
        });

        if (existingRequest) {
          // If they sent us a request, auto-accept it
          if (existingRequest.senderId === targetUser.id) {
            await db.friendRequest.update({
              where: { id: existingRequest.id },
              data: { status: "accepted" },
            });

            // Create friendship (user with lower ID is user1)
            const [user1Id, user2Id] =
              session.userId < targetUser.id
                ? [session.userId, targetUser.id]
                : [targetUser.id, session.userId];

            await db.friendship.create({
              data: { user1Id, user2Id },
            });

            return Response.json({ message: "Friend request accepted", status: "accepted" });
          }

          return Response.json({ error: "Friend request already sent" }, { status: 409 });
        }

        // Create new friend request
        await db.friendRequest.create({
          data: {
            senderId: session.userId,
            receiverId: targetUser.id,
            status: "pending",
          },
        });

        return Response.json({ message: "Friend request sent", status: "pending" }, { status: 201 });
      },
    },

    // Accept friend request
    "/api/friends/accept/:requestId": {
      async POST(req) {
        const cookie = req.headers.get("cookie");
        const sessionId = cookie
          ?.split(";")
          .find(c => c.trim().startsWith("session="))
          ?.split("=")[1];

        if (!sessionId) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const session = sessions.get(sessionId);
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const requestId = parseInt(req.params.requestId, 10);
        if (isNaN(requestId)) {
          return Response.json({ error: "Invalid request ID" }, { status: 400 });
        }

        const friendRequest = await db.friendRequest.findUnique({
          where: { id: requestId },
        });

        if (!friendRequest) {
          return Response.json({ error: "Friend request not found" }, { status: 404 });
        }

        if (friendRequest.receiverId !== session.userId) {
          return Response.json({ error: "Cannot accept this request" }, { status: 403 });
        }

        if (friendRequest.status !== "pending") {
          return Response.json({ error: "Request already processed" }, { status: 400 });
        }

        // Update request status
        await db.friendRequest.update({
          where: { id: requestId },
          data: { status: "accepted" },
        });

        // Create friendship (user with lower ID is user1)
        const [user1Id, user2Id] =
          session.userId < friendRequest.senderId
            ? [session.userId, friendRequest.senderId]
            : [friendRequest.senderId, session.userId];

        await db.friendship.create({
          data: { user1Id, user2Id },
        });

        return Response.json({ message: "Friend request accepted" });
      },
    },

    // Reject friend request
    "/api/friends/reject/:requestId": {
      async POST(req) {
        const cookie = req.headers.get("cookie");
        const sessionId = cookie
          ?.split(";")
          .find(c => c.trim().startsWith("session="))
          ?.split("=")[1];

        if (!sessionId) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const session = sessions.get(sessionId);
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const requestId = parseInt(req.params.requestId, 10);
        if (isNaN(requestId)) {
          return Response.json({ error: "Invalid request ID" }, { status: 400 });
        }

        const friendRequest = await db.friendRequest.findUnique({
          where: { id: requestId },
        });

        if (!friendRequest) {
          return Response.json({ error: "Friend request not found" }, { status: 404 });
        }

        if (friendRequest.receiverId !== session.userId) {
          return Response.json({ error: "Cannot reject this request" }, { status: 403 });
        }

        if (friendRequest.status !== "pending") {
          return Response.json({ error: "Request already processed" }, { status: 400 });
        }

        // Update request status
        await db.friendRequest.update({
          where: { id: requestId },
          data: { status: "rejected" },
        });

        return Response.json({ message: "Friend request rejected" });
      },
    },

    // Remove friend
    "/api/friends/:login": {
      async DELETE(req) {
        const cookie = req.headers.get("cookie");
        const sessionId = cookie
          ?.split(";")
          .find(c => c.trim().startsWith("session="))
          ?.split("=")[1];

        if (!sessionId) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const session = sessions.get(sessionId);
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const targetLogin = req.params.login;

        // Find target user
        const targetUser = await db.user.findUnique({
          where: { login: targetLogin },
          select: { id: true },
        });

        if (!targetUser) {
          return Response.json({ error: "User not found" }, { status: 404 });
        }

        // Find and delete friendship
        const friendship = await db.friendship.findFirst({
          where: {
            OR: [
              { user1Id: session.userId, user2Id: targetUser.id },
              { user1Id: targetUser.id, user2Id: session.userId },
            ],
          },
        });

        if (!friendship) {
          return Response.json({ error: "Not friends with this user" }, { status: 404 });
        }

        await db.friendship.delete({
          where: { id: friendship.id },
        });

        return Response.json({ message: "Friend removed" });
      },
    },

    // ============ Match History Routes ============

    // Get current user's match history
    "/api/matches": {
      async GET(req) {
        const cookie = req.headers.get("cookie");
        const sessionId = cookie
          ?.split(";")
          .find(c => c.trim().startsWith("session="))
          ?.split("=")[1];

        if (!sessionId) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const session = sessions.get(sessionId);
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
        const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

        const matches = await db.gameSession.findMany({
          where: {
            OR: [{ player1Id: session.userId }, { player2Id: session.userId }],
            status: "finished",
          },
          include: {
            player1: {
              select: {
                id: true,
                login: true,
                displayName: true,
                imageUrl: true,
              },
            },
            player2: {
              select: {
                id: true,
                login: true,
                displayName: true,
                imageUrl: true,
              },
            },
          },
          orderBy: { finishedAt: "desc" },
          take: Math.min(limit, 100),
          skip: offset,
        });

        // Transform to include user's perspective
        const formattedMatches = matches.map(m => ({
          id: m.id,
          opponent: m.player1Id === session.userId ? m.player2 : m.player1,
          userScore: m.player1Id === session.userId ? m.score1 : m.score2,
          opponentScore: m.player1Id === session.userId ? m.score2 : m.score1,
          won: m.winnerId === session.userId,
          playedAt: m.finishedAt,
          tournamentId: m.tournamentId,
        }));

        return Response.json({ matches: formattedMatches });
      },
    },

    // Get match history for a specific user
    "/api/users/:login/matches": async req => {
      const login = req.params.login;

      const user = await db.user.findUnique({
        where: { login },
        select: { id: true },
      });

      if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
      const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

      const matches = await db.gameSession.findMany({
        where: {
          OR: [{ player1Id: user.id }, { player2Id: user.id }],
          status: "finished",
        },
        include: {
          player1: {
            select: {
              id: true,
              login: true,
              displayName: true,
              imageUrl: true,
            },
          },
          player2: {
            select: {
              id: true,
              login: true,
              displayName: true,
              imageUrl: true,
            },
          },
        },
        orderBy: { finishedAt: "desc" },
        take: Math.min(limit, 100),
        skip: offset,
      });

      // Transform to include target user's perspective
      const formattedMatches = matches.map(m => ({
        id: m.id,
        opponent: m.player1Id === user.id ? m.player2 : m.player1,
        userScore: m.player1Id === user.id ? m.score1 : m.score2,
        opponentScore: m.player1Id === user.id ? m.score2 : m.score1,
        won: m.winnerId === user.id,
        playedAt: m.finishedAt,
        tournamentId: m.tournamentId,
      }));

      return Response.json({ matches: formattedMatches });
    },

    // ============ Game Routes ============

    // Get quick match game ID
    "/api/game/quick-match": {
      GET(req) {
        const cookie = req.headers.get("cookie");
        const sessionId = cookie
          ?.split(";")
          .find(c => c.trim().startsWith("session="))
          ?.split("=")[1];

        if (!sessionId || !sessions.get(sessionId)) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const gameId = findOrCreateQuickMatch();
        return Response.json({ gameId });
      },
    },

    // Get active games (for debugging)
    "/api/game/rooms": {
      GET() {
        return Response.json({ rooms: getGameRoomsInfo() });
      },
    },

    // WebSocket upgrade endpoint
    "/ws": {
      async GET(req) {
        // Get session from cookie
        const cookie = req.headers.get("cookie");
        const sessionId = cookie
          ?.split(";")
          .find(c => c.trim().startsWith("session="))
          ?.split("=")[1];

        if (!sessionId) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const session = sessions.get(sessionId);
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Upgrade to WebSocket
        const success = server.upgrade(req, {
          data: {
            userId: session.userId,
            login: session.login,
            displayName: session.displayName,
            gameId: null,
            playerIndex: null,
            paddleDirection: "stop",
          } satisfies WebSocketData,
        });

        if (!success) {
          return Response.json({ error: "WebSocket upgrade failed" }, { status: 500 });
        }

        // Return undefined to indicate upgrade handled
        return undefined;
      },
    },
  },

  // WebSocket handlers
  websocket: websocketHandlers,

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
