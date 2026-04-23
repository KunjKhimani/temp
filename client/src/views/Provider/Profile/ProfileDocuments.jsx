/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";

import {
  Box,
  Typography,
  Paper,
  Divider,
  Stack,
  Button,
  Link as MuiLink,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
} from "@mui/material";

// --- Import React Icons ---
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
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

// --- Base URL for viewing documents ---
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"; // Adjust if needed

// --- Helper function to get document icon ---
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
  if (lowerType.includes("licence") || lowerType.includes("license"))
    return <FaBuilding />;
  if (lowerType.includes("tax")) return <FaFileInvoiceDollar />;
  if (lowerType.includes("insurance")) return <FaShieldAlt />;
  return <FaRegFileAlt />; // Default icon
};

// --- Define required documents (Place in shared file ideally) ---
const REQUIRED_DOCS = {
  individual: [
    {
      key: "id",
      label: "ID (Passport/Driving License)",
      types: ["passport", "driving license", "id card", "national id"],
    },
    {
      key: "qualification",
      label: "Professional Qualification (Degree/Certificate)",
      types: ["degree", "certificate", "qualification"],
    },
  ],
  agency: [
    {
      key: "licence",
      label: "Business Licence",
      types: ["licence", "license"],
    },
    {
      key: "tax",
      label: "Tax ID Document",
      types: ["tax id", "tax document", "vat registration"],
    },
    { key: "insurance", label: "Business Insurance", types: ["insurance"] },
  ],
};

// --- Helper to check required documents (Modified for general use) ---
const checkRequiredDocuments = (user) => {
  try {
    // Check if user object, accountType, or requirements for accountType are missing
    if (!user || !user.accountType || !REQUIRED_DOCS[user.accountType]) {
      // If no specific requirements for this account type, or account type is missing,
      // consider all (non-existent) requirements met or no basis to say docs are missing.
      return { allPresent: true, missing: [], present: [] };
    }

    const required = REQUIRED_DOCS[user.accountType];
    // If the requirements list for this account type is empty, all are considered present.
    if (!required.length) return { allPresent: true, missing: [], present: [] };

    const uploadedTypes = (user.documents || [])
      .map((doc) => doc?.type?.toLowerCase())
      .filter((type) => typeof type === "string" && type.length > 0);

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
    return result;
  } catch (error) {
    console.error("Error checking documents:", error);
    // Fallback in case of an unexpected error during the check
    return {
      allPresent: false,
      missing: ["Error checking documents"],
      present: [],
    };
  }
};

// --- Component Definition ---
const ProfileDocuments = ({ user }) => {
  const documents = user?.documents || [];

  // Calculate present/missing docs if user is not verified and has an account type
  const { present: presentDocs = [], missing: missingDocs = [] } =
    !user?.isVerified && user?.accountType
      ? checkRequiredDocuments(user) || { present: [], missing: [] }
      : { present: [], missing: [] };

  const requiredForUser =
    (user?.accountType && REQUIRED_DOCS[user.accountType]) || [];

  // Show requirements if user is not verified, has an account type, and there are requirements defined
  const showRequirements =
    !user?.isVerified && user?.accountType && requiredForUser.length > 0;

  return (
    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
      {/* Verification Requirements Section */}
      {showRequirements && (
        <Box mb={3} p={2} sx={{ bgcolor: "grey.100", borderRadius: 1 }}>
          <Typography variant="subtitle1" fontWeight={500} gutterBottom>
            Verification Requirements ({user.accountType})
          </Typography>
          <List dense disablePadding>
            {requiredForUser.map((req) => {
              const isMissing = missingDocs.includes(req.label);
              return (
                <ListItem key={req.key} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemIcon
                    sx={{
                      minWidth: 30,
                      color: isMissing ? "warning.main" : "success.main",
                    }}
                  >
                    {isMissing ? (
                      <FaTimesCircle size={16} />
                    ) : (
                      <FaCheckCircle size={16} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={req.label}
                    primaryTypographyProps={{
                      variant: "body2",
                      color: isMissing ? "text.secondary" : "text.primary",
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
          {missingDocs.length > 0 ? (
            <Alert
              severity="warning"
              variant="outlined"
              sx={{ mt: 1.5, fontSize: "0.8rem" }}
            >
              Please upload the missing document(s) marked above to proceed with
              verification.
            </Alert>
          ) : (
            <Alert
              severity="success"
              variant="outlined"
              sx={{ mt: 1.5, fontSize: "0.8rem" }}
            >
              All required document types seem to be uploaded. Verification is
              pending review by admin.
            </Alert>
          )}
        </Box>
      )}
      {/* Uploaded Documents Section Title */}
      <Typography
        variant="subtitle1"
        fontWeight={500}
        gutterBottom={documents.length > 0}
      >
        Uploaded Documents
      </Typography>
      {showRequirements && documents.length > 0 && <Divider sx={{ mb: 2 }} />}{" "}
      {/* Divider only if reqs shown & docs exist */}
      {/* Uploaded Documents List */}
      {documents.length > 0 ? (
        <List disablePadding>
          {documents.map((doc, index) => (
            <ListItem
              key={index}
              disableGutters
              sx={{
                py: 1,
                px: 1.5,
                mb: 1,
                borderRadius: 1,
                bgcolor: "action.hover",
                "&:last-child": { mb: 0 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  overflow: "hidden",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: "auto",
                    mr: 0,
                    fontSize: "1.1rem",
                    color: "text.secondary",
                  }}
                >
                  {getDocumentIcon(doc.type)}
                </ListItemIcon>
                <ListItemText
                  primary={doc.type || `Document ${index + 1}`}
                  primaryTypographyProps={{
                    variant: "body2",
                    noWrap: true,
                    title: doc.type || `Document ${index + 1}`,
                  }}
                  sx={{ my: 0 }}
                />
              </Box>
              <Button
                variant="outlined"
                size="small"
                color="primary"
                component={doc.url ? MuiLink : "button"}
                href={doc.url ? `${BASE_URL}/${doc.url}` : undefined}
                target={doc.url ? "_blank" : undefined}
                rel={doc.url ? "noopener noreferrer" : undefined}
                disabled={!doc.url}
                sx={{ flexShrink: 0, ml: 1 }}
              >
                View
              </Button>
            </ListItem>
          ))}
        </List>
      ) : (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="center"
          color="text.secondary"
          sx={{
            py: 3,
            fontStyle: "italic",
            bgcolor: "grey.100",
            borderRadius: 1,
          }}
        >
          <FaExclamationTriangle size={18} />
          <Typography variant="body2">No documents uploaded yet.</Typography>
        </Stack>
      )}
    </Paper>
  );
};

export default ProfileDocuments;
