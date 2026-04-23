/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Tooltip,
} from "@mui/material";

// Import react-icons
import {
  FaRegFilePdf,
  FaRegFileImage,
  FaRegFileAlt,
  FaIdCard,
  FaAddressCard,
  FaCertificate,
  FaBuilding,
  FaFileInvoiceDollar,
  FaShieldAlt,
} from "react-icons/fa";

// Redux imports
import {
  updateUserVerification,
  selectVerifyUserStatus,
  selectVerifyUserError,
} from "../../../store/slice/adminSlice"; // Adjust path

// --- Helper Functions & Constants ---
const getDocumentIcon = (type) => {
  const lowerType = type?.toLowerCase() || "";
  if (lowerType.includes("pdf")) return <FaRegFilePdf />;
  if (
    lowerType.includes("image") ||
    lowerType.includes("jpg") ||
    lowerType.includes("png") ||
    lowerType.includes("jpeg")
  )
    return <FaRegFileImage />;
  if (
    lowerType.includes("passport") ||
    lowerType.includes("id") ||
    lowerType.includes("driving")
  )
    return <FaIdCard />;
  if (lowerType.includes("address")) return <FaAddressCard />;
  if (
    lowerType.includes("degree") ||
    lowerType.includes("certifica") ||
    lowerType.includes("qualification")
  )
    return <FaCertificate />;
  if (lowerType.includes("license") || lowerType.includes("licence"))
    return <FaBuilding />;
  if (lowerType.includes("tax")) return <FaFileInvoiceDollar />;
  if (lowerType.includes("insurance")) return <FaShieldAlt />;
  return <FaRegFileAlt />; // Default icon
};

const REQUIRED_DOCS = {
  individual: [
    {
      key: "id",
      label: "ID (Passport/Driving License)",
      types: [
        "passport",
        "driving license",
        "driver license",
        "driver's license",
        "id card",
        "national id",
        "license",
        "licence",
      ],
    },
    {
      key: "qualification",
      label: "Professional Qualification (Degree/Certificate)",
      types: ["degree", "certificate", "qualification", "academic", "diploma"],
    },
  ],
  agency: [
    {
      key: "license",
      label: "Business Licence",
      types: [
        "license",
        "licence",
        "business license",
        "business licence",
        "trade license",
        "trade licence",
      ],
    },
    {
      key: "tax",
      label: "Tax ID Document",
      types: ["tax id", "tax document", "vat registration"],
    },
    { key: "insurance", label: "Business Insurance", types: ["insurance"] },
  ],
};

// *** Refined checkRequiredDocuments function for general use ***
const checkRequiredDocuments = (user) => {
  try {
    if (!user) {
      // console.log("checkRequiredDocuments: User is null");
      return {
        allPresent: false,
        missing: ["User data not available"],
        present: [],
      };
    }

    const accountType = user.accountType;
    // If user has no accountType or no requirements defined for their accountType,
    // they are not "missing" anything according to our defined list.
    if (!accountType || !REQUIRED_DOCS[accountType]) {
      // console.log(`checkRequiredDocuments: No requirements for account type "${accountType}" or accountType missing.`);
      return { allPresent: true, missing: [], present: [] }; // Or false if an account type is expected. For this, true means not missing from defined list.
    }

    const required = REQUIRED_DOCS[accountType];
    if (!required.length) {
      // console.log(`checkRequiredDocuments: Requirements array empty for "${accountType}"`);
      return { allPresent: true, missing: [], present: [] };
    }

    const uploadedTypes = (user.documents || [])
      .map((doc) => doc?.type?.toLowerCase())
      .filter((type) => typeof type === "string" && type.length > 0);

    // console.log("checkRequiredDocuments - Uploaded Types for admin view:", uploadedTypes);

    const result = { allPresent: true, missing: [], present: [] };
    required.forEach((reqDoc) => {
      const found = uploadedTypes.some((uploadedType) =>
        reqDoc.types.some((reqType) => uploadedType.includes(reqType))
      );
      if (found) {
        result.present.push(reqDoc.label);
      } else {
        result.missing.push(reqDoc.label);
        result.allPresent = false;
      }
    });
    // console.log("checkRequiredDocuments - Result for admin view:", result);
    return result;
  } catch (error) {
    console.error(
      "Error in checkRequiredDocuments (admin view):",
      error,
      "User:",
      user
    );
    return {
      allPresent: false,
      missing: ["Error checking documents"],
      present: [],
    };
  }
};
// ------------------------------------------------------

