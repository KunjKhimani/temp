/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    Modal,
    Stack,
    Typography,
} from "@mui/material";
import { DEFAULT_SPECIAL_DEAL_ACTIVATION_FEE } from "../constants/promotions";

const SQUARE_WEB_SDK_URL =
    import.meta.env.VITE_SQUARE_ENV === "production"
        ? "https://web.squarecdn.com/v1/square.js"
        : "https://sandbox.web.squarecdn.com/v1/square.js";

let squareSdkLoaderPromise;

const loadSquareSdk = () => {
    if (window.Square) {
        return Promise.resolve();
    }

    if (squareSdkLoaderPromise) {
        return squareSdkLoaderPromise;
    }

    squareSdkLoaderPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${SQUARE_WEB_SDK_URL}"]`);

        if (existing) {
            if (existing.dataset.loaded === "true") {
                resolve();
                return;
            }

            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener(
                "error",
                () => reject(new Error("Unable to load Square SDK.")),
                { once: true }
            );
            return;
        }

        const script = document.createElement("script");
        script.src = SQUARE_WEB_SDK_URL;
        script.async = true;
        script.addEventListener("load", () => {
            script.dataset.loaded = "true";
            resolve();
        });
        script.addEventListener("error", () =>
            reject(new Error("Unable to load Square SDK."))
        );
        document.body.appendChild(script);
    });

    return squareSdkLoaderPromise;
};

const specialDealPaymentModalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { xs: "92%", sm: 640 },
    maxHeight: "85vh",
    overflowY: "auto",
    bgcolor: "background.paper",
    borderRadius: 2,
    boxShadow: 24,
    p: { xs: 1.5, sm: 2 },
};

const SpecialDealPaymentModal = ({
    open,
    onClose,
    dealPayload,
    entityId,
    idempotencyPrefix = "special-deal",
    title = "Payment Information",
    subheader = "Use your card to activate this special deal.",
    amountLabel = "Activation Amount",
    amount = DEFAULT_SPECIAL_DEAL_ACTIVATION_FEE,
    onConfirmPayment,
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardReady, setCardReady] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const squareCardRef = useRef(null);
    const cardContainerIdRef = useRef(
        `square-special-deal-card-${Math.random().toString(36).slice(2, 10)}`
    );

    useEffect(() => {
        let mounted = true;

        if (!open) {
            setCardReady(false);
            setErrorMessage(null);
            return undefined;
        }

        const setupCard = async () => {
            try {
                const appId = import.meta.env.VITE_SQUARE_APPLICATION_ID;
                const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;

                if (!appId || !locationId) {
                    throw new Error(
                        "Square is not configured. Set VITE_SQUARE_APPLICATION_ID and VITE_SQUARE_LOCATION_ID."
                    );
                }

                await loadSquareSdk();

                if (!mounted) {
                    return;
                }

                const container = document.getElementById(cardContainerIdRef.current);
                if (!container) {
                    throw new Error("Payment form container is unavailable.");
                }

                const payments = window.Square.payments(appId, locationId);
                const card = await payments.card();

                if (!mounted) {
                    if (card?.destroy) {
                        card.destroy();
                    }
                    return;
                }

                container.innerHTML = "";
                await card.attach(`#${cardContainerIdRef.current}`);

                if (mounted) {
                    squareCardRef.current = card;
                    setCardReady(true);
                    setErrorMessage(null);
                }
            } catch (error) {
                if (mounted) {
                    setCardReady(false);
                    setErrorMessage(error.message || "Unable to load payment form.");
                }
            }
        };

        setupCard();

        return () => {
            mounted = false;
            setCardReady(false);
            setIsProcessing(false);

            if (squareCardRef.current?.destroy) {
                squareCardRef.current.destroy();
            }
            squareCardRef.current = null;

            const container = document.getElementById(cardContainerIdRef.current);
            if (container) {
                container.innerHTML = "";
            }
        };
    }, [open]);

    const handleModalClose = (_, reason) => {
        if (isProcessing) {
            return;
        }

        if (reason === "backdropClick") {
            return;
        }

        onClose?.();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage(null);

        if (!squareCardRef.current) {
            setErrorMessage("Payment form is not ready yet.");
            return;
        }

        setIsProcessing(true);
        try {
            const tokenResult = await squareCardRef.current.tokenize();
            if (tokenResult.status !== "OK") {
                const tokenError = tokenResult?.errors?.[0]?.message;
                setErrorMessage(tokenError || "Card tokenization failed. Please check card details.");
                setIsProcessing(false);
                return;
            }

            await Promise.resolve(
                onConfirmPayment?.({
                    dealPayload,
                    paymentData: {
                        sourceId: tokenResult.token,
                        idempotencyKey: `${idempotencyPrefix}-${entityId || "entity"}-${Date.now()}`,
                    },
                })
            );

            onClose?.();
        } catch (error) {
            setErrorMessage(error?.message || "Payment failed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const amountToPay =
        typeof amount === "number" ? amount : DEFAULT_SPECIAL_DEAL_ACTIVATION_FEE;

    return (
        <Modal
            open={Boolean(open)}
            onClose={handleModalClose}
            aria-labelledby="special-deal-payment-modal-title"
        >
            <Box sx={specialDealPaymentModalStyle}>
                <Card elevation={2}>
                    <CardHeader
                        title={title}
                        subheader={subheader}
                        sx={{ borderBottom: "1px solid", borderColor: "divider", p: 2 }}
                        titleTypographyProps={{ variant: "h6" }}
                    />
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <Stack spacing={2.5}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography variant="body1" color="text.secondary">
                                        {amountLabel}
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                                        ${amountToPay.toFixed(2)}
                                    </Typography>
                                </Box>

                                <div id={cardContainerIdRef.current} />

                                {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1.5}
                                    justifyContent="flex-end"
                                >
                                    <Button
                                        variant="outlined"
                                        onClick={handleModalClose}
                                        disabled={isProcessing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        disabled={!cardReady || isProcessing}
                                        sx={{
                                            mt: { xs: 0, sm: "0 !important" },
                                            py: 1.5,
                                            fontSize: "1rem",
                                        }}
                                    >
                                        {isProcessing ? (
                                            <CircularProgress size={24} color="inherit" />
                                        ) : (
                                            "Pay Now"
                                        )}
                                    </Button>
                                </Stack>
                            </Stack>
                        </form>
                    </CardContent>
                </Card>
            </Box>
        </Modal>
    );
};

export default SpecialDealPaymentModal;
