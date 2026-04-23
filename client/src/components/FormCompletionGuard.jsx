// import React from "react";
import { useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation, useBeforeUnload } from "react-router-dom";
import PropTypes from "prop-types";

const FormCompletionGuard = ({ children }) => {
  const {
    formSubmissionRequired,
    formSubmissionPath,
    hasCompletedInitialSubmission,
  } = useSelector((state) => state.navigation);

  const location = useLocation();

  // Determine if the form guard should be active based on Redux state and current path
  const isFormGuardActive =
    formSubmissionRequired && location.pathname === formSubmissionPath;

  // Handle browser tab/window close or refresh
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isFormGuardActive) {
        event.preventDefault();
        event.returnValue = ""; // Required for Chrome
        return ""; // Required for Firefox
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isFormGuardActive]);

  // Handle in-app navigation (React Router v6.4+)
  useBeforeUnload(
    useCallback(() => {
      if (isFormGuardActive) {
        // This message is typically not shown to the user by modern browsers
        // but returning true here signals to React Router to block navigation.
        return true;
      }
    }, [isFormGuardActive])
  );

  if (
    !hasCompletedInitialSubmission &&
    formSubmissionRequired &&
    formSubmissionPath &&
    location.pathname !== formSubmissionPath
  ) {
    return <Navigate to={formSubmissionPath} replace />;
  }

  return children;
};

FormCompletionGuard.propTypes = {
  children: PropTypes.node.isRequired,
};

export default FormCompletionGuard;
