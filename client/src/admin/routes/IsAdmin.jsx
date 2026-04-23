/* eslint-disable no-unused-vars */
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectIsLoggedIn, selectUser } from "../../store/slice/userSlice"; // Adjust path
import { Navigate, Outlet, useLocation } from "react-router-dom"; // Import useLocation

const IsAdmin = () => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user = useSelector(selectUser);
  const location = useLocation(); // Get current location

  // --- Check for admin status ONLY if user exists ---
  const isAdmin = user ? user.isAdmin : false; // Check if user exists first

  // --- Determine if access should be granted ---
  const canAccess = isLoggedIn && isAdmin;

  // --- Redirect logic ---
  // If not logged in OR logged in but not admin, redirect
  if (!canAccess) {
    console.log("IsAdmin Guard: Access denied.", {
      isLoggedIn,
      isAdmin,
      userExists: !!user,
    });
    // Redirect to signin, preserving the intended destination
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
    // Alternatively, redirect non-admin logged-in users elsewhere:
    // if (!isLoggedIn) return <Navigate to="/auth/signin" state={{ from: location }} replace />;
    // if (!isAdmin) return <Navigate to="/unauthorized" replace />; // Or to '/'
  }

  // If logged in and is an admin, render the protected routes
  return <Outlet />;
};

export default IsAdmin;
