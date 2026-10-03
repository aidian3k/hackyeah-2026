import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "../../design-system/tokens.css";
import "../../design-system/components.css";
import "./styles/app.css";
import { App } from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("Brak elementu #root");

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
