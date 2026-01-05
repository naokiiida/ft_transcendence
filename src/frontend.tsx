/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import { AuthProvider } from "./lib/auth/AuthContext";
import { HomePage } from "./pages/Home";
import { LoginPage } from "./pages/Login";
import { PrivacyPage } from "./pages/Privacy";
import { TermsPage } from "./pages/Terms";
import { GamePage } from "./pages/Game";
import { ProfilePage } from "./pages/Profile";
import { FriendsPage } from "./pages/Friends";
import { LeaderboardPage } from "./pages/Leaderboard";
import { TournamentsPage } from "./pages/Tournaments";
import { TournamentPage } from "./pages/Tournament";

import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/privacy",
    element: <PrivacyPage />,
  },
  {
    path: "/terms",
    element: <TermsPage />,
  },
  {
    path: "/game/:gameId",
    element: <GamePage />,
  },
  {
    path: "/profile",
    element: <ProfilePage />,
  },
  {
    path: "/profile/:login",
    element: <ProfilePage />,
  },
  {
    path: "/friends",
    element: <FriendsPage />,
  },
  {
    path: "/leaderboard",
    element: <LeaderboardPage />,
  },
  {
    path: "/tournaments",
    element: <TournamentsPage />,
  },
  {
    path: "/tournament/:id",
    element: <TournamentPage />,
  },
]);

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);

if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  // The hot module reloading API is not available in production.
  createRoot(elem).render(app);
}
