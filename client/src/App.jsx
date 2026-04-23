/* eslint-disable no-unused-vars */
// src/App.jsx
import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import appRoutes from "./routes/router"; // Your route configuration

// Create the router instance here
const router = createBrowserRouter(appRoutes);

function App() {
  // App component now primarily renders the RouterProvider
  return <RouterProvider router={router} />;
}

export default App;
