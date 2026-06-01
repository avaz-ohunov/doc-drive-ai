import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import "./theme-overrides.css";
import "./styles/mobile-main.css";

// Подключаем роутер на уровне корня приложения.
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider attribute="class" defaultTheme="light" storageKey="docdriveai-theme" disableTransitionOnChange>
      <App />
    </ThemeProvider>
  </BrowserRouter>
);
  