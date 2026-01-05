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
