import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "../../design-system/tokens.css";
import "../../design-system/components.css";
import "./styles/app.css";
import "./styles/tailwind.css";
import { App } from "./App";
import { AuthProvider } from "@/lib/auth";

const root = document.getElementById("root");
if (!root) throw new Error("Brak elementu #root");

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
