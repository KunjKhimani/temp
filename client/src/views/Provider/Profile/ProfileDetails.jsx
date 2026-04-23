/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import {
  Box,
  Typography,
  Paper,
  Divider,
  Stack,
  Grid,
  Alert,
  Link as MuiLink, // Import MuiLink for website
} from "@mui/material";
import {
  IconMailFilled,
  IconPhoneFilled,
  IconHomeFilled,
  IconUserScan,
  IconMapPinFilled,
  IconUserCircle, // Icon for Representative
  IconWorldWww, // Icon for Website
  IconBriefcase, // Icon for Experience
  IconStars, // Icon for Skills
  IconMap, // Icon for General Area of Service
} from "@tabler/icons-react";

// --- DetailItem Helper (Keep as is, reusable) ---
const DetailItem = ({ icon: Icon, label, value, href }) => {
  if (!value) return null; // Only render if value exists

  const content = href ? (
    <MuiLink
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      underline="hover"
      color="inherit"
    >
      {value}
    </MuiLink>
  ) : (
    value
  );

  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Icon
        size={18}
        style={{ color: "var(--mui-palette-text-secondary)", flexShrink: 0 }}
      />
      <Typography variant="body2" color="text.secondary">
        <Typography component="span" fontWeight="500" color="text.primary">
          {label}:{" "}
        </Typography>
        {content}
      </Typography>
    </Stack>
  );
};

// --- AddressDisplay Helper (Keep as is, reusable) ---
const AddressDisplay = ({ address }) => {
  if (!address || Object.values(address).every((v) => !v))
    // Check if address object exists and has values
    return (
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <IconMapPinFilled
          size={18}
          style={{
            color: "var(--mui-palette-text-secondary)",
            flexShrink: 0,
            marginTop: "3px",
          }}
        />
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          No address provided.
        </Typography>
      </Stack>
    );

  const addressParts = [
    address.street,
    address.city,
    address.state,
    address.zip,
    address.country,
  ].filter(Boolean);

  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <IconMapPinFilled
        size={18}
        style={{
          color: "var(--mui-palette-text-secondary)",
          flexShrink: 0,
          marginTop: "3px",
        }}
      />
      <Typography variant="body2" color="text.secondary">
        {addressParts.length > 0 ? (
          addressParts.join(", ")
        ) : (
          <Typography component="span" fontStyle="italic">
            No address details provided.
          </Typography>
        )}
      </Typography>
    </Stack>
  );
};

// --- Main ProfileDetails Component ---
const ProfileDetails = ({ profile }) => {
  console.log(profile);
  const isAgency = profile?.accountType === "agency";

  // Prepare website URL (add http:// if missing)
  let websiteUrl = profile?.website;
  if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
    websiteUrl = `http://${websiteUrl}`;
  }

  return (
    <Paper
      elevation={1}
      sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, bgcolor: "grey.50" }} // Use theme color
    >
      <Stack spacing={3}>
        {" "}
        {/* Increased spacing */}
        {/* About Section */}
        <Box>
          <Typography variant="h6" component="h3" fontWeight={500} gutterBottom>
            {/* Change title based on type */}
            {isAgency ? "About Company" : "About Me"}
          </Typography>
          <Divider sx={{ mb: 1.5 }} />
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              whiteSpace: "pre-wrap", // Keep line breaks from bio
              fontStyle: !profile?.bio ? "italic" : "normal",
              lineHeight: 1.6, // Improve readability
            }}
          >
            {profile?.bio ||
              (isAgency
                ? "No company description available."
                : "No bio available.")}
          </Typography>
        </Box>
        {/* Contact & Info Section */}
        <Box>
          <Typography variant="h6" component="h3" fontWeight={500} gutterBottom>
            Contact & Information
          </Typography>
          <Divider sx={{ mb: 1.5 }} />
          <Stack spacing={1.5}>
            <DetailItem
              icon={IconBriefcase} // Specific icon for experience
              label="Experience"
              value={profile?.experience}
            />

            <DetailItem
              icon={IconStars} // Specific icon for skills
              label="Skills"
              value={profile?.skills?.join(", ")} // Assuming skills is an array
            />

            <DetailItem
              icon={IconMap} // Specific icon for general area of service
              label="General Area of Service"
              value={profile?.generalAreaOfService}
            />
            {/* Show Representative Name ONLY for Agencies */}
            {isAgency && (
              <DetailItem
                icon={IconUserCircle} // Specific icon for representative
                label="Representative"
                value={profile?.representativeName}
              />
            )}
            <DetailItem
              icon={IconMailFilled}
              label="Email"
              value={profile?.email}
              href={profile?.email ? `mailto:${profile.email}` : undefined}
            />
            <DetailItem
              icon={IconPhoneFilled}
              label="Telephone"
              value={profile?.telephone}
              href={profile?.telephone ? `tel:${profile.telephone}` : undefined}
            />
            {/* Show Website ONLY for Agencies */}
            {isAgency && (
              <DetailItem
                icon={IconWorldWww} // Specific icon for website
                label="Website"
                value={profile?.website}
                href={websiteUrl} // Use prepared URL
              />
            )}
          </Stack>
        </Box>
        {/* Address Section (Remains the same, uses helper) */}
        <Box>
          <Typography variant="h6" component="h3" fontWeight={500} gutterBottom>
            Address
          </Typography>
          <Divider sx={{ mb: 1.5 }} />
          <AddressDisplay address={profile?.address} />
        </Box>
        {/* Verification Alert (Keep as is) */}
        {profile?.isSeller && !profile?.isVerified && (
          <Alert
            severity="info"
            variant="outlined"
            icon={<IconUserScan size="1.2rem" />}
          >
            {isAgency ? "Agency" : "Seller"} account verification is pending.
            Ensure profile and documents are up-to-date.
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};

export default ProfileDetails;
