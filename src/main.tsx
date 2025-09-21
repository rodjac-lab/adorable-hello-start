import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { getStudioVisibility } from "./utils/studioVisibility";

const studioVisible = getStudioVisibility();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App studioVisible={studioVisible} />
  </StrictMode>
);
