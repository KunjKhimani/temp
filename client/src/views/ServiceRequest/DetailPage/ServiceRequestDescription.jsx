/* eslint-disable no-unused-vars */
// src/views/ServiceRequest/ServiceRequestDescription.jsx
/* eslint-disable react/prop-types */
import React from "react";
import {
  Paper,
  Typography,
  Divider,
  Box,
  Chip,
  Stack,
  List,
  ListItem,
  Link as MuiLink,
} from "@mui/material";
import AttachmentIcon from "@mui/icons-material/Attachment";

const API_DOMAIN_FOR_IMAGES =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ServiceRequestDescription = ({ description, tags, attachments }) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        bgcolor: "transparent",
        border: "none", // To match Service.jsx styling
      }}
    >
      <Typography variant="h6" gutterBottom fontWeight="600">
        Request Details
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ whiteSpace: "pre-wrap", mb: 2 }}
      >
        {description || "No description provided."}
      </Typography>

      {tags && tags.length > 0 && (
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
            Tags:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
          </Stack>
        </Box>
      )}

      {attachments && attachments.length > 0 && (
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
            Attachments:
          </Typography>
          <List dense disablePadding>
            {attachments.map((att, index) => (
              <ListItem key={index} disablePadding sx={{ py: 0.25 }}>
                <MuiLink
                  href={`${API_DOMAIN_FOR_IMAGES}/uploads/${att.replace(
                    /^uploads\//i,
                    ""
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "0.875rem",
                  }}
                >
                  <AttachmentIcon
                    fontSize="small"
                    sx={{ mr: 0.5, color: "action.active" }}
                  />
                  {att.split("/").pop()}
                </MuiLink>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Paper>
  );
};

export default ServiceRequestDescription;
