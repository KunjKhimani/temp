/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import {
  styled,
  Container,
  Box,
  AppBar,
  Toolbar,
  Button,
  Typography,
} from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, selectIsLoggedIn, logout } from "../store/slice/userSlice";

const MainWrapper = styled("div")(() => ({
  display: "flex",
  minHeight: "100vh",
  width: "100%",
}));

const PageWrapper = styled("div")(() => ({
  display: "flex",
  flexGrow: 1,
  paddingBottom: "60px",
  flexDirection: "column",
  zIndex: 1,
  backgroundColor: "transparent",
}));

const AdminLayout = () => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user = useSelector(selectUser);
  const isAdmin = user.isAdmin || false;

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      navigate("/auth/signin");
    }
  }, [isLoggedIn, isAdmin, navigate]);

  const handleLogout = () => {
    dispatch(logout()); // Dispatch the logout action
    navigate("/auth/signin"); // Redirect to the signin page
  };

  return (
    <>
      <AppBar position="sticky" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Admin Panel
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <MainWrapper>
        {/* Top AppBar with Logout Button */}

        {/* Page Content */}
        <PageWrapper>
          <Container>
            <Box>
              <Outlet />
            </Box>
          </Container>
        </PageWrapper>
      </MainWrapper>
    </>
  );
};

export default AdminLayout;
