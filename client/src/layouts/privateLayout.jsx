import React, { useState, useEffect } from "react";
import { styled, Container, Box } from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsLoggedIn } from "../store/slice/userSlice";
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

const PrivateLayout = () => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/auth/login");
    }
  }, [isLoggedIn, navigate]);

  return (
    <MainWrapper>
      <PageWrapper>
        <Container>
          <Box>
            <Outlet />
          </Box>
        </Container>
      </PageWrapper>
    </MainWrapper>
  );
};

export default PrivateLayout;
