/* eslint-disable no-unused-vars */
// src/layouts/blankLayout.js (or your actual path)
import { AppBar, Toolbar, Typography, useTheme } from "@mui/material";
import { Link, Outlet, ScrollRestoration } from "react-router-dom"; // <--- IMPORT ScrollRestoration

const BlankLayout = () => {
  const theme = useTheme();
  return (
    <>
      <Outlet /> {/* Auth page content renders here */}
      <ScrollRestoration /> {/* <--- ADD ScrollRestoration HERE */}
    </>
  );
};

export default BlankLayout;
