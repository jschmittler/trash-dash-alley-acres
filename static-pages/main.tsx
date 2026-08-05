import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { TrashDashGame } from "../app/trash-dash-game";
import "../app/globals.css";
import "./pages.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Trash Dash could not find its page root.");
}

createRoot(root).render(
  <StrictMode>
    <TrashDashGame />
  </StrictMode>,
);
