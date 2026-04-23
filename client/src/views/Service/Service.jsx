/* eslint-disable no-unused-vars */
// src/views/Service/Service.jsx

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  Breadcrumbs,
  Link as MuiLink,
  Stack,
  CircularProgress,
  Alert,
  Container,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "@mui/material/styles";

// Service Thunks
import {
  fetchServiceById,
  editService,
  removeService,
} from "../../store/thunks/serviceThunks";

// Service Slice
import {
  clearServiceViewState,
  selectCurrentViewService,
  selectCurrentViewStatus,
  selectCurrentViewError,
  selectServiceActionStatus,
  selectServiceActionError,
  clearServiceActionState,
} from "../../store/slice/serviceSlice";

// User Slice
import { selectUser } from "../../store/slice/userSlice";

// Order API
import { orderApi } from "../../services/orderApi";

// Chat Slice
import {
  clearCurrentChat,
  getOrCreateConversation,
  selectCurrentChatTargetName,
  selectCurrentConversationId,
  selectCurrentMessages,
  selectMessagesStatus,
  selectSendMessageStatus,
  sendMessage,
} from "../../store/slice/chatSlice";

// Child Components
import ServicePageHeader from "./ServicePageHeader";
import ServiceImageDisplay from "./ServiceImageDisplay";
import ServiceDescription from "./ServiceDescription";
import ServiceSidebar from "./ServiceSidebar";
import BookingDrawer from "./BookingDrawer";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import ChatBox from "../Chat/ChatBox";
import { showSnackbar } from "../../store/slice/snackbarSlice";
import ReviewModal from "../../components/ReviewModal";
import ReviewSection from "../../components/ReviewSection";
import { reviewApi } from "../../services/reviewApi";

// Helper function to generate slots within a time range based on duration
const generateSlotsForDay = (startTimeStr, endTimeStr, durationHours) => {
  const slots = [];
  if (!startTimeStr || !endTimeStr || !durationHours || durationHours <= 0) {
    return slots;
  }
  let currentHour = parseInt(startTimeStr.split(":")[0], 10);
  let currentMinute = parseInt(startTimeStr.split(":")[1], 10);
  const endHour = parseInt(endTimeStr.split(":")[0], 10);
  const endMinute = parseInt(endTimeStr.split(":")[1], 10);

  if (
    isNaN(currentHour) ||
    isNaN(currentMinute) ||
    isNaN(endHour) ||
    isNaN(endMinute)
  ) {
    return slots; // Invalid time string format
  }

  const durationMinutes = durationHours * 60;

  while (true) {
    const slotStartHour = currentHour;
    const slotStartMinute = currentMinute;

    let slotEndHour = slotStartHour;
    let slotEndMinute = slotStartMinute + durationMinutes;

    slotEndHour += Math.floor(slotEndMinute / 60);
    slotEndMinute %= 60;

    if (
      slotEndHour > endHour ||
      (slotEndHour === endHour && slotEndMinute > endMinute)
    ) {
      break;
    }

    slots.push(
      `${String(slotStartHour).padStart(2, "0")}:${String(
        slotStartMinute
      ).padStart(2, "0")}-` +
      `${String(slotEndHour).padStart(2, "0")}:${String(
        slotEndMinute
      ).padStart(2, "0")}`
    );

    currentHour = slotEndHour;
    currentMinute = slotEndMinute;

    if (
      currentHour > endHour ||
      (currentHour === endHour && currentMinute >= endMinute)
    ) {
      break;
    }
  }
  return slots;
};

const generateCalendarAvailability = (
  serviceWeeklySlots,
  serviceDurationHours = 1,
  lookAheadDays = 30
) => {
  if (!serviceWeeklySlots || serviceWeeklySlots.length === 0) {
    return [];
  }

  const calendarAvailability = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < lookAheadDays; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);
    const dayOfWeek = currentDate.getDay(); // Sunday = 0, ..., Saturday = 6
    const weeklySlotDef = serviceWeeklySlots.find(
      (slot) => slot.dayOfWeek === dayOfWeek
    );

    if (weeklySlotDef) {
      const dateStr = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD
      const timeSlotsForDate = generateSlotsForDay(
        weeklySlotDef.startTime,
        weeklySlotDef.endTime,
        serviceDurationHours
      );

      if (timeSlotsForDate.length > 0) {
        calendarAvailability.push({
          date: dateStr,
          timeSlots: timeSlotsForDate,
        });
      }
    }
  }
  return calendarAvailability;
};

