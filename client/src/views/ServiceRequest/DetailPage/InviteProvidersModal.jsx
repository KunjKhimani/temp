/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
  CircularProgress,
  Alert,
  Box,
  Chip,
  Typography,
  Avatar,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { debounce } from "lodash";

import { inviteProvidersToRequestThunk } from "../../../store/thunks/serviceRequestThunks";

import {
  selectFetchedServiceProviders,
  selectServiceProvidersFetchStatus,
  selectServiceProvidersFetchError,
  clearServiceProvidersError,
  resetServiceProvidersStatus,
} from "../../../store/slice/userSlice";
import { fetchServiceProviders } from "../../../store/thunks/userThunks";

import { showSnackbar } from "../../../store/slice/snackbarSlice";
import {
  selectServiceRequestActionStatus,
  selectServiceRequestActionError,
  clearServiceRequestActionState,
} from "../../../store/slice/serviceRequestSlice";
import PersonIcon from "@mui/icons-material/Person";

const API_DOMAIN_FOR_IMAGES =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const MAX_INVITES_STANDARD = 20;

const InviteProvidersModal = ({ open, onClose, serviceRequest }) => {
  const dispatch = useDispatch();
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const inviteActionStatus = useSelector(selectServiceRequestActionStatus);
  const inviteActionError = useSelector(selectServiceRequestActionError);

  const allFetchedProviders = useSelector(selectFetchedServiceProviders);
  const providersFetchStatus = useSelector(selectServiceProvidersFetchStatus);
  const providersFetchError = useSelector(selectServiceProvidersFetchError);

  const debouncedFetchProviders = useCallback(
    debounce((currentSearchTermForAPI) => {
      dispatch(
        fetchServiceProviders({
          searchTerm: currentSearchTermForAPI,
          limit: 50,
          page: 1,
        })
      );
    }, 500),
    [dispatch]
  );

  useEffect(() => {
    if (open) {
      dispatch(clearServiceProvidersError());
      dispatch(resetServiceProvidersStatus());
      dispatch(clearServiceRequestActionState());
      setSelectedProviders([]);
      // Fetch based on current searchTerm (could be empty if just opened, or pre-filled)
      // The second useEffect will also trigger this if searchTerm is not empty initially.
      // To ensure a clean initial state, you could setSearchTerm("") here if desired.
      // For now, letting the second useEffect handle the fetch based on `searchTerm` works.
    } else {
      // Optional: Clear search term when modal closes to ensure fresh state next time
      // setSearchTerm("");
    }
  }, [open, dispatch]);

  // Effect to fetch providers when searchTerm changes or modal opens with a searchTerm
  useEffect(() => {
    if (open) {
      debouncedFetchProviders(searchTerm);
    }
  }, [searchTerm, open, debouncedFetchProviders]);

  const handleInputChange = (event, newInputValue, reason) => {
    // Autocomplete's onInputChange is called for typing, reset, and clear.
    // We only want to set our searchTerm (and thus trigger API call) when user types.
    // If user clears input (reason 'clear' or 'reset'), searchTerm becomes ""
    // which will then trigger a fetch for an empty search term via the useEffect.
    if (reason === "input" || reason === "clear" || reason === "reset") {
      setSearchTerm(newInputValue);
    }
  };

  const providerOptions = useMemo(() => {
    if (!allFetchedProviders || !serviceRequest) return [];
    const alreadyInvitedIds =
      serviceRequest.invitedProviders?.map((p) =>
        typeof p === "string" ? p : p._id
      ) || [];
    const requestCreatorId = serviceRequest.createdBy?._id;

    return allFetchedProviders.filter(
      (p) => !alreadyInvitedIds.includes(p._id) && p._id !== requestCreatorId
    );
  }, [allFetchedProviders, serviceRequest]);

  const handleInvite = async () => {
    if (selectedProviders.length === 0) {
      dispatch(
        showSnackbar({
          message: "Please select at least one provider to invite.",
          severity: "warning",
        })
      );
      return;
    }
    const providerIdsToInvite = selectedProviders.map((p) => p._id);
    try {
      await dispatch(
        inviteProvidersToRequestThunk({
          requestId: serviceRequest._id,
          providerIds: providerIdsToInvite,
        })
      ).unwrap();
      dispatch(
        showSnackbar({
          message: `${providerIdsToInvite.length} provider(s) invited successfully!`,
          severity: "success",
        })
      );
      onClose();
    } catch (error) {
      // Error handled by Alert below
    }
  };

  const currentInviteCount = serviceRequest?.invitedProviders?.length || 0;
  const remainingInvites =
    serviceRequest?.requestType === "standard"
      ? MAX_INVITES_STANDARD - currentInviteCount
      : Infinity;
  const canInviteMore =
    serviceRequest?.requestType === "standard"
      ? currentInviteCount < MAX_INVITES_STANDARD
      : true;

  const handleSelectionChange = (event, newValue) => {
    if (
      serviceRequest?.requestType === "standard" &&
      currentInviteCount + newValue.length > MAX_INVITES_STANDARD
    ) {
      const limit = MAX_INVITES_STANDARD - currentInviteCount;
      setSelectedProviders(newValue.slice(0, limit));
      dispatch(
        showSnackbar({
          message: `Standard requests allow inviting ${MAX_INVITES_STANDARD} providers in total. You can select ${
            limit > 0 ? limit : 0
          } more.`,
          severity: "warning",
        })
      );
    } else {
      setSelectedProviders(newValue);
    }
  };

  if (!serviceRequest) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Invite Providers to "{serviceRequest.title}"</DialogTitle>
      <DialogContent dividers>
        {serviceRequest.requestType === "standard" && (
          <Typography
            variant="caption"
            color={remainingInvites <= 0 ? "error" : "text.secondary"}
            gutterBottom
            display="block"
          >
            Standard Post: You can invite up to {MAX_INVITES_STANDARD}{" "}
            providers. Invited: {currentInviteCount}. Remaining:{" "}
            {Math.max(0, remainingInvites)}.
          </Typography>
        )}
        {serviceRequest.requestType === "promoted" && (
          <Typography
            variant="caption"
            color="text.secondary"
            gutterBottom
            display="block"
          >
            Promoted Post: Unlimited invitations.
          </Typography>
        )}

        <Autocomplete
          multiple
          id="invite-providers-autocomplete"
          options={providerOptions}
          getOptionLabel={(option) =>
            `${option.name || ""}${
              option.companyName ? ` (${option.companyName})` : ""
            }`
          }
          value={selectedProviders}
          onChange={handleSelectionChange}
          onInputChange={handleInputChange} // This updates searchTerm, which triggers useEffect
          inputValue={searchTerm} // Controlled input based on our searchTerm state
          isOptionEqualToValue={(option, value) => option._id === value._id}
          loading={providersFetchStatus === "loading"}
          loadingText="Loading providers..."
          noOptionsText={
            providersFetchStatus === "loading"
              ? "Loading..."
              : providersFetchStatus === "succeeded" &&
                searchTerm &&
                providerOptions.length === 0
              ? "No providers found matching your search."
              : providersFetchStatus === "succeeded" &&
                !searchTerm && // User has not typed anything, or cleared input
                allFetchedProviders.length === 0 // And no providers were fetched (e.g. initial general fetch returned empty)
              ? "No providers available in the system." // Message when search is empty and DB has no one
              : providersFetchStatus === "succeeded" &&
                !searchTerm &&
                allFetchedProviders.length > 0 &&
                providerOptions.length === 0
              ? "All eligible providers already invited or are you."
              : "Start typing to find providers."
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="Search and Select Providers"
              placeholder="Provider name or company..."
              margin="normal"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {providersFetchStatus === "loading" ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(
            props,
            option,
            { selected } // Added { selected } for potential use
          ) => (
            <ListItem {...props} key={option._id} dense>
              {" "}
              {/* key here is fine */}
              <ListItemAvatar>
                <Avatar
                  src={
                    option.profilePicture
                      ? `${API_DOMAIN_FOR_IMAGES}/${option.profilePicture.replace(
                          /^uploads\//i,
                          ""
                        )}`
                      : undefined
                  }
                  sx={{ width: 32, height: 32, bgcolor: "grey.300" }}
                >
                  {!option.profilePicture && <PersonIcon fontSize="small" />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  option.name || option.companyName || "Unnamed Provider"
                }
                secondary={
                  option.companyName && option.name
                    ? option.companyName
                    : option.accountType || ""
                }
              />
            </ListItem>
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagChipProps } = getTagProps({ index }); // Destructure key
              return (
                <Chip
                  key={option._id} // Using option._id as the key for the Chip itself
                  avatar={
                    <Avatar
                      src={
                        option.profilePicture
                          ? `${API_DOMAIN_FOR_IMAGES}/${option.profilePicture.replace(
                              /^uploads\//i,
                              ""
                            )}`
                          : undefined
                      }
                      alt={option.name || option.companyName}
                    >
                      {!option.profilePicture && (
                        <PersonIcon fontSize="small" />
                      )}
                    </Avatar>
                  }
                  label={option.name || option.companyName}
                  {...tagChipProps} // Spread the rest of the props
                  size="small"
                />
              );
            })
          }
          disabled={!canInviteMore && serviceRequest.requestType === "standard"}
          limitTags={5}
          filterOptions={(x) => x}
        />

        {providersFetchStatus === "failed" && providersFetchError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Error loading providers:{" "}
            {providersFetchError || "An unknown error occurred."}
          </Alert>
        )}
        {inviteActionStatus === "failed" && inviteActionError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {typeof inviteActionError === "string"
              ? inviteActionError
              : inviteActionError?.message ||
                "An error occurred while sending invitations."}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleInvite}
          variant="contained"
          color="primary"
          disabled={
            inviteActionStatus === "loading" ||
            providersFetchStatus === "loading" ||
            selectedProviders.length === 0 ||
            (!canInviteMore && serviceRequest.requestType === "standard")
          }
        >
          {inviteActionStatus === "loading" ? (
            <CircularProgress size={24} />
          ) : (
            `Send ${selectedProviders.length} Invite(s)`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteProvidersModal;
