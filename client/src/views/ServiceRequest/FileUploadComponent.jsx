/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
// src/components/ServiceRequest/FileUploadComponent.jsx (Example of an enhanced one)
import React from "react";
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import AttachFileIcon from "@mui/icons-material/AttachFile";

const FileUploadComponent = ({
  selectedFiles = [], // New files selected by the user (File objects)
  existingAttachments = [], // String paths of already uploaded files (for edit mode)
  onFilesChange, // Callback when new files are selected from input
  onRemoveNewFile, // Callback to remove a newly selected file (before submission)
  onRemoveExistingFile, // Callback to mark an existing file for removal (for edit mode)
  maxFiles = 5,
  maxSizeMB = 5,
}) => {
  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    const currentTotalFiles =
      selectedFiles.length +
      existingAttachments.filter((att) => !att.markedForRemoval).length;

    if (newFiles.length + currentTotalFiles > maxFiles) {
      alert(`You can upload a maximum of ${maxFiles} files.`);
      return;
    }

    let filesToUpload = [];
    for (let file of newFiles) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(
          `File "${file.name}" is too large. Maximum size is ${maxSizeMB}MB.`
        );
        continue;
      }
      filesToUpload.push(file);
    }
    onFilesChange(filesToUpload); // Pass only valid new files
  };

  const totalFilesCount =
    selectedFiles.length +
    existingAttachments.filter((att) => !att.markedForRemoval).length;

  return (
    <Box>
      <Button
        variant="outlined"
        component="label"
        size="small"
        disabled={totalFilesCount >= maxFiles}
        startIcon={<AttachFileIcon />}
      >
        {totalFilesCount >= maxFiles
          ? `Max ${maxFiles} Files Reached`
          : "Add Attachments"}
        <input
          type="file"
          hidden
          multiple
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx" // Specify acceptable file types
        />
      </Button>
      <Typography
        variant="caption"
        display="block"
        color="text.secondary"
        mt={0.5}
      >
        Max {maxFiles} files, {maxSizeMB}MB per file. Allowed types: images,
        PDF, DOC, TXT, XLS.
      </Typography>

      {(selectedFiles.length > 0 || existingAttachments.length > 0) && (
        <List
          dense
          sx={{
            mt: 1,
            maxHeight: 200,
            overflow: "auto",
            border: "1px solid #eee",
            borderRadius: 1,
            p: 1,
          }}
        >
          {/* Display existing attachments (for edit mode) */}
          {existingAttachments.map((att, index) => (
            <ListItem
              key={`existing-${index}`}
              disableGutters
              sx={{
                textDecoration: att.markedForRemoval ? "line-through" : "none",
                opacity: att.markedForRemoval ? 0.6 : 1,
                bgcolor: "grey.100",
                mb: 0.5,
                borderRadius: 1,
                p: 0.5,
              }}
              secondaryAction={
                onRemoveExistingFile && (
                  <IconButton
                    edge="end"
                    aria-label="remove existing file"
                    onClick={() => onRemoveExistingFile(att.path)}
                    size="small"
                  >
                    <ClearIcon
                      fontSize="small"
                      color={att.markedForRemoval ? "disabled" : "error"}
                    />
                  </IconButton>
                )
              }
            >
              <ListItemText
                primary={att.name}
                secondary={"Previously uploaded"}
                primaryTypographyProps={{
                  variant: "body2",
                  noWrap: true,
                  title: att.name,
                }}
              />
            </ListItem>
          ))}

          {/* Display newly selected files */}
          {selectedFiles.map((file, index) => (
            <ListItem
              key={`new-${file.name}-${index}`}
              disableGutters
              sx={{
                bgcolor: "primary.lighter",
                mb: 0.5,
                borderRadius: 1,
                p: 0.5,
              }}
              secondaryAction={
                onRemoveNewFile && (
                  <IconButton
                    edge="end"
                    aria-label="remove new file"
                    onClick={() => onRemoveNewFile(index)}
                    size="small"
                  >
                    <ClearIcon fontSize="small" color="error" />
                  </IconButton>
                )
              }
            >
              <ListItemText
                primary={file.name}
                secondary={`${(file.size / 1024).toFixed(1)} KB - New`}
                primaryTypographyProps={{
                  variant: "body2",
                  noWrap: true,
                  title: file.name,
                }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default FileUploadComponent;
