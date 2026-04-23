/* eslint-disable no-unused-vars */
// src/views/ServiceRequest/EditServiceRequestPage.jsx
import React, { useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import ServiceRequestForm from "./ServiceRequestForm";
import {
  fetchServiceRequestByIdThunk,
  updateServiceRequestThunk,
} from "../../store/thunks/serviceRequestThunks";
import {
  clearServiceRequestDetailState,
  clearServiceRequestActionState,
  selectCurrentServiceRequest,
  selectServiceRequestDetailStatus,
  selectServiceRequestDetailError,
  selectServiceRequestActionStatus,
  selectServiceRequestActionError,
} from "../../store/slice/serviceRequestSlice";
import { selectUser } from "../../store/slice/userSlice";
import { showSnackbar } from "../../store/slice/snackbarSlice";

const EditServiceRequestPage = () => {
  const { requestId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentRequest = useSelector(selectCurrentServiceRequest);
  const detailStatus = useSelector(selectServiceRequestDetailStatus);
  const detailError = useSelector(selectServiceRequestDetailError);
  const actionStatus = useSelector(selectServiceRequestActionStatus);
  const actionError = useSelector(selectServiceRequestActionError);
  const currentUser = useSelector(selectUser);

  useEffect(() => {
    if (requestId) {
      dispatch(clearServiceRequestDetailState()); // Clear previous if any
      dispatch(fetchServiceRequestByIdThunk(requestId));
    }
    return () => {
      dispatch(clearServiceRequestActionState());
    };
  }, [dispatch, requestId]);

  const handleSubmit = async (formData) => {
    // formData here is a FormData object
    if (!currentRequest) return;
    dispatch(clearServiceRequestActionState());
    try {
      const resultAction = await dispatch(
        updateServiceRequestThunk({ requestId: currentRequest._id, formData })
      ).unwrap();
      dispatch(
        showSnackbar({
          message:
            resultAction.message || "Service request updated successfully!",
          severity: "success",
        })
      );
      navigate(`/service-request/${currentRequest._id}`);
    } catch (error) {
      dispatch(
        showSnackbar({
          message: error.message || "Failed to update service request.",
          severity: "error",
        })
      );
      console.error("Failed to update service request:", error);
    }
  };

  if (detailStatus === "loading")
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
        <CircularProgress />
        <Typography ml={1}>Loading request for editing...</Typography>
      </Box>
    );
  if (detailStatus === "failed")
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>
          Failed to load request: {detailError}
        </Alert>
      </Container>
    );
  if (!currentRequest)
    return (
      <Container>
        <Alert severity="info" sx={{ mt: 3 }}>
          Service request not found or you cannot edit it.
        </Alert>
      </Container>
    );

  // Authorization check: Only owner can edit
  // Ensure both currentUser and currentRequest.createdBy are available before comparison
  // And prevent showing this alert if an action has just succeeded (as navigation is imminent)
  if (
    actionStatus !== "succeeded" && // Added condition
    currentUser &&
    currentRequest &&
    currentRequest.createdBy &&
    currentUser._id !== currentRequest.createdBy._id
  ) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>
          You are not authorized to edit this service request.
        </Alert>
      </Container>
    );
  }
  // Check if the request status allows editing
  // And prevent showing this alert if an action has just succeeded
  if (
    actionStatus !== "succeeded" && // Added condition
    currentRequest &&
    currentRequest.status !== "open"
  ) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 3 }}>
          This service request is not open and cannot be edited.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <MuiLink
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </MuiLink>
        <MuiLink
          component={RouterLink}
          to="/user/my-service-requests"
          color="inherit"
        >
          My Requests
        </MuiLink>
        <Typography color="text.primary">Edit Request</Typography>
      </Breadcrumbs>
      <ServiceRequestForm
        onFormSubmitIntent={handleSubmit}
        initialData={currentRequest} // Pass current data to prefill
        isLoading={actionStatus === "loading"}
        isEdit={true}
      />
      {actionStatus === "failed" && actionError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {actionError}
        </Alert>
      )}
    </Container>
  );
};

export default EditServiceRequestPage;