const Service = () => {
  const { serviceId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();

  const servicePayload = useSelector(selectCurrentViewService);
  const status = useSelector(selectCurrentViewStatus);
  const error = useSelector(selectCurrentViewError);
  const user = useSelector(selectUser);

  const deleteStatus = useSelector(selectServiceActionStatus);
  const deleteError = useSelector(selectServiceActionError);

  const currentConversationId = useSelector(selectCurrentConversationId);
  const currentMessages = useSelector(selectCurrentMessages);
  const messagesStatus = useSelector(selectMessagesStatus);
  const sendMessageStatus = useSelector(selectSendMessageStatus);
  const chatTargetName = useSelector(selectCurrentChatTargetName);

  const service = servicePayload?.service;
  const average_rating = servicePayload?.average_rating ?? 0;
  const review_count = servicePayload?.review_count ?? 0;

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chatState, setChatState] = useState("closed");

  // --- MODIFIED: formData initialization ---
  const [formData, setFormData] = useState({
    quantity: 1,
    numberOfPeople: 1,
    numberOfHours: 1,
    additionalInfo: "",
    location: "",
    selectedDate: "", // For YYYY-MM-DD
    selectedTimeSlot: "", // For "HH:MM-HH:MM"
    schedulingComment: "",
    timePreference: "any", // Fallback
    includeTravelFee: true, // Moved from separate state
    specificDateTime: "", // For flexible services sending a full date-time string
  });
  // const [includeTravelFee, setIncludeTravelFee] = useState(true); // Removed separate state

  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSubmissionError, setOrderSubmissionError] = useState(null);
  const [eligibleReviewOrder, setEligibleReviewOrder] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [hasSubmittedServiceReview, setHasSubmittedServiceReview] =
    useState(false);

  const calendarAvailabilityForDrawer = useMemo(() => {
    if (
      service &&
      service.availabilityType === "scheduled_slots" &&
      service.availableTimeSlots
    ) {
      const durationForSlotting =
        service.priceType === "per hour"
          ? Number(formData.numberOfHours) > 0
            ? Number(formData.numberOfHours)
            : 1
          : service.estimatedDurationHours || 1;

      return generateCalendarAvailability(
        service.availableTimeSlots,
        durationForSlotting,
        30
      );
    }
    return [];
  }, [service, formData.numberOfHours]);

  useEffect(() => {
    if (serviceId) {
      dispatch(clearServiceViewState());
      dispatch(clearServiceActionState());
      dispatch(fetchServiceById(serviceId));
    }
    return () => {
      dispatch(clearServiceViewState());
      dispatch(clearServiceActionState());
    };
  }, [dispatch, serviceId]);

  useEffect(() => {
    let ignore = false;

    const loadEligibleServiceOrderForReview = async () => {
      if (!user?._id || !serviceId || user?._id === service?.createdBy?._id) {
        if (!ignore) setEligibleReviewOrder(null);
        return;
      }

      try {
        const response = await orderApi.getOrdersOfUser();
        const orders = response?.data?.orders || [];
        const completedOrder = orders
          .filter(
            (order) =>
              String(order?.service?._id) === String(serviceId) &&
              order?.status === "completed"
          )
          .sort(
            (a, b) =>
              new Date(b?.createdAt || 0).getTime() -
              new Date(a?.createdAt || 0).getTime()
          )[0];

        if (!ignore) setEligibleReviewOrder(completedOrder || null);
      } catch (error) {
        if (!ignore) setEligibleReviewOrder(null);
      }
    };

    loadEligibleServiceOrderForReview();

    return () => {
      ignore = true;
    };
  }, [serviceId, service?.createdBy?._id, user?._id]);

  useEffect(() => {
    let ignore = false;

    const checkServiceReview = async () => {
      if (!serviceId || !user?._id) {
        if (!ignore) setHasSubmittedServiceReview(false);
        return;
      }

      try {
        const hasReviewed = await reviewApi.hasUserReviewedListing(
          serviceId,
          user._id
        );
        if (!ignore) setHasSubmittedServiceReview(hasReviewed);
      } catch (error) {
        if (!ignore) setHasSubmittedServiceReview(false);
      }
    };

    checkServiceReview();

    return () => {
      ignore = true;
    };
  }, [serviceId, user?._id]);

  // --- MODIFIED: Effect to set initial formData when service data is loaded ---
  useEffect(() => {
    if (service && status === "succeeded") {
      setFormData((prev) => ({
        ...prev, // Keep any user input if drawer was opened before service load
        additionalInfo: prev.additionalInfo || "", // Preserve if user typed something
        location:
          prev.location ||
          (service.locations?.length === 1
            ? service.locations[0]
            : service.locations?.length > 0
              ? ""
              : undefined),
        selectedDate: prev.selectedDate || "", // Reset these scheduling fields
        selectedTimeSlot: prev.selectedTimeSlot || "",
        schedulingComment: prev.schedulingComment || "",
        timePreference: prev.timePreference || "any",
        includeTravelFee: service.type === "on-site" && service.travelFee > 0,
        quantity:
          prev.quantity ||
          (service.priceType === "per hour" || service.type === "remote"
            ? 1
            : 1),
        numberOfPeople:
          prev.numberOfPeople || (service.type === "on-site" ? 1 : 1),
        numberOfHours:
          prev.numberOfHours || (service.priceType === "per hour" ? 1 : 1),
        specificDateTime: prev.specificDateTime || "",
      }));
    }
  }, [service, status]);

  // --- MODIFIED: handleDrawerToggle resets new scheduling fields too ---
  const handleDrawerToggle = useCallback(() => {
    const openingDrawer = !drawerOpen;
    setDrawerOpen(openingDrawer);
    if (openingDrawer && service) {
      setFormData((prev) => ({
        // Preserve some general form data, reset specifics
        ...prev,
        additionalInfo: "",
        location:
          service.locations?.length === 1
            ? service.locations[0]
            : service.locations?.length > 0
              ? ""
              : undefined,
        selectedDate: "",
        selectedTimeSlot: "",
        schedulingComment: "",
        // timePreference: "any", // Keep user's existing preference if they set one
        includeTravelFee: service.type === "on-site" && service.travelFee > 0,
        specificDateTime: "",
        // Reset quantity/people/hours based on service type or keep what was in formData
        // This can be tricky; simplest is to reset to defaults for the service
        quantity:
          service.priceType === "per hour" || service.type === "remote" ? 1 : 1,
        numberOfPeople: service.type === "on-site" ? 1 : 1,
        numberOfHours: service.priceType === "per hour" ? 1 : 1,
      }));
    }
  }, [drawerOpen, service]);

  const handleOpenDeleteDialog = useCallback(
    () => setOpenDeleteDialog(true),
    []
  );
  const handleCloseDeleteDialog = useCallback(
    () => setOpenDeleteDialog(false),
    []
  );
  const handleGoBack = useCallback(() => navigate(-1), [navigate]);
  const handleLoginRedirect = useCallback(
    () => navigate("/auth/signin"),
    [navigate]
  );

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "quantity" ||
            name === "numberOfPeople" ||
            name === "numberOfHours"
            ? value === ""
              ? ""
              : Number(value)
            : value,
    }));
  }, []);

  // --- MODIFIED: handleSubmitOrder to include new scheduling fields ---
  const handleSubmitOrder = useCallback(async () => {
    if (!serviceId || !service) {
      setOrderSubmissionError(
        "Cannot process order. Service data is unavailable."
      );
      return;
    }

    // Validation logic
    if (service.type === "on-site") {
      if (
        service.locations?.length > 0 &&
        (!formData.location || formData.location.trim() === "")
      ) {
        setOrderSubmissionError(
          "Please select a location for on-site service."
        );
        return;
      }
      if (!formData.numberOfPeople || Number(formData.numberOfPeople) < 1) {
        setOrderSubmissionError(
          "Please enter a valid number of people (at least 1)."
        );
        return;
      }
    } else {
      // Remote service
      if (!formData.quantity || Number(formData.quantity) < 1) {
        setOrderSubmissionError("Please enter a valid quantity (at least 1).");
        return;
      }
    }
    if (service.priceType === "per hour") {
      if (!formData.numberOfHours || Number(formData.numberOfHours) < 0.1) {
        setOrderSubmissionError(
          "Please enter a valid number of hours (at least 0.1)."
        );
        return;
      }
    }
    // --- NEW: Validation for selectedDate and selectedTimeSlot if service.availabilityType is scheduled_slots ---
    if (service.availabilityType === "scheduled_slots") {
      if (!formData.selectedDate) {
        setOrderSubmissionError(
          "Please select an available date for the service."
        );
        return;
      }
      if (!formData.selectedTimeSlot) {
        setOrderSubmissionError(
          "Please select an available time slot for the service."
        );
        return;
      }
    } else if (
      service.availabilityType === "flexible" ||
      service.availabilityType === "date_range"
    ) {
      // If flexible AND user provided a specificDateTime, it should be a valid date string
      if (
        formData.specificDateTime &&
        isNaN(new Date(formData.specificDateTime).getTime())
      ) {
        setOrderSubmissionError(
          "Invalid specific date and time provided for flexible service."
        );
        return;
      }
      // If only selectedDate is provided for flexible, that's fine, timePreference will be used.
    }

    setOrderSubmissionError(null);
    setIsSubmittingOrder(true);

    const orderPayload = {
      serviceId,
      additionalInfo: formData.additionalInfo?.trim() || undefined,
      includeTravelFee: formData.includeTravelFee,
      schedulingComment: formData.schedulingComment?.trim() || undefined,
      timePreference: formData.timePreference || "any", // Always send fallback
    };

    // Add specific scheduling fields if present in formData
    if (formData.selectedDate)
      orderPayload.selectedDate = formData.selectedDate;
    if (formData.selectedTimeSlot)
      orderPayload.selectedTimeSlot = formData.selectedTimeSlot;
    if (formData.specificDateTime)
      orderPayload.specificDateTime = formData.specificDateTime;

    if (service.type === "on-site") {
      orderPayload.numberOfPeople = Number(formData.numberOfPeople);
      if (formData.location) orderPayload.location = formData.location;
    } else {
      orderPayload.quantity = Number(formData.quantity) || 1;
    }
    if (service.priceType === "per hour") {
      orderPayload.numberOfHours = Number(formData.numberOfHours);
    }

    console.log("Frontend Order Payload being sent:", orderPayload);

    try {
      const response = await orderApi.createOrder(orderPayload);
      const { order, clientSecret } = response.data;
      if (order && clientSecret) {
        setDrawerOpen(false);
        navigate(
          `/payments/?clientSecret=${encodeURIComponent(
            clientSecret
          )}&orderId=${order._id}`
        );
      } else {
        setOrderSubmissionError(
          response.data?.message || "Payment initialization failed."
        );
      }
    } catch (err) {
      setOrderSubmissionError(
        err.response?.data?.message || err.message || "Could not create order."
      );
    } finally {
      setIsSubmittingOrder(false);
    }
  }, [navigate, serviceId, service, formData]);

  const handleDeleteServiceConfirm = useCallback(() => {
    if (!serviceId || deleteStatus === "loading") return;
    dispatch(removeService(serviceId))
      .unwrap()
      .then(() => {
        setOpenDeleteDialog(false);
        navigate("/");
      })
      .catch((rejectedValue) => {
        alert(
          `Failed to delete service: ${rejectedValue?.message || "Unknown error"
          }`
        );
        setOpenDeleteDialog(false);
      });
  }, [dispatch, navigate, serviceId, deleteStatus]);

  const handleListServiceSpecificDealPay = useCallback(
    async (specialDealPayload) => {
      if (!serviceId) {
        throw new Error("Service ID is missing.");
      }

      const normalizedActualPrice = Number(specialDealPayload?.actualPrice);
      const normalizedSellingPrice = Number(specialDealPayload?.sellingPrice);
      const normalizedSpecialDescription = String(
        specialDealPayload?.specialDescription ??
        specialDealPayload?.description ??
        ""
      ).trim();
      const normalizedSpecialOfferSourceId =
        specialDealPayload?.specialOfferSourceId ??
        specialDealPayload?.paymentData?.sourceId;

      if (
        !Number.isFinite(normalizedActualPrice) ||
        normalizedActualPrice <= 0
      ) {
        throw new Error(
          "Actual price is invalid. Please review special deal details."
        );
      }

      if (
        !Number.isFinite(normalizedSellingPrice) ||
        normalizedSellingPrice <= 0
      ) {
        throw new Error(
          "Selling price is invalid. Please review special deal details."
        );
      }

      if (normalizedSellingPrice > normalizedActualPrice) {
        throw new Error(
          "Selling price should be less than or equal to actual price."
        );
      }

      if (!normalizedSpecialDescription) {
        throw new Error("Special description is required.");
      }

      if (!normalizedSpecialOfferSourceId) {
        throw new Error(
          "Payment token is missing. Please re-enter your card details."
        );
      }

      try {
        const updatePayload = new FormData();
        updatePayload.set("isSpecial", "true");
        updatePayload.set("actualPrice", String(normalizedActualPrice));
        updatePayload.set("sellingPrice", String(normalizedSellingPrice));
        updatePayload.set("specialDescription", normalizedSpecialDescription);
        updatePayload.set("specialOfferSourceId", normalizedSpecialOfferSourceId);

        await dispatch(
          editService({
            id: serviceId,
            data: updatePayload,
          })
        ).unwrap();

        await dispatch(fetchServiceById(serviceId));

        dispatch(
          showSnackbar({
            message: "Service special deal updated successfully.",
            severity: "success",
          })
        );
      } catch (error) {
        const errorMessage =
          error?.message ||
          "Failed to update special deal. Please try again.";

        dispatch(
          showSnackbar({
            message: errorMessage,
            severity: "error",
          })
        );

        throw error;
      }
    },
    [dispatch, serviceId]
  );

  const handleOpenChat = useCallback(() => {
    if (service?.createdBy?._id && user?._id) {
      dispatch(
        getOrCreateConversation({
          targetUserId: service.createdBy._id,
          currentUserId: user._id,
        })
      )
        .unwrap()
        .then((payload) => {
          if (payload?.conversation?._id)
            navigate(`/messages?conversationId=${payload.conversation._id}`);
          else alert("Could not start chat conversation.");
        })
        .catch((err) => alert(err.message || "Failed to start chat."));
    } else {
      alert("Cannot initiate chat. Information is unavailable.");
    }
  }, [dispatch, service?.createdBy?._id, user?._id, navigate]);

  const handleMinimizeChat = useCallback(() => {
    if (chatState === "open") setChatState("minimized");
  }, [chatState]);
  const handleRestoreChat = useCallback(() => {
    if (chatState === "minimized") setChatState("open");
  }, [chatState]);
  const handleCloseChat = useCallback(() => {
    setChatState("closed");
    dispatch(clearCurrentChat());
  }, [dispatch]);
  const handleSendMessage = useCallback(
    (messageText) => {
      if (currentConversationId && messageText.trim()) {
        dispatch(
          sendMessage({
            conversationId: currentConversationId,
            desc: messageText.trim(),
          })
        );
      }
    },
    [dispatch, currentConversationId]
  );

  if (status === "loading" && !servicePayload) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />{" "}
        <Typography sx={{ ml: 2 }}>Loading service details...</Typography>
      </Box>
    );
  }
  if (status === "failed") {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        <Alert severity="error" sx={{ mt: 2, justifyContent: "center" }}>
          Sorry, there was an error loading the service details.{" "}
          {error?.message || error || "Please try again later."}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          sx={{ mt: 3 }}
        >
          {" "}
          Go Back{" "}
        </Button>
      </Container>
    );
  }
  if (!service) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        <Breadcrumbs
          separator={<ChevronRightIcon fontSize="small" />}
          sx={{ mb: 3, justifyContent: "center" }}
        >
          <MuiLink
            component={RouterLink}
            to="/"
            color="inherit"
            sx={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
          </MuiLink>
          <Typography color="text.primary">Service Not Found</Typography>
        </Breadcrumbs>
        <Typography variant="h5" color="text.secondary" mt={5}>
          {" "}
          Sorry, the requested service could not be found or is unavailable.{" "}
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          sx={{ mt: 3 }}
        >
          {" "}
          Go Back{" "}
        </Button>
      </Container>
    );
  }

  const stickyTopOffset = theme.spacing(10);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, overflowX: "hidden" }}>
      <ServicePageHeader
        serviceTitle={service.title}
        onGoBack={handleGoBack}
        isSpecial={service.isSpecial}
        isCommunity={service.isCommunity}
        discountPercentage={service.specialOffer?.discountPercentage}
      />
      <Grid container spacing={{ xs: 2, md: 4 }} sx={{ mt: { xs: 1, md: 2 } }}>
        <Grid item xs={12} md={7} lg={8}>
          <Stack spacing={3}>
            <ServiceImageDisplay
              media={service.media || []}
              title={service.title}
            />
            <ServiceDescription description={service.description} />
          </Stack>
        </Grid>
        <Grid item xs={12} md={5} lg={4}>
          <ServiceSidebar
            service={service}
            average_rating={average_rating}
            review_count={review_count}
            user={user}
            stickyTopOffset={stickyTopOffset}
            onBookOrHireClick={handleDrawerToggle}
            onDeleteClick={handleOpenDeleteDialog}
            onLoginClick={handleLoginRedirect}
            onChatWithSellerClick={handleOpenChat}
            isCreator={user?._id === service.createdBy?._id}
            isDeleting={deleteStatus === "loading"}
            isSellerVerified={service.createdBy?.isVerified}
            onListServiceSpecificDealPay={handleListServiceSpecificDealPay}
            navigate={navigate}
          />

          {eligibleReviewOrder ? (
            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => setIsReviewModalOpen(true)}
              disabled={hasSubmittedServiceReview}
            >
              {hasSubmittedServiceReview ? "Reviewed" : "Add Review"}
            </Button>
          ) : null}
        </Grid>
      </Grid>
      <BookingDrawer
        open={drawerOpen}
        onClose={handleDrawerToggle}
        serviceType={service?.type}
        servicePriceType={service?.priceType}
        serviceLocations={service?.locations || []}
        serviceTravelFee={service?.travelFee ?? 0}
        serviceAvailability={calendarAvailabilityForDrawer}
        formData={formData}
        // includeTravelFee prop is removed from here as it's in formData
        onInputChange={handleInputChange}
        onSubmit={handleSubmitOrder}
        isSubmittingOrder={isSubmittingOrder}
        submissionError={orderSubmissionError}
        onClearError={() => setOrderSubmissionError(null)}
      />
      <DeleteConfirmationDialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteServiceConfirm}
        serviceTitle={service.title}
        isLoading={deleteStatus === "loading"}
      />
      {currentConversationId && chatState !== "closed" && (
        <ChatBox
          chatState={chatState}
          onMinimize={handleMinimizeChat}
          onRestore={handleRestoreChat}
          onClose={handleCloseChat}
          targetName={chatTargetName || service?.createdBy?.name || "Seller"}
          messages={currentMessages}
          currentUserId={user?._id}
          messagesLoading={messagesStatus === "loading"}
          sendMessageLoading={sendMessageStatus === "loading"}
          onSendMessage={handleSendMessage}
          conversationId={currentConversationId}
        />
      )}

      <ReviewModal
        open={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        orderId={eligibleReviewOrder?._id}
        orderModel="Order"
        listingId={serviceId}
        listingModel="Service"
        title="Review This Service"
        onSuccess={() => {
          setHasSubmittedServiceReview(true);
        }}
      />
      <ReviewSection listingId={serviceId} listingModel="Service" />
    </Container>
  );
};

export default Service;
