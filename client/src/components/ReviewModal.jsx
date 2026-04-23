import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    IconButton,
    Modal,
    TextField,
    Typography,
} from "@mui/material";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import { reviewApi } from "../services/reviewApi";
import { useDispatch } from "react-redux";
import { showSnackbar } from "../store/slice/snackbarSlice";

const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { xs: "90%", sm: 460 },
    bgcolor: "background.paper",
    borderRadius: 2,
    boxShadow: 24,
    p: 3,
};

const ReviewModal = ({
    open,
    onClose,
    onSuccess,
    orderId,
    orderModel,
    listingId,
    listingModel,
    title = "Write a review",
}) => {
    const dispatch = useDispatch();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!open) {
            setRating(0);
            setComment("");
            setSubmitError("");
            setIsSubmitting(false);
        }
    }, [open]);

    const handleSubmit = async () => {
        if (rating < 1 || rating > 5) {
            setSubmitError("Please select a rating from 1 to 5.");
            return;
        }

        if (!comment.trim()) {
            setSubmitError("Please add a short description.");
            return;
        }

        if (!orderId || !orderModel || !listingId || !listingModel) {
            setSubmitError("Review context is missing. Please refresh and try again.");
            return;
        }

        setSubmitError("");
        setIsSubmitting(true);

        try {
            await reviewApi.createReview({
                orderId,
                orderModel,
                listingId,
                listingModel,
                rating,
                comment: comment.trim(),
            });

            dispatch(
                showSnackbar({
                    message: "Review submitted successfully.",
                    severity: "success",
                })
            );

            onSuccess?.({ rating, comment: comment.trim() });
            onClose?.();
        } catch (error) {
            setSubmitError(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to submit review."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} aria-labelledby="review-modal-title">
            <Box sx={modalStyle}>
                <Typography id="review-modal-title" variant="h6" sx={{ mb: 2 }}>
                    {title}
                </Typography>

                <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                    {[1, 2, 3, 4, 5].map((value) => (
                        <IconButton
                            key={value}
                            onClick={() => setRating(value)}
                            aria-label={`rate-${value}`}
                            sx={{ color: value <= rating ? "warning.main" : "grey.400" }}
                        >
                            {value <= rating ? <StarIcon /> : <StarBorderIcon />}
                        </IconButton>
                    ))}
                </Box>

                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Share your experience..."
                    label="Description"
                />

                {submitError ? (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {submitError}
                    </Alert>
                ) : null}

                <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
                    <Button onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
                    >
                        Submit Review
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default ReviewModal;
