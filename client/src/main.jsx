// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme/theme";
import "./index.css";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "./store/store";
import Maintenance from "./views/Maintenance/Maintenance";
import { HelmetProvider } from "react-helmet-async";
import { SocketProvider } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";

import GlobalSnackbar from "./components/GlobalSnackbar"; // <<< IMPORT GlobalSnackbar

export const RootComponent = () => {
  const isMaintenance = false;

  if (isMaintenance) {
    return <Maintenance />;
  }
  return (
    <React.StrictMode>
      <HelmetProvider>
        <ThemeProvider theme={theme}>
          <ReduxProvider store={store}>
            <NotificationProvider>
              <SocketProvider>
                <App />
                <GlobalSnackbar /> {/* <<< ADD GlobalSnackbar HERE */}
              </SocketProvider>
            </NotificationProvider>
          </ReduxProvider>
        </ThemeProvider>
      </HelmetProvider>
    </React.StrictMode>
  );
};

const container = document.getElementById("root");

// Vite HMR causes issues with re-creating root, so ensure it's only created once.
if (!container._reactRootContainer) {
  const root = createRoot(container);
  container._reactRootContainer = root; // Store it for HMR check
  root.render(<RootComponent />);
} else {
  // If root already exists (due to HMR), just re-render
  container._reactRootContainer.render(<RootComponent />);
}