export function UserDetailsModal({ open, onClose, user }) {
  const dispatch = useDispatch();
  const verifyStatus = useSelector(selectVerifyUserStatus);
  const verifyError = useSelector(selectVerifyUserError);
  const isLoading = verifyStatus === "pending";

  if (!user) {
    return null;
  }

  const { allPresent: allDocsPresent, missing: missingDocs = [] } =
    checkRequiredDocuments(user) || {
      // Added default empty array for missingDocs
      allPresent: false,
      missing: [],
      present: [],
    };

  const hasUploadedDocs = user.documents && user.documents.length > 0;

  // Determine if the user type is one that requires verification based on REQUIRED_DOCS
  const isVerifiableUserType =
    user.accountType && REQUIRED_DOCS[user.accountType];

  const handleVerify = () => {
    if (!user._id) return;
    dispatch(updateUserVerification(user._id))
      .unwrap()
      .then(() => {
        onClose(); // Close modal on successful verification
      })
      .catch((err) => {
        console.error("Verification failed:", err);
        // Error will be shown via verifyError selector and Alert component
      });
  };

  const handleDecline = () => {
    const subject = encodeURIComponent(
      `Regarding Your Account Verification - Action Required` // Generic subject
    );
    const body = encodeURIComponent(
      `Dear ${user.name || user.companyName || "User"},\n\n` +
        `We have reviewed your account verification application and require further information or clarification.\n\n` +
        `Reason for decline (Admin to specify):\n` +
        `[ **ADMIN: PLEASE FILL IN THE SPECIFIC REASON HERE** ]\n\n` +
        `Please address the following issues and re-submit any necessary documents via your profile.\n\n` +
        `Thank you,\n` +
        `Admin Team`
    );
    window.location.href = `mailto:${user.email}?subject=${subject}&body=${body}`;
  };

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          pb: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
          User Details: {user.name || user.companyName || user.email}
        </Typography>
        {/* General Verification Status Chip */}
        {isVerifiableUserType && (
          <Chip
            label={user.isVerified ? "Verified" : "Pending Verification"}
            color={user.isVerified ? "success" : "warning"}
            size="small"
          />
        )}
        {/* Role Chip (e.g., Seller) */}
        {user.isSeller && (
          <Chip
            label="Role: Seller"
            color="info"
            size="small"
            sx={{ ml: isVerifiableUserType ? 1 : 0 }} // Add margin if previous chip exists
          />
        )}
        {user.isAdmin && (
          <Chip label="Admin" color="error" size="small" sx={{ ml: 1 }} />
        )}
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
        {verifyError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Verification Error: {verifyError.message || verifyError}
          </Alert>
        )}
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Stack spacing={1.5}>
              <Typography variant="h6">Basic Information</Typography>
              <Box>
                <Typography
                  variant="body2"
                  component="span"
                  fontWeight="fontWeightMedium"
                >
                  ID:{" "}
                </Typography>
                <Typography
                  variant="body2"
                  component="span"
                  color="text.secondary"
                >
                  {user._id}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  component="span"
                  fontWeight="fontWeightMedium"
                >
                  Email:{" "}
                </Typography>
                <Typography
                  variant="body2"
                  component="span"
                  color="text.secondary"
                >
                  {user.email}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="body2"
                  component="span"
                  fontWeight="fontWeightMedium"
                >
                  Account Type:{" "}
                </Typography>
                <Chip
                  label={user.accountType}
                  size="small"
                  sx={{ textTransform: "capitalize" }}
                />
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  component="span"
                  fontWeight="fontWeightMedium"
                >
                  Email Verified:{" "}
                </Typography>
                <Typography
                  variant="body2"
                  component="span"
                  color={user.isEmailVerified ? "success.main" : "error.main"}
                >
                  {user.isEmailVerified ? "Yes" : "No"}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  component="span"
                  fontWeight="fontWeightMedium"
                >
                  Joined:{" "}
                </Typography>
                <Typography
                  variant="body2"
                  component="span"
                  color="text.secondary"
                >
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "N/A"}
                </Typography>
              </Box>
              {user.telephone && (
                <Box>
                  <Typography
                    variant="body2"
                    component="span"
                    fontWeight="fontWeightMedium"
                  >
                    Telephone:{" "}
                  </Typography>
                  <Typography
                    variant="body2"
                    component="span"
                    color="text.secondary"
                  >
                    {user.telephone}
                  </Typography>
                </Box>
              )}
              {user.location && (
                <Box>
                  <Typography
                    variant="body2"
                    component="span"
                    fontWeight="fontWeightMedium"
                  >
                    Location:{" "}
                  </Typography>
                  <Typography
                    variant="body2"
                    component="span"
                    color="text.secondary"
                  >
                    {user.location}
                  </Typography>
                </Box>
              )}
              {user.bio && (
                <Box>
                  <Typography
                    variant="body2"
                    component="span"
                    fontWeight="fontWeightMedium"
                    sx={{ display: "block", mb: 0.5 }}
                  >
                    Bio:{" "}
                  </Typography>
                  <Typography
                    variant="body2"
                    component="span"
                    color="text.secondary"
                    sx={{ whiteSpace: "pre-wrap" }}
                  >
                    {user.bio}
                  </Typography>
                </Box>
              )}
              {user.accountType === "agency" && (
                <Stack
                  spacing={1.5}
                  pt={1.5}
                  mt={1.5}
                  borderTop={1}
                  borderColor="divider"
                >
                  <Typography variant="subtitle1">Agency Details</Typography>
                  {user.companyName && (
                    <Box>
                      <Typography
                        variant="body2"
                        component="span"
                        fontWeight="fontWeightMedium"
                      >
                        Company Name:{" "}
                      </Typography>
                      <Typography
                        variant="body2"
                        component="span"
                        color="text.secondary"
                      >
                        {user.companyName}
                      </Typography>
                    </Box>
                  )}
                  {user.representativeName && (
                    <Box>
                      <Typography
                        variant="body2"
                        component="span"
                        fontWeight="fontWeightMedium"
                      >
                        Representative:{" "}
                      </Typography>
                      <Typography
                        variant="body2"
                        component="span"
                        color="text.secondary"
                      >
                        {user.representativeName}
                      </Typography>
                    </Box>
                  )}
                  {user.website && (
                    <Box>
                      <Typography
                        variant="body2"
                        component="span"
                        fontWeight="fontWeightMedium"
                      >
                        Website:{" "}
                      </Typography>
                      <Link
                        href={user.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="body2"
                      >
                        {user.website}
                      </Link>
                    </Box>
                  )}
                </Stack>
              )}
              {user.address &&
                (user.address.street ||
                  user.address.city ||
                  user.address.country) && (
                  <Stack
                    spacing={0.5}
                    pt={1.5}
                    mt={1.5}
                    borderTop={1}
                    borderColor="divider"
                  >
                    <Typography variant="subtitle1">Address</Typography>
                    {user.address.street && (
                      <Typography variant="body2" color="text.secondary">
                        {user.address.street}
                      </Typography>
                    )}
                    {(user.address.city ||
                      user.address.state ||
                      user.address.zip) && (
                      <Typography variant="body2" color="text.secondary">
                        {user.address.city}
                        {user.address.state
                          ? `, ${user.address.state}`
                          : ""}{" "}
                        {user.address.zip}
                      </Typography>
                    )}
                    {user.address.country && (
                      <Typography variant="body2" color="text.secondary">
                        {user.address.country}
                      </Typography>
                    )}
                  </Stack>
                )}
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={2.5}>
              <Typography variant="h6">Documents & Verification</Typography>
              {/* Required Docs Section (show if user type is verifiable) */}
              {isVerifiableUserType && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Required for {user.accountType} account:
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.5,
                      mb: 1.5,
                    }}
                  >
                    {REQUIRED_DOCS[user.accountType]?.map((doc) => (
                      <Chip
                        key={doc.key}
                        label={doc.label}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  {!allDocsPresent && missingDocs.length > 0 && (
                    <Alert severity="warning" variant="outlined">
                      Missing: {missingDocs.join(", ")}
                    </Alert>
                  )}
                  {allDocsPresent &&
                    hasUploadedDocs && ( // only show all present if docs are uploaded
                      <Alert severity="success" variant="outlined">
                        All required document types appear uploaded. Please
                        review carefully.
                      </Alert>
                    )}
                  {!hasUploadedDocs && ( // if verifiable type but no docs uploaded
                    <Alert severity="info" variant="outlined">
                      User has not uploaded any documents yet.
                    </Alert>
                  )}
                </Box>
              )}

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Uploaded Documents:
                </Typography>
                {user.documents && user.documents.length > 0 ? (
                  <List
                    dense
                    sx={{ pt: 1, borderTop: 1, borderColor: "divider" }}
                  >
                    {user.documents.map((doc, index) => (
                      <ListItem key={index} disablePadding sx={{ py: 0.75 }}>
                        <ListItemIcon
                          sx={{
                            minWidth: 35,
                            mr: 1,
                            fontSize: "1.2rem",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {getDocumentIcon(doc.type || doc.url)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Link
                              href={`${BASE_URL}/${doc.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              underline="hover"
                              variant="body2"
                            >
                              {doc.type || `Document ${index + 1}`}
                            </Link>
                          }
                          secondaryTypographyProps={{ variant: "caption" }}
                          secondary={`Uploaded: ${
                            doc.uploadedAt
                              ? new Date(doc.uploadedAt).toLocaleDateString()
                              : "N/A"
                          }`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontStyle: "italic",
                      pt: 1,
                      borderTop: 1,
                      borderColor: "divider",
                    }}
                  >
                    No documents uploaded.
                  </Typography>
                )}
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: 1,
          borderColor: "divider",
          p: 2,
          "& > :not(:first-of-type)": { ml: 1 },
        }}
      >
        <Button
          onClick={onClose}
          color="inherit"
          variant="outlined"
          disabled={isLoading}
          size="medium"
        >
          Cancel
        </Button>

        {/* Decline Button: If user is verifiable and not yet verified */}
        {isVerifiableUserType && !user.isVerified && (
          <Button
            onClick={handleDecline}
            color="warning"
            variant="outlined"
            disabled={isLoading}
            size="medium"
          >
            Decline & Email
          </Button>
        )}

        {/* Verify Button: If user is verifiable, (not verified OR not active), and has docs */}
        {isVerifiableUserType &&
          (!user.isVerified || user.status !== "active") &&
          hasUploadedDocs && (
            <Tooltip
              title={
                !allDocsPresent
                  ? `Cannot verify/approve: Missing required documents (${missingDocs.join(
                      ", "
                    )})`
                  : ""
              }
            >
              <span>
                <Button
                  onClick={handleVerify}
                  color="success"
                  variant="contained"
                  disabled={isLoading || !allDocsPresent}
                  size="medium"
                  startIcon={
                    isLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : null
                  }
                >
                  {isLoading
                    ? "Processing..."
                    : user.isVerified
                    ? "Approve & Activate"
                    : "Verify & Approve User"}
                </Button>
              </span>
            </Tooltip>
          )}

        {/* Already Verified & Active Button: If user is verifiable, verified, and active */}
        {isVerifiableUserType &&
          user.isVerified &&
          user.status === "active" && (
            <Button color="success" variant="contained" disabled size="medium">
              Verified & Active
            </Button>
          )}

        {/* Verify Button Placeholder: If verifiable, not verified, but NO docs uploaded */}
        {isVerifiableUserType && !user.isVerified && !hasUploadedDocs && (
          <Tooltip title="User needs to upload documents before verification.">
            <span>
              <Button
                color="inherit"
                variant="contained"
                disabled
                size="medium"
              >
                Verify User
              </Button>
            </span>
          </Tooltip>
        )}
      </DialogActions>
    </Dialog>
  );
}
