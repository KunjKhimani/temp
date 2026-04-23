/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState } from "react";
import {
  Box,
  Modal,
  Typography,
  TextField,
  Button,
  IconButton,
} from "@mui/material";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";

const RatingModal = ({ open, onClose }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  const handleRatingClick = (value) => {
    setRating(value);
  };

  const handleSubmit = () => {
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }
    setRating(0);
    setReview("");
    onClose();
  };

  const handleCancel = () => {
    setRating(0);
    setReview("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="rating-modal-title">
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography id="rating-modal-title" variant="h6" gutterBottom>
          Rate the Service
        </Typography>

        <Box display="flex" justifyContent="center" my={2}>
          {[1, 2, 3, 4, 5].map((value) => (
            <IconButton
              key={value}
              onClick={() => handleRatingClick(value)}
              sx={{
                color: value <= rating ? "gold" : "grey",
                fontSize: "large",
              }}
            >
              {value <= rating ? <StarIcon /> : <StarBorderIcon />}
            </IconButton>
          ))}
        </Box>

        <TextField
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          placeholder="Write your review..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
          sx={{ marginBottom: 2 }}
        />

        <Box display="flex" justifyContent="space-between">
          <Button variant="outlined" onClick={handleCancel} color="secondary">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit} color="primary">
            Submit
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default RatingModal;
