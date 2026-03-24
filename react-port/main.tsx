import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PhantomHomepage from "./PhantomHomepage";
import "./preview.css";

const container = document.getElementById("app");

if (!container) {
  throw new Error("React preview root element was not found.");
}

createRoot(container).render(
  <StrictMode>
    <PhantomHomepage />
  </StrictMode>
);
