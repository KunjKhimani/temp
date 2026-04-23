/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Stack,
    TextField,
    Button,
    CircularProgress,
    Modal,
    IconButton,
    InputAdornment,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const specialDealModalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { xs: "90%", sm: 500 },
    maxHeight: "85vh",
    overflowY: "auto",
    bgcolor: "background.paper",
    borderRadius: 2,
    boxShadow: 24,
    p: { xs: 2.5, sm: 3 },
};

const getNormalizedLockedActualPrice = (rawActualPrice) => {
    if (rawActualPrice === undefined || rawActualPrice === null || rawActualPrice === "") {
        return "";
    }

    const parsedActualPrice = Number(rawActualPrice);
    if (!Number.isFinite(parsedActualPrice) || parsedActualPrice <= 0) {
        return "";
    }

    return parsedActualPrice.toString();
};

const createInitialFormData = (actualPrice = "") => ({
    description: "",
    actualPrice,
    sellingPrice: "",
    specialDealDuration: "",
});

const ServiceSpecificDealModal = ({
    open,
    onClose,
    actionStatus,
    onPay,
    title = "List Special Deal",
    subtitle = "Fill in your offer details and continue with activation payment.",
    payButtonLabel = "Pay",
    initialActualPrice,
    isRequest = false,
}) => {
    const lockedActualPrice = getNormalizedLockedActualPrice(initialActualPrice);
    const [formData, setFormData] = useState(
        createInitialFormData(lockedActualPrice)
    );
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        if (open && lockedActualPrice) {
            setFormData((prev) => ({ ...prev, actualPrice: lockedActualPrice }));
            setFormErrors((prev) => {
                if (!prev.actualPrice) {
                    return prev;
                }

                const nextErrors = { ...prev };
                delete nextErrors.actualPrice;
                return nextErrors;
            });
            return;
        }

        if (!open) {
            setFormData(createInitialFormData(lockedActualPrice));
            setFormErrors({});
        }
    }, [lockedActualPrice, open]);

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = () => {
        const errors = {};
        const actualPrice = parseFloat(formData.actualPrice);
        const sellingPrice = parseFloat(formData.sellingPrice);

        if (!formData.description.trim()) {
            errors.description = "Description is required.";
        }

        if (Number.isNaN(actualPrice) || actualPrice <= 0) {
            errors.actualPrice = "Enter a valid actual price.";
        }

        if (Number.isNaN(sellingPrice) || sellingPrice <= 0) {
            errors.sellingPrice = "Enter a valid selling price.";
        } else if (!Number.isNaN(actualPrice)) {
            if (isRequest && sellingPrice <= actualPrice) {
                errors.sellingPrice =
                    "Selling price should be higher than actual price for requests.";
            } else if (!isRequest && sellingPrice >= actualPrice) {
                errors.sellingPrice =
                    "Selling price should be lower than actual price for listings.";
            }
        }

        const duration = parseInt(formData.specialDealDuration, 10);
        if (!formData.specialDealDuration || Number.isNaN(duration) || duration <= 0) {
            errors.specialDealDuration = "Duration (days) must be a positive number.";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handlePay = async () => {
        if (!validateForm()) {
            return;
        }

        const payload = {
            description: formData.description.trim(),
            actualPrice: Number(formData.actualPrice),
            sellingPrice: Number(formData.sellingPrice),
            specialDealDuration: Number(formData.specialDealDuration),
        };

        try {
            await Promise.resolve(onPay?.(payload));
            onClose?.();
        } catch {
            // Keep modal open on payment errors so user can retry.
        }
    };

    return (
        <Modal
            open={Boolean(open)}
            onClose={onClose}
            aria-labelledby="specific-deal-modal-title"
        >
            <Box sx={specialDealModalStyle}>
                <Typography id="specific-deal-modal-title" variant="h6" fontWeight="bold">
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {subtitle}
                </Typography>

                <Stack spacing={2} sx={{ mt: 2 }}>
                    <TextField
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleFieldChange}
                        multiline
                        minRows={3}
                        fullWidth
                        error={Boolean(formErrors.description)}
                        helperText={formErrors.description}
                    />

                    <TextField
                        label="Actual Price"
                        name="actualPrice"
                        type="number"
                        value={formData.actualPrice}
                        onChange={handleFieldChange}
                        disabled={Boolean(lockedActualPrice)}
                        fullWidth
                        inputProps={{ min: 0, step: "0.01" }}
                        error={Boolean(formErrors.actualPrice)}
                        helperText={
                            lockedActualPrice
                                ? "Auto-filled from the base price."
                                : formErrors.actualPrice
                        }
                        InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                    />

                    <TextField
                        label="Selling Price"
                        name="sellingPrice"
                        type="number"
                        value={formData.sellingPrice}
                        onChange={handleFieldChange}
                        fullWidth
                        inputProps={{ min: 0, step: "0.01" }}
                        error={Boolean(formErrors.sellingPrice)}
                        helperText={formErrors.sellingPrice}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                    />

                    <TextField
                        label="Duration (Days)"
                        name="specialDealDuration"
                        type="number"
                        value={formData.specialDealDuration}
                        onChange={handleFieldChange}
                        fullWidth
                        inputProps={{ min: 1 }}
                        error={Boolean(formErrors.specialDealDuration)}
                        helperText={formErrors.specialDealDuration || "e.g., 14 for 2 weeks"}
                    />

                    <Box display="flex" alignItems="center" gap={1}>
                        <IconButton size="small" aria-label="Activation fee info">
                            <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" color="text.secondary">
                            This is one time activation fee for special deal
                        </Typography>
                    </Box>

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        justifyContent="flex-end"
                    >
                        <Button
                            variant="outlined"
                            onClick={onClose}
                            disabled={actionStatus === "loading"}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handlePay}
                            disabled={actionStatus === "loading"}
                        >
                            {actionStatus === "loading" ? (
                                <CircularProgress size={22} color="inherit" />
                            ) : (
                                payButtonLabel
                            )}
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </Modal>
    );
};

export default ServiceSpecificDealModal;
