// src/views/Provider/Profile/Profile.jsx
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
  Typography,
  Stack,
  Pagination,
  Breadcrumbs,
  Link as MuiLink,
  Paper,
  Grid,
} from "@mui/material";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import {
  fetchProfile,
  selectProfile,
  selectFetchLoading as selectProfileLoading,
  selectFetchError as selectProfileError,
} from "../../../store/slice/profileSlice";

// Service related imports
import { fetchMyServices } from "../../../store/thunks/serviceThunks";
import {
  selectMyServicesList,
  selectMyServicesPaginationInfo,
  selectMyServicesFetchStatus,
  selectMyServicesFetchError,
  clearMyServicesState,
} from "../../../store/slice/serviceSlice";

import ProfileHeader from "./ProfileHeader";
import ProfileDetails from "./ProfileDetails";
import ProfileDocuments from "./ProfileDocuments";
import ProfileServices from "./ProfileServices";
import DeleteConfirmationDialog from "../../Service/DeleteConfirmationDialog";
import { selectAuthLoading, selectUser } from "../../../store/slice/userSlice";
import { removeUser } from "../../../store/thunks/userThunks";

const Profile = () => {
  const dispatch = useDispatch();
  const { id: paramsUserId } = useParams();
  const navigate = useNavigate();

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Pagination state for My Services
  const [myServicesCurrentPage, setMyServicesCurrentPage] = useState(1);
  const MY_SERVICES_PAGE_LIMIT = 6;

  // Profile state
  const profileData = useSelector(selectProfile);
  const profileLoading = useSelector(selectProfileLoading);
  const profileError = useSelector(selectProfileError);
  const loggedInUser = useSelector(selectUser);
  const userActionStatus = useSelector(selectAuthLoading);

  // My Services state
  const myServicesList = useSelector(selectMyServicesList);
  const myServicesPaginationInfo = useSelector(selectMyServicesPaginationInfo);
  const myServicesStatus = useSelector(selectMyServicesFetchStatus);
  const myServicesFetchError = useSelector(selectMyServicesFetchError);

  const isOwnProfile =
    (paramsUserId && loggedInUser?._id && paramsUserId === loggedInUser._id) ||
    (!paramsUserId && loggedInUser?._id);

  const userToDisplay = isOwnProfile ? loggedInUser : profileData?.user;
  const publicUserServices = profileData?.services || [];
  // TODO: Add publicUserProducts to profileData if your backend /profile/:id includes products
  // const publicUserProducts = profileData?.products || [];

  useEffect(() => {
    const profileIdToFetch = paramsUserId || loggedInUser?._id;
    if (profileIdToFetch) {
      if (
        profileData?.user?._id !== profileIdToFetch ||
        profileLoading === "idle" ||
        profileError
      ) {
        dispatch(fetchProfile(profileIdToFetch));
      }
      if (isOwnProfile && loggedInUser?.isSeller) {
        // Fetch My Services
        if (
          myServicesStatus === "idle" ||
          myServicesStatus === "failed" ||
          myServicesCurrentPage !== (myServicesPaginationInfo?.currentPage || 1)
        ) {
          dispatch(clearMyServicesState());
          dispatch(
            fetchMyServices({
              page: myServicesCurrentPage,
              limit: MY_SERVICES_PAGE_LIMIT,
            })
          );
        }
      }
    } else if (!paramsUserId && !loggedInUser) {
      navigate("/auth/signin", { replace: true });
    }
    // return () => {
    // if (isOwnProfile) {
    //   dispatch(clearMyServicesState());
    //   dispatch(clearMyProductsState()); // <<< NEW
    // }
    // };
  }, [
    dispatch,
    paramsUserId,
    loggedInUser?._id,
    isOwnProfile,
    myServicesCurrentPage,
    loggedInUser?.isSeller,
    profileData?.user?._id,
    profileLoading,
    profileError,
    myServicesStatus,
    myServicesPaginationInfo?.currentPage,
  ]);

  const handleMyServicesPageChange = (event, value) => {
    setMyServicesCurrentPage(value);
  };

  const handleOpenDelete = () => setOpenDeleteDialog(true);
  const handleCloseDelete = () => setOpenDeleteDialog(false);
  const handleGoBack = () => navigate(-1);

  const handleDeleteAccountConfirm = useCallback(async () => {
    // ... (existing code)
    if (loggedInUser?._id) {
      try {
        await dispatch(removeUser(loggedInUser._id)).unwrap();
        setOpenDeleteDialog(false);
        navigate("/auth/signin", { replace: true });
      } catch (err) {
        console.error("Failed to delete account:", err);
        alert(err.message || "Failed to delete account. Please try again.");
        setOpenDeleteDialog(false);
      }
    }
  }, [dispatch, loggedInUser?._id, navigate]);

  // ... (loading and error states for profile remain the same)
  if (profileLoading && !userToDisplay) {
    return (
      <Container maxWidth="md" sx={{ py: 5, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="h6" mt={2}>
          Loading Profile...
        </Typography>
      </Container>
    );
  }
  if (profileError && !userToDisplay) {
    return (
      <Container maxWidth="md" sx={{ py: 5 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error Loading Profile</AlertTitle>
          {String(profileError?.message || profileError)}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleGoBack}>
          Go Back
        </Button>
      </Container>
    );
  }
  if (!profileLoading && !userToDisplay && (paramsUserId || loggedInUser)) {
    return (
      <Container maxWidth="md" sx={{ py: 5, textAlign: "center" }}>
        <Typography variant="h5">Profile Not Found</Typography>
        <Button
          sx={{ mt: 2 }}
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
        >
          Go Back
        </Button>
      </Container>
    );
  }
  if (!userToDisplay) {
    // This case might be hit briefly before navigate or if something unexpected happens
    return (
      <Container maxWidth="md" sx={{ py: 5, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <MuiLink
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
        </MuiLink>
        <Typography color="text.primary">
          {isOwnProfile
            ? "My Profile"
            : `${userToDisplay.name || "User"}'s Profile`}
        </Typography>
      </Breadcrumbs>

      <ProfileHeader
        profile={userToDisplay}
        isUserProfile={isOwnProfile}
        onDeleteClick={isOwnProfile ? handleOpenDelete : undefined}
      />
      {console.log(userToDisplay)}
      {loggedInUser?.subscription &&
        loggedInUser.subscription.isActive &&
        loggedInUser.subscription.plan !== "free" && (
          <Box sx={{ mt: 3, mb: 3, textAlign: "center" }}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                display: "inline-flex",
                alignItems: "center",
                bgcolor: "success.light",
                color: "success.contrastText",
                borderRadius: 1,
              }}
            >
              <CheckCircleOutlineIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                {loggedInUser.subscription.plan.toUpperCase()} Subscriber
              </Typography>
            </Paper>
          </Box>
        )}

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <ProfileDetails profile={userToDisplay} />
        </Grid>

        {isOwnProfile && (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: { xs: 2, md: 3 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h5" component="h2">
                  Documents & Verification
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<UploadFileIcon />}
                  component={RouterLink}
                  to="/user/profile/edit"
                >
                  Manage Documents
                </Button>
              </Box>
              <ProfileDocuments user={userToDisplay} />
            </Paper>
          </Grid>
        )}

        {/* --- Section: My Services (if own profile and user is a seller) --- */}
        {isOwnProfile && userToDisplay.isSeller && (
          <Grid item xs={12}>
            {/* Loading and error states for My Services */}
            {myServicesStatus === "loading" && myServicesList.length === 0 && (
              <Box textAlign="center" sx={{ py: 3 }}>
                <CircularProgress size={28} />
              </Box>
            )}
            {myServicesStatus === "failed" && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() =>
                      dispatch(
                        fetchMyServices({
                          page: myServicesCurrentPage,
                          limit: MY_SERVICES_PAGE_LIMIT,
                        })
                      )
                    }
                  >
                    {" "}
                    RETRY{" "}
                  </Button>
                }
              >
                Error loading your services:{" "}
                {String(myServicesFetchError?.message || myServicesFetchError)}
              </Alert>
            )}
            {/* Display My Services */}
            {(myServicesStatus === "succeeded" ||
              (myServicesStatus === "loading" &&
                myServicesList.length > 0)) && (
              <>
                <ProfileServices
                  services={myServicesList}
                  isUserProfile={isOwnProfile}
                />
                {myServicesPaginationInfo &&
                  myServicesPaginationInfo.totalPages > 1 && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        mt: 2,
                        mb: 1,
                      }}
                    >
                      <Pagination
                        count={myServicesPaginationInfo.totalPages}
                        page={myServicesCurrentPage}
                        onChange={handleMyServicesPageChange}
                        color="primary"
                        disabled={myServicesStatus === "loading"}
                        size="small"
                      />
                    </Box>
                  )}
              </>
            )}
            {myServicesStatus === "succeeded" &&
              myServicesList.length === 0 && (
                <ProfileServices services={[]} isUserProfile={isOwnProfile} /> // Show empty state via ProfileServices
              )}
          </Grid>
        )}

        {/* Section: Public services list (if viewing someone else's seller profile) */}
        {!isOwnProfile &&
          userToDisplay.isSeller &&
          publicUserServices.length > 0 && (
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  borderBottom: 1,
                  borderColor: "divider",
                  pb: 1,
                }}
              >
                {userToDisplay.accountType === "agency"
                  ? `${
                      userToDisplay.companyName || userToDisplay.name
                    }'s Services`
                  : `${userToDisplay.name}'s Services`}
              </Typography>
              <ProfileServices
                services={publicUserServices}
                isUserProfile={false}
              />
              {/* TODO: Pagination for publicUserServices */}
            </Grid>
          )}
        {!isOwnProfile &&
          userToDisplay.isSeller &&
          publicUserServices.length === 0 && (
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  borderBottom: 1,
                  borderColor: "divider",
                  pb: 1,
                }}
              >
                Services
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ py: 3, textAlign: "center" }}
              >
                This provider has not listed any public services yet.
              </Typography>
            </Grid>
          )}

        {/* TODO: Section: Public products list (if viewing someone else's seller profile) */}
        {/*
        {!isOwnProfile && userToDisplay.isSeller && publicUserProducts.length > 0 && (
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
              {userToDisplay.accountType === "agency" ? `${userToDisplay.companyName || userToDisplay.name}'s Products` : `${userToDisplay.name}'s Products`}
            </Typography>
            <ProfileProducts products={publicUserProducts} isUserProfile={false} />
          </Grid>
        )}
        */}
      </Grid>

      <DeleteConfirmationDialog
        open={openDeleteDialog}
        onClose={handleCloseDelete}
        onConfirm={handleDeleteAccountConfirm}
        title="Confirm Account Deletion"
        contentTypeText="Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone. All your data, including profile details, services, and orders, will be permanently lost."
        isLoading={userActionStatus === "loading"}
      />
    </Container>
  );
};

export default Profile;
