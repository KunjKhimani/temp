/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Snackbar,
  Alert,
  Grid,
  Paper,
  styled,
  Checkbox,
  CircularProgress,
  FormHelperText,
  IconButton,
  RadioGroup,
  Radio,
  FormLabel,
  List,
  ListItem,
  Container,
  Divider as MuiDivider,
  FormControlLabel as MuiFormControlLabel,
  Autocomplete,
} from "@mui/material";
import {
  AddPhotoAlternate as AddPhotoAlternateIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  RemoveCircleOutline as RemoveCircleOutlineIcon,
} from "@mui/icons-material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { parse, format, isValid as isValidDate } from "date-fns";
import {
  categoryOptions,
  subcategoryOptions,
  communityCategories,
  communitySubcategoryOptions,
} from "../../data/categoryData";

import {
  clearServiceActionState,
  selectServiceActionStatus,
  selectServiceActionError,
} from "../../store/slice/serviceSlice";
import { addService, editService } from "../../store/thunks/serviceThunks";
import { useNavigate, useLocation } from "react-router-dom";
import {
  completeInitialSubmission,
  selectFormSubmissionRequired, // Import the selector
} from "../../store/slice/navigationSlice"; // Import the action
import ServiceSpecificDealModal from "../ServiceRequest/DetailPage/ServiceSpecificDealModal";
import SpecialDealPaymentModal from "../../components/SpecialDealPaymentModal";
import RequestTypeChoiceModal from "../ServiceRequest/RequestTypeChoiceModal";
import {
  buildCommunityOfferRequestTypeOptions,
  buildFeaturedRequestTypeOptions,
  getSpecialDealActivationFee,
  mapSelectionToSubmissionPayload,
  PROMOTION_PRICING_PROFILES,
} from "../../constants/promotions";
import { fetchPromotionSettings } from "../../store/thunks/adminPromotionThunk";

const Input = styled("input")({ display: "none" });

const FileInputBox = styled(Box)(({ theme, isDragActive, hasError }) => ({
  border: `2px dashed ${hasError ? theme.palette.error.main : theme.palette.divider
    }`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  textAlign: "center",
  cursor: "pointer",
  backgroundColor: isDragActive
    ? theme.palette.action.hover
    : theme.palette.background.default,
  transition: theme.transitions.create(["background-color", "border-color"]),
  "&:hover": { backgroundColor: theme.palette.action.hover },
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 150,
}));

const PreviewImage = styled("img")({
  maxHeight: "150px",
  maxWidth: "100%",
  marginTop: "10px",
  borderRadius: "4px",
  objectFit: "contain",
});

const experienceLevelOptions = [
  { value: "entry", label: "Entry-Level / Trainee (0-1 yrs)" },
  { value: "junior", label: "Junior / Associate (1-3 yrs)" },
  { value: "mid-level", label: "Mid-Level / Skilled (3-5 yrs)" },
  { value: "senior", label: "Senior / Supervisor (5-8 yrs)" },
  { value: "manager", label: "Manager / Expert (8-12 yrs)" },
  { value: "director", label: "Director / Executive (12+ yrs)" },
];

const AddService = ({ initialData, isEdit }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isCommunityOffersFlow = Boolean(
    location.state?.fromCommunityOffers || location.state?.isCommunity || initialData?.isCommunity
  );
  const isSpecialDealFlow =
    Boolean(location.state?.isSpecialDeal) && !isCommunityOffersFlow;
  const actionStatus = useSelector(selectServiceActionStatus);
  const serviceApiActionError = useSelector(selectServiceActionError);
  const promotionSettings = useSelector((state) => state.adminPromotion.settings);
  const formSubmissionRequired = useSelector(selectFormSubmissionRequired); // Select from navigation slice
  const featuredRequestTypeOptions = React.useMemo(
    () => buildFeaturedRequestTypeOptions(promotionSettings),
    [promotionSettings],
  );
  const specialDealActivationFee = React.useMemo(
    () => getSpecialDealActivationFee(promotionSettings),
    [promotionSettings],
  );
  const communityRequestTypeOptions = React.useMemo(
    () => buildCommunityOfferRequestTypeOptions(promotionSettings),
    [promotionSettings],
  );
  const requestTypeOptions = isCommunityOffersFlow
    ? communityRequestTypeOptions
    : featuredRequestTypeOptions;

  const parseSafeArray = (data) => {
    if (Array.isArray(data)) return data;
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        // If it's just a comma-separated string or a single string, handle it elsewhere or return as-is
        return [];
      }
    }
    return [];
  };

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [price, setPrice] = useState(initialData?.price || "");
  const [priceType, setPriceType] = useState(
    initialData?.priceType || "per project"
  );
  const [type, setType] = useState(initialData?.type || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [subcategory, setSubcategory] = useState(
    initialData?.subcategory || ""
  );

  const [locations, setLocations] = useState(() => {
    const rawLocations = initialData?.locations;
    if (Array.isArray(rawLocations)) return rawLocations.join(", ");
    if (typeof rawLocations === "string") {
      try {
        const parsed = JSON.parse(rawLocations);
        if (Array.isArray(parsed)) return parsed.join(", ");
      } catch (e) {
        return rawLocations;
      }
      return rawLocations;
    }
    return "";
  });

  const [travelFee, setTravelFee] = useState(
    initialData?.travelFee?.toString() || ""
  );

  const [coreSkills, setCoreSkills] = useState(() =>
    parseSafeArray(initialData?.coreSkills)
  );
  const [keyDeliverables, setKeyDeliverables] = useState(() =>
    parseSafeArray(initialData?.keyDeliverables)
  );
  const [experienceLevel, setExperienceLevel] = useState(
    initialData?.experienceLevel || ""
  );

  const [tags, setTags] = useState(() => parseSafeArray(initialData?.tags));
  const [tagInput, setTagInput] = useState("");
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(
    initialData?.media?.[0]
      ? initialData.media[0].startsWith("http")
        ? initialData.media[0]
        : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/${initialData.media[0]}`
      : null
  );

  const [availabilityType, setAvailabilityType] = useState(initialData?.availabilityType || "flexible");
  const [availabilityInfo, setAvailabilityInfo] = useState(initialData?.availabilityInfo || "");
  const [availableTimeSlots, setAvailableTimeSlots] = useState(
    initialData?.availableTimeSlots || [
      { dayOfWeek: 1, startTime: "09:00 AM", endTime: "05:00 PM" },
    ]
  );

  const [categoriesData, setCategoriesData] = useState([]);
  const [subcategoriesData, setSubcategoriesData] = useState([]);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isDragActive, setIsDragActive] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [listAsSpecialDeal, setListAsSpecialDeal] = useState(isSpecialDealFlow);
  const isSpecialDealSelected = listAsSpecialDeal || isSpecialDealFlow;
  const [shouldNavigateAfterSuccess, setShouldNavigateAfterSuccess] =
    useState(false);
  const [communityFee, setCommunityFee] = useState(0);
  const [createdServiceId, setCreatedServiceId] = useState(null);
  const [isSpecificDealModalOpen, setIsSpecificDealModalOpen] = useState(false);
  const [isSpecificDealPaymentModalOpen, setIsSpecificDealPaymentModalOpen] =
    useState(false);
  const [pendingSpecificDealPayload, setPendingSpecificDealPayload] =
    useState(null);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [selectedPlanPrice, setSelectedPlanPrice] = useState(0);
  const isTransitioningToPaymentRef = useRef(false);
  const didSubmitSpecialDealPaymentRef = useRef(false);
  const pendingServiceFormDataRef = useRef(null);
  const resolvedSpecialDealActualPrice =
    Number(price) > 0 ? Number(price).toString() : "";

  const isCategoryRequired = true;

  useEffect(() => {
    dispatch(clearServiceActionState());
    window.scrollTo(0, 0);
    return () => {
      dispatch(clearServiceActionState());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!promotionSettings) {
      dispatch(fetchPromotionSettings());
    }
  }, [dispatch, promotionSettings]);

  useEffect(() => {
    if (type) {
      if (isCommunityOffersFlow) {
        setCategoriesData(communityCategories.map((c) => c.name));
      } else {
        setCategoriesData(categoryOptions[type] || []);
      }
      if (formErrors.category)
        setFormErrors((prev) => ({ ...prev, category: null }));
      const validOptions = isCommunityOffersFlow
        ? communityCategories.map((c) => c.name)
        : categoryOptions[type] || [];

      if (
        category &&
        !validOptions.some((opt) => opt.value === category || opt === category)
      ) {
        // Handle object or string options
        setCategory("");
        setSubcategory("");
      }
    } else {
      setCategoriesData([]);
      setCategory("");
      setSubcategory("");
    }
  }, [type, category, formErrors.category]);

  useEffect(() => {
    if (category) {
      if (isCommunityOffersFlow) {
        setSubcategoriesData(communitySubcategoryOptions[category] || []);
      } else {
        setSubcategoriesData(subcategoryOptions[category] || []);
      }
      const validSubOptions = isCommunityOffersFlow
        ? communitySubcategoryOptions[category] || []
        : subcategoryOptions[category] || [];

      if (
        subcategory &&
        !validSubOptions.some(
          (opt) => opt.value === subcategory || opt === subcategory,
        )
      ) {
        setSubcategory("");
      }
    } else {
      setSubcategoriesData([]);
      setSubcategory("");
    }
  }, [category, subcategory]);

  // Effect to handle navigation after successful submission and state update
  useEffect(() => {
    if (
      actionStatus === "succeeded" &&
      shouldNavigateAfterSuccess &&
      !formSubmissionRequired
    ) {
      const timer = setTimeout(() => {
        navigate(isCommunityOffersFlow ? "/community-offers/categories" : "/services"); // Navigate to a safe page after submission
        dispatch(clearServiceActionState()); // Clear state after navigation
      }, 500); // Small delay to ensure state propagation
      return () => clearTimeout(timer);
    }
  }, [
    actionStatus,
    shouldNavigateAfterSuccess,
    formSubmissionRequired,
    navigate,
    dispatch,
  ]);

  useEffect(() => {
    if (!media) {
      setMediaPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(media);
    setMediaPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [media]);

  useEffect(() => {
    if (isSpecialDealFlow) {
      setListAsSpecialDeal(true);
    }
  }, [isSpecialDealFlow]);

  const validateForm = () => {
    const errors = {};
    if (!title.trim()) errors.title = "Title is required";
    else if (title.trim().length < 5 || title.trim().length > 100)
      errors.title = "Title must be 5-100 characters";
    if (!description.trim()) errors.description = "Description is required";
    else if (description.trim().length < 20 || description.trim().length > 1000)
      errors.description = "Description must be 20-1000 characters";
    if (price === "" || isNaN(parseFloat(price)) || parseFloat(price) < 0)
      errors.price = "Valid price (>=0) is required";
    if (!type) errors.type = "Service delivery type is required";
    if (isCategoryRequired && !category)
      errors.category = "Category is required";
    if (
      type === "on-site" &&
      (!locations.trim() ||
        locations
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean).length === 0)
    )
      errors.locations =
        "At least one location is required for on-site services.";
    if (
      travelFee !== "" &&
      (isNaN(parseFloat(travelFee)) || parseFloat(travelFee) < 0)
    )
      errors.travelFee =
        "Travel fee must be a valid non-negative number if provided";

    if (!experienceLevel)
      errors.experienceLevel = "Experience level offered is required.";
    if (coreSkills.length === 0)
      errors.coreSkills = "At least one core skill is required.";
    else if (coreSkills.length > 10)
      errors.coreSkills = "Maximum of 10 core skills allowed.";
    if (keyDeliverables.length === 0)
      errors.keyDeliverables = "At least one key deliverable is required.";
    else if (keyDeliverables.length > 10)
      errors.keyDeliverables = "Maximum of 10 key deliverables allowed.";

    if (!availabilityType)
      errors.availabilityType = "Availability type is required.";
    if (availabilityType === "scheduled_slots") {
      if (!availableTimeSlots || availableTimeSlots.length === 0) {
        errors.availableTimeSlots =
          "At least one time slot is required for 'Scheduled Slots'.";
      } else {
        availableTimeSlots.forEach((slot, index) => {
          const timeRegex = /^(0?[1-9]|1[0-2]):[0-5]\d\s(AM|PM)$/i;
          let startTimeValid = false;
          let endTimeValid = false;
          if (!slot.startTime || !timeRegex.test(slot.startTime)) {
            errors[`slot_format_${index}`] = `Slot ${index + 1
              }: Start time required in hh:mm AM/PM format.`;
          } else startTimeValid = true;
          if (!slot.endTime || !timeRegex.test(slot.endTime)) {
            const existingError = errors[`slot_format_${index}`]
              ? errors[`slot_format_${index}`] + " "
              : `Slot ${index + 1}: `;
            errors[`slot_format_${index}`] =
              existingError + `End time required in hh:mm AM/PM format.`;
          } else endTimeValid = true;
          if (startTimeValid && endTimeValid) {
            const baseDateStr = "2000/01/01";
            const startDate = parse(
              `${baseDateStr} ${slot.startTime}`,
              "yyyy/MM/dd hh:mm a",
              new Date(),
            );
            const endDate = parse(
              `${baseDateStr} ${slot.endTime}`,
              "yyyy/MM/dd hh:mm a",
              new Date(),
            );
            if (
              !isValidDate(startDate) ||
              !isValidDate(endDate) ||
              startDate >= endDate
            ) {
              errors[`slot_time_${index}`] = `Slot ${index + 1
                }: End time must be after start time.`;
            }
          }
        });
      }
    } else if (
      (availabilityType === "flexible" || availabilityType === "date_range") &&
      !availabilityInfo.trim()
    ) {
      errors.availabilityInfo =
        "Please provide general availability information for this type.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    clearError(name);
    if (name === "title") setTitle(value);
    else if (name === "description") setDescription(value);
    else if (name === "price") setPrice(value);
    else if (name === "priceType") setPriceType(value);
    else if (name === "type") {
      setType(value);
      setCategory("");
      setSubcategory("");
    } else if (name === "category") {
      setCategory(value);
      setSubcategory("");
    } else if (name === "subcategory") setSubcategory(value);
    else if (name === "locations") setLocations(value);
    else if (name === "travelFee") setTravelFee(value);
    else if (name === "availabilityType") setAvailabilityType(value);
    else if (name === "availabilityInfo") setAvailabilityInfo(value);
    else if (name === "experienceLevel") setExperienceLevel(value);
  };

  const handleAddTag = () => {
    const trimmedInput = tagInput.trim().toLowerCase();
    if (
      trimmedInput &&
      !tags.map((t) => t.toLowerCase()).includes(trimmedInput) &&
      tags.length < 10
    ) {
      setTags([...tags, trimmedInput]);
      setTagInput("");
    } else if (tags.length >= 10) {
      setNotification({
        open: true,
        message: "Maximum of 10 tags allowed.",
        severity: "warning",
      });
    } else if (tags.map((t) => t.toLowerCase()).includes(trimmedInput)) {
      setNotification({
        open: true,
        message: "Tag already added.",
        severity: "info",
      });
    }
  };
  const handleRemoveTag = (tagToRemove) =>
    setTags(tags.filter((tag) => tag !== tagToRemove));

  const onFileSelect = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors((prev) => ({
          ...prev,
          media: "Image file size should not exceed 5MB.",
        }));
        setMedia(null);
        setMediaPreview(null);
      } else if (!file.type.startsWith("image/")) {
        setFormErrors((prev) => ({
          ...prev,
          media:
            "Please select a valid image file (e.g., JPG, PNG, GIF, WebP).",
        }));
        setMedia(null);
        setMediaPreview(null);
      } else {
        setMedia(file);
        clearError("media");
      }
    }
    event.target.value = null;
  };

  const handleDragEvents = {
    onDragEnter: useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(true);
    }, []),
    onDragLeave: useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
    }, []),
    onDragOver: useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(true);
    }, []),
    onDrop: useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.size > 5 * 1024 * 1024) {
          setFormErrors((prev) => ({
            ...prev,
            media: "Dropped image exceeds 5MB limit.",
          }));
        } else if (!file.type.startsWith("image/")) {
          setFormErrors((prev) => ({
            ...prev,
            media: "Dropped file is not a valid image type.",
          }));
        } else {
          setMedia(file);
          clearError("media");
        }
      }
    }, []),
  };

  const handleRemoveMedia = (e) => {
    e.stopPropagation();
    setMedia(null);
    setMediaPreview(null);
  };
  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setNotification({ ...notification, open: false });
  };
  const clearError = (fieldName) => {
    if (formErrors[fieldName])
      setFormErrors((prev) => ({ ...prev, [fieldName]: null }));
  };

  const handleTimeSlotChange = (index, field, value) => {
    const newSlots = availableTimeSlots.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot,
    );
    setAvailableTimeSlots(newSlots);
    clearError("availableTimeSlots");
    clearError(`slot_time_${index}`);
    clearError(`slot_format_${index}`);
  };

  const addTimeSlot = () => {
    if (availableTimeSlots.length < 10) {
      setAvailableTimeSlots([
        ...availableTimeSlots,
        { dayOfWeek: 1, startTime: "09:00 AM", endTime: "05:00 PM" },
      ]);
    } else {
      setNotification({
        open: true,
        message: "Maximum of 10 time slots allowed.",
        severity: "warning",
      });
    }
  };

  const removeTimeSlot = (index) => {
    if (availableTimeSlots.length > 1)
      setAvailableTimeSlots(availableTimeSlots.filter((_, i) => i !== index));
    else
      setNotification({
        open: true,
        message: "At least one time slot is required for 'Scheduled Slots'.",
        severity: "warning",
      });
  };

  const handleCloseSpecificDealModal = useCallback(() => {
    setIsSpecificDealModalOpen(false);

    // When closing because user clicked Pay inside the first modal,
    // do not treat it like a cancel action.
    if (isTransitioningToPaymentRef.current) {
      isTransitioningToPaymentRef.current = false;
      return;
    }

    if (!pendingSpecificDealPayload) {
      pendingServiceFormDataRef.current = null;
      setNotification({
        open: true,
        message: "Service was not created because payment flow was cancelled.",
        severity: "info",
      });
    }
  }, [pendingSpecificDealPayload]);

  const handleCloseSpecificDealPaymentModal = useCallback(() => {
    setIsSpecificDealPaymentModalOpen(false);
    setPendingSpecificDealPayload(null);

    if (!didSubmitSpecialDealPaymentRef.current) {
      pendingServiceFormDataRef.current = null;
      setNotification({
        open: true,
        message: "Service was not created because payment was not completed.",
        severity: "info",
      });
    }

    didSubmitSpecialDealPaymentRef.current = false;
  }, []);

  const handleListServiceSpecificDealPay = useCallback(async (dealPayload) => {
    isTransitioningToPaymentRef.current = true;
    setPendingSpecificDealPayload(dealPayload);
    didSubmitSpecialDealPaymentRef.current = false;
    // Open payment modal after deal form closes to avoid modal overlap.
    setTimeout(() => {
      setIsSpecificDealPaymentModalOpen(true);
    }, 0);
  }, []);

  const totalPaymentAmount = selectedPlanPrice + (isSpecialDealSelected ? specialDealActivationFee : 0);

  const handleSpecificDealPaymentConfirm = useCallback(
    async ({ paymentData, dealPayload }) => {
      const pendingServiceFormData = pendingServiceFormDataRef.current;

      if (!pendingServiceFormData) {
        throw new Error(
          "Service form data is missing. Please fill the form again.",
        );
      }

      if (isSpecialDealSelected) {
        const normalizedActualPrice = Number(dealPayload?.actualPrice);
        const normalizedSellingPrice = Number(dealPayload?.sellingPrice);
        const normalizedSpecialDescription = String(
          dealPayload?.specialDescription ?? dealPayload?.description ?? "",
        ).trim();
        const normalizedSpecialDuration = Number(dealPayload?.specialDealDuration);

        if (
          !Number.isFinite(normalizedActualPrice) ||
          normalizedActualPrice <= 0
        ) {
          throw new Error(
            "Actual price is invalid. Please review special deal details.",
          );
        }

        if (
          !Number.isFinite(normalizedSellingPrice) ||
          normalizedSellingPrice <= 0
        ) {
          throw new Error(
            "Selling price is invalid. Please review special deal details.",
          );
        }

        if (normalizedSellingPrice >= normalizedActualPrice) {
          throw new Error(
            "Selling price should be lower than actual price for special deals.",
          );
        }

        if (!normalizedSpecialDescription) {
          throw new Error("Special description is required.");
        }

        if (!Number.isFinite(normalizedSpecialDuration) || normalizedSpecialDuration <= 0) {
          throw new Error("Special deal duration is invalid.");
        }

        pendingServiceFormData.set("isSpecial", "true");
        pendingServiceFormData.set(
          "actualPrice",
          String(normalizedActualPrice),
        );
        pendingServiceFormData.set(
          "sellingPrice",
          String(normalizedSellingPrice),
        );
        pendingServiceFormData.set(
          "specialDescription",
          normalizedSpecialDescription,
        );
        pendingServiceFormData.set(
          "specialDealDuration",
          String(normalizedSpecialDuration),
        );
      }

      if (!paymentData?.sourceId) {
        throw new Error(
          "Payment token is missing. Please re-enter your card details.",
        );
      }

      pendingServiceFormData.set("specialOfferSourceId", paymentData.sourceId);

      // Final unified submission
      const createdService = await dispatch(
        addService(pendingServiceFormData),
      ).unwrap();
      const createdId = createdService?._id || createdService?.service?._id;
      setCreatedServiceId(createdId || null);
      dispatch(completeInitialSubmission());

      const finalPayload = {
        isSpecial: isSpecialDealSelected,
        specialOfferSourceId: paymentData.sourceId,
        paymentData,
        serviceId: createdId || null,
        ...(isSpecialDealSelected && {
          actualPrice: Number(dealPayload?.actualPrice),
          sellingPrice: Number(dealPayload?.sellingPrice),
          specialDescription: String(
            dealPayload?.specialDescription ?? dealPayload?.description ?? "",
          ).trim(),
          specialDealDuration: Number(dealPayload?.specialDealDuration),
        }),
      };

      // Hook for future API integration.
      console.log("Create service special deal payment payload:", finalPayload);

      didSubmitSpecialDealPaymentRef.current = true;
      pendingServiceFormDataRef.current = null;
      setNotification({
        open: true,
        message: "Special deal payment submitted successfully! Redirecting...",
        severity: "success",
      });
      setShouldNavigateAfterSuccess(true);
    },
    [dispatch, isSpecialDealSelected, isCommunityOffersFlow],
  );

  const handleRequestTypeChosen = async (chosenRequestType) => {
    setIsTypeModalOpen(false);
    const serviceFormData = pendingServiceFormDataRef.current;
    if (!serviceFormData) {
      setNotification({
        open: true,
        message: "No staged service data found.",
        severity: "error",
      });
      return;
    }

    const submissionPayload =
      mapSelectionToSubmissionPayload(chosenRequestType);

    const selectedOption = requestTypeOptions.find(
      (opt) => opt.value === chosenRequestType,
    );
    const feeUsd = selectedOption?.price ?? selectedOption?.feeUsd ?? 0;
    setCommunityFee(feeUsd);

    serviceFormData.set("requestType", submissionPayload.requestType);
    if (submissionPayload.promotionDurationMonths) {
      serviceFormData.set(
        "durationMonths",
        String(submissionPayload.promotionDurationMonths),
      );
      // Fallback
      serviceFormData.set(
        "promotionDurationMonths",
        String(submissionPayload.promotionDurationMonths),
      );
    } else {
      serviceFormData.delete("durationMonths");
      serviceFormData.delete("promotionDurationMonths");
    }

    if (isCommunityOffersFlow) {
      serviceFormData.set(
        "promotionPricingProfile",
        PROMOTION_PRICING_PROFILES.COMMUNITY_OFFERS,
      );
      serviceFormData.set("fromCommunityOffers", "true");
      serviceFormData.set("isCommunity", "true");
    }

    const chosenPlan = requestTypeOptions.find(
      (opt) => opt.value === chosenRequestType,
    );
    const planPrice = chosenPlan?.price || 0;
    setSelectedPlanPrice(planPrice);

    // If it's a special deal, transition to the deal details modal instead of submitting here.
    if (isSpecialDealSelected) {
      setNotification({
        open: true,
        message: "Plan selected. Now fill special deal details.",
        severity: "info",
      });
      setTimeout(() => {
        setIsSpecificDealModalOpen(true);
      }, 300);
      return;
    }

    // If no special deal, but a paid plan is selected, transition to payment directly.
    if (planPrice > 0) {
      setNotification({
        open: true,
        message: "Plan selected. Please complete payment to activate.",
        severity: "info",
      });
      setTimeout(() => {
        setIsSpecificDealPaymentModalOpen(true);
      }, 300);
      return;
    }

    try {
      const result = await dispatch(addService(serviceFormData)).unwrap();
      const createdId = result?._id || result?.service?._id;
      setCreatedServiceId(createdId || null);
      dispatch(completeInitialSubmission());

      if (
        result.paymentRequired &&
        result.clientSecret &&
        result.promotionOrder?._id
      ) {
        setNotification({
          open: true,
          message: "Please complete payment to promote your service.",
          severity: "info",
        });

        // Use location state or a redirection to handle promotion payment if the endpoint supports it.
        // For now, if AddService doesn't have a dedicated promotion payment page,
        // we might need to navigate to one or show another modal.
        // Assuming the backend returns enough info for a redirect if needed.
        if (result.paymentUrl) {
          window.location.href = result.paymentUrl;
        } else {
          navigate(isCommunityOffersFlow ? "/community-offers/categories" : "/user/my-services");
        }
      } else {
        setNotification({
          open: true,
          message: "Service added successfully! Redirecting...",
          severity: "success",
        });
        setShouldNavigateAfterSuccess(true);
      }
    } catch (error) {
      setNotification({
        open: true,
        message: error?.message || "Failed to add service.",
        severity: "error",
      });
    } finally {
      pendingServiceFormDataRef.current = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (actionStatus === "loading") return;
    if (actionStatus === "failed" && serviceApiActionError) {
      dispatch(clearServiceActionState());
    }
    if (!validateForm()) {
      setNotification({
        open: true,
        message: "Please correct the form errors and try again.",
        severity: "error",
      });
      const firstErrorKey = Object.keys(formErrors).find(
        (key) => formErrors[key],
      );
      if (firstErrorKey) {
        const errorElement =
          document.getElementsByName(firstErrorKey)[0] ||
          document.getElementById(firstErrorKey);
        if (errorElement) errorElement.focus({ preventScroll: true }); // Focus without harsh scroll
        // Or scroll into view smoothly
        // if (errorElement) errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const serviceFormData = new FormData();
    serviceFormData.append("title", title.trim());
    serviceFormData.append("description", description.trim());
    serviceFormData.append("price", parseFloat(price));
    serviceFormData.append("priceType", priceType);
    serviceFormData.append("type", type);
    serviceFormData.append("category", category); // Controller requires category
    if (subcategory) serviceFormData.append("subcategory", subcategory);

    serviceFormData.append("coreSkills", JSON.stringify(coreSkills));
    serviceFormData.append("keyDeliverables", JSON.stringify(keyDeliverables));
    serviceFormData.append("experienceLevel", experienceLevel);

    const processedLocations = locations
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    serviceFormData.append("locations", JSON.stringify(processedLocations));

    if (type === "on-site" && travelFee.trim() !== "") {
      serviceFormData.append("travelFee", parseFloat(travelFee) || 0);
    } else if (type === "on-site") {
      serviceFormData.append("travelFee", 0);
    }

    serviceFormData.append("tags", JSON.stringify(tags));
    if (media) serviceFormData.append("media", media, media.name);
    serviceFormData.append("availabilityType", availabilityType);
    if (
      availabilityInfo.trim() &&
      (availabilityType === "flexible" || availabilityType === "date_range")
    ) {
      serviceFormData.append("availabilityInfo", availabilityInfo.trim());
    }
    if (
      availabilityType === "scheduled_slots" &&
      availableTimeSlots.length > 0
    ) {
      serviceFormData.append(
        "availableTimeSlots",
        JSON.stringify(availableTimeSlots),
      );
    }
    if (isCommunityOffersFlow) {
      serviceFormData.append("isCommunity", "true");
    }
    serviceFormData.append("listAsSpecialDeal", String(isSpecialDealSelected));

    // The controller defaults status to 'active', so no need to send it unless you want to allow 'draft' from frontend.
    setShouldNavigateAfterSuccess(false);
    setCreatedServiceId(null);
    setIsSpecificDealModalOpen(false);
    setIsSpecificDealPaymentModalOpen(false);
    setPendingSpecificDealPayload(null);
    isTransitioningToPaymentRef.current = false;
    didSubmitSpecialDealPaymentRef.current = false;
    pendingServiceFormDataRef.current = null;

    // Priority 1: Community Flow (Plan Selection)
    if (!isEdit && isCommunityOffersFlow) {
      pendingServiceFormDataRef.current = serviceFormData;
      setIsTypeModalOpen(true);
      return;
    }

    // Priority 2: Standalone Special Deal Flow
    if (!isEdit && isSpecialDealSelected) {
      pendingServiceFormDataRef.current = serviceFormData;
      setNotification({
        open: true,
        message: "Complete payment to create this service as a special deal.",
        severity: "info",
      });
      setIsSpecificDealModalOpen(true);
      return;
    }

    try {
      let result;
      if (isEdit) {
        result = await dispatch(
          editService({
            id: initialData._id,
            data: serviceFormData,
          })
        ).unwrap();
      } else {
        result = await dispatch(
          addService(serviceFormData),
        ).unwrap();
      }

      const createdId = result?._id || result?.service?._id;

      setCreatedServiceId(createdId || null);
      if (!isEdit) dispatch(completeInitialSubmission());

      setNotification({
        open: true,
        message: isEdit ? "Service updated successfully! Redirecting..." : "Service added successfully! Redirecting...",
        severity: "success",
      });
      setShouldNavigateAfterSuccess(true);
    } catch (error) {
      setNotification({
        open: true,
        message:
          error?.message ||
          serviceApiActionError ||
          "Failed to add service. Please check the form for errors.",
        severity: "error",
      });
    }
  };

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1" fontWeight="bold">
          {" "}
          {isEdit ? "Edit Service" : "Create New Service"}{" "}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          {" "}
          Back{" "}
        </Button>
      </Box>
      <Paper
        elevation={3}
        sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: "12px" }}
      >
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Service Title"
                name="title"
                value={title}
                onChange={handleInputChange}
                error={!!formErrors.title}
                helperText={formErrors.title}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Service Description"
                name="description"
                multiline
                rows={4}
                value={description}
                onChange={handleInputChange}
                error={!!formErrors.description}
                helperText={formErrors.description}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Minimum Price (USD)"
                name="price"
                type="number"
                value={price}
                onChange={handleInputChange}
                error={!!formErrors.price}
                helperText={formErrors.price}
                InputProps={{ inputProps: { min: 0, step: "0.01" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Price Type</InputLabel>
                <Select
                  name="priceType"
                  value={priceType}
                  label="Price Type"
                  onChange={handleInputChange}
                >
                  <MenuItem value="per project">Per Project</MenuItem>
                  <MenuItem value="per hour">Per Hour</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required error={!!formErrors.type}>
                <InputLabel>Service Delivery Type</InputLabel>
                <Select
                  name="type"
                  value={type}
                  label="Service Delivery Type"
                  onChange={handleInputChange}
                >
                  <MenuItem value="" disabled>
                    <em>Select...</em>
                  </MenuItem>
                  <MenuItem value="on-site">On-Site</MenuItem>
                  <MenuItem value="remote">Remote</MenuItem>
                  <MenuItem value="other">Other (Specify in Desc.)</MenuItem>
                </Select>
                {formErrors.type && (
                  <FormHelperText error>{formErrors.type}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl
                fullWidth
                required={isCategoryRequired}
                disabled={!type || categoriesData.length === 0}
                error={!!formErrors.category}
              >
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={category}
                  label={`Category${isCategoryRequired ? " *" : ""}`}
                  onChange={handleInputChange}
                >
                  <MenuItem value="" disabled>
                    <em>Select...</em>
                  </MenuItem>
                  {categoriesData.map((catOpt) =>
                    typeof catOpt === "string" ? (
                      <MenuItem key={catOpt} value={catOpt}>
                        {catOpt}
                      </MenuItem>
                    ) : (
                      <MenuItem key={catOpt.value} value={catOpt.value}>
                        {catOpt.label}
                      </MenuItem>
                    ),
                  )}
                </Select>
                {formErrors.category && (
                  <FormHelperText error>{formErrors.category}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl
                fullWidth
                disabled={!category || subcategoriesData.length === 0}
              >
                <InputLabel>Subcategory</InputLabel>
                <Select
                  name="subcategory"
                  value={subcategory}
                  label="Subcategory"
                  onChange={handleInputChange}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {subcategoriesData.map((subcatOpt) =>
                    typeof subcatOpt === "string" ? (
                      <MenuItem key={subcatOpt} value={subcatOpt}>
                        {subcatOpt}
                      </MenuItem>
                    ) : (
                      <MenuItem key={subcatOpt.value} value={subcatOpt.value}>
                        {subcatOpt.label}
                      </MenuItem>
                    ),
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              {" "}
              <MuiDivider sx={{ my: 1 }}>
                <Chip label="Service Specifics" size="small" />
              </MuiDivider>{" "}
            </Grid>

            <Grid item xs={12}>
              <FormControl
                fullWidth
                required
                error={!!formErrors.experienceLevel}
              >
                <InputLabel id="experience-level-label">
                  Experience Level Offered*
                </InputLabel>
                <Select
                  labelId="experience-level-label"
                  name="experienceLevel"
                  value={experienceLevel}
                  label="Experience Level Offered*"
                  onChange={handleInputChange}
                >
                  <MenuItem value="" disabled>
                    <em>Select...</em>
                  </MenuItem>
                  {experienceLevelOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.experienceLevel && (
                  <FormHelperText error>
                    {formErrors.experienceLevel}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}></Grid>

            <Grid item xs={12}>
              <Autocomplete
                multiple
                id="core-skills-autocomplete"
                options={[]}
                value={coreSkills}
                onChange={(event, newValue) => {
                  setCoreSkills(newValue.slice(0, 10));
                  clearError("coreSkills");
                }}
                freeSolo
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...tagProps}
                        key={option + index}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Core Skills Offered*"
                    placeholder="Type skill and press Enter"
                    error={!!formErrors.coreSkills}
                    helperText={
                      formErrors.coreSkills ||
                      "List up to 10 primary skills for this service."
                    }
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                multiple
                id="key-deliverables-autocomplete"
                options={[]}
                value={keyDeliverables}
                onChange={(event, newValue) => {
                  setKeyDeliverables(newValue.slice(0, 10));
                  clearError("keyDeliverables");
                }}
                freeSolo
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...tagProps}
                        key={option + index}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Key Deliverables*"
                    placeholder="What will the client receive? Press Enter after each."
                    error={!!formErrors.keyDeliverables}
                    helperText={
                      formErrors.keyDeliverables ||
                      "List up to 10 key things the client will get."
                    }
                  />
                )}
              />
            </Grid>

            {type === "on-site" && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Service Locations (Comma-Separated)"
                    name="locations"
                    value={locations}
                    onChange={handleInputChange}
                    error={!!formErrors.locations}
                    helperText={
                      formErrors.locations || "e.g., New York, San Francisco"
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Travel Fee (USD, Optional)"
                    name="travelFee"
                    type="number"
                    value={travelFee}
                    onChange={handleInputChange}
                    error={!!formErrors.travelFee}
                    helperText={formErrors.travelFee}
                    InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              {" "}
              <MuiDivider sx={{ my: 1 }}>
                <Chip
                  label="Availability Setup"
                  size="small"
                  sx={{ fontSize: "0.9rem" }}
                />
              </MuiDivider>{" "}
            </Grid>
            <Grid item xs={12}>
              <FormControl
                component="fieldset"
                fullWidth
                error={!!formErrors.availabilityType}
              >
                <FormLabel
                  component="legend"
                  sx={{ mb: 0.5, fontSize: "0.9rem", color: "text.secondary" }}
                >
                  {" "}
                  Service Availability*{" "}
                </FormLabel>
                <RadioGroup
                  row
                  name="availabilityType"
                  value={availabilityType}
                  onChange={handleInputChange}
                >
                  <MuiFormControlLabel
                    value="flexible"
                    control={<Radio size="small" />}
                    label="Flexible (Describe General Info)"
                  />
                  <MuiFormControlLabel
                    value="scheduled_slots"
                    control={<Radio size="small" />}
                    label="Specific Weekly Slots"
                  />
                  {/* Add "date_range" if you implement it */}
                </RadioGroup>
                {formErrors.availabilityType && (
                  <FormHelperText error>
                    {" "}
                    {formErrors.availabilityType}{" "}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            {(availabilityType === "flexible" ||
              availabilityType === "date_range") && (
                <Grid item xs={12}>
                  <TextField
                    label={
                      availabilityType === "flexible"
                        ? "General Availability Information*"
                        : "Availability Notes*"
                    }
                    name="availabilityInfo"
                    placeholder="e.g., Mon-Fri evenings, 9 AM - 1 PM on Weekends. Available from June 1st."
                    fullWidth
                    margin="none"
                    value={availabilityInfo}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                    required={
                      availabilityType === "flexible" ||
                      availabilityType === "date_range"
                    }
                    error={!!formErrors.availabilityInfo}
                    helperText={
                      formErrors.availabilityInfo ||
                      "Provide clear text information for buyers."
                    }
                  />
                </Grid>
              )}

            {availabilityType === "scheduled_slots" && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {" "}
                  Define Weekly Recurring Time Slots:*{" "}
                </Typography>
                {formErrors.availableTimeSlots && (
                  <Alert severity="error" sx={{ mb: 1.5 }}>
                    {" "}
                    {formErrors.availableTimeSlots}{" "}
                  </Alert>
                )}
                <List
                  disablePadding
                  sx={{
                    maxHeight: 300,
                    overflow: "auto",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    p: 1,
                    bgcolor: "background.default",
                  }}
                >
                  {availableTimeSlots.map((slot, index) => (
                    <ListItem
                      key={index}
                      disablePadding
                      sx={{
                        mb: 1.5,
                        p: 1.5,
                        border: "1px solid",
                        borderColor:
                          formErrors[`slot_time_${index}`] ||
                            formErrors[`slot_format_${index}`]
                            ? "error.light"
                            : "action.disabledBackground",
                        borderRadius: 1,
                      }}
                    >
                      <Grid container spacing={1} alignItems="center">
                        <Grid item xs={12} sm={3.5}>
                          <FormControl
                            fullWidth
                            size="small"
                            error={
                              !!formErrors[`slot_time_${index}`] ||
                              !!formErrors[`slot_format_${index}`]
                            }
                          >
                            <InputLabel shrink>Day*</InputLabel>
                            <Select
                              native
                              value={slot.dayOfWeek}
                              label="Day*"
                              onChange={(e) =>
                                handleTimeSlotChange(
                                  index,
                                  "dayOfWeek",
                                  parseInt(e.target.value),
                                )
                              }
                            >
                              {daysOfWeek.map((day, i) => (
                                <option key={i} value={i}>
                                  {" "}
                                  {day}{" "}
                                </option>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={5.5} sm={3.5}>
                          <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <TimePicker
                              label="Start Time*"
                              ampm={true}
                              value={
                                slot.startTime &&
                                  isValidDate(
                                    parse(slot.startTime, "hh:mm a", new Date()),
                                  )
                                  ? parse(slot.startTime, "hh:mm a", new Date())
                                  : null
                              }
                              onChange={(newValue) =>
                                handleTimeSlotChange(
                                  index,
                                  "startTime",
                                  newValue && isValidDate(newValue)
                                    ? format(newValue, "hh:mm a")
                                    : "",
                                )
                              }
                              slotProps={{
                                textField: {
                                  size: "small",
                                  fullWidth: true,
                                  error:
                                    !!formErrors[`slot_time_${index}`] ||
                                    !!formErrors[`slot_format_${index}`],
                                  helperText:
                                    (formErrors[`slot_time_${index}`] ||
                                      formErrors[`slot_format_${index}`]) &&
                                    " ",
                                },
                              }}
                            />
                          </LocalizationProvider>
                        </Grid>
                        <Grid item xs={5.5} sm={3.5}>
                          <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <TimePicker
                              label="End Time*"
                              ampm={true}
                              value={
                                slot.endTime &&
                                  isValidDate(
                                    parse(slot.endTime, "hh:mm a", new Date()),
                                  )
                                  ? parse(slot.endTime, "hh:mm a", new Date())
                                  : null
                              }
                              onChange={(newValue) =>
                                handleTimeSlotChange(
                                  index,
                                  "endTime",
                                  newValue && isValidDate(newValue)
                                    ? format(newValue, "hh:mm a")
                                    : "",
                                )
                              }
                              minTime={
                                slot.startTime &&
                                  isValidDate(
                                    parse(slot.startTime, "hh:mm a", new Date()),
                                  )
                                  ? parse(slot.startTime, "hh:mm a", new Date())
                                  : undefined
                              }
                              disabled={!slot.startTime}
                              slotProps={{
                                textField: {
                                  size: "small",
                                  fullWidth: true,
                                  error:
                                    !!formErrors[`slot_time_${index}`] ||
                                    !!formErrors[`slot_format_${index}`],
                                  helperText:
                                    (formErrors[`slot_time_${index}`] ||
                                      formErrors[`slot_format_${index}`]) &&
                                    " ",
                                },
                              }}
                            />
                          </LocalizationProvider>
                        </Grid>
                        <Grid item xs={1} sm={1.5} textAlign="right">
                          <IconButton
                            onClick={() => removeTimeSlot(index)}
                            size="small"
                            color="error"
                            disabled={availableTimeSlots.length <= 1}
                          >
                            <RemoveCircleOutlineIcon />
                          </IconButton>
                        </Grid>
                        {(formErrors[`slot_time_${index}`] ||
                          formErrors[`slot_format_${index}`]) && (
                            <Grid item xs={12}>
                              <FormHelperText
                                error
                                sx={{ textAlign: "left", mt: -0.5, ml: 1 }}
                              >
                                {formErrors[`slot_time_${index}`] ||
                                  formErrors[`slot_format_${index}`]}
                              </FormHelperText>
                            </Grid>
                          )}
                      </Grid>
                    </ListItem>
                  ))}
                </List>
                <Button
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={addTimeSlot}
                  size="small"
                  variant="text"
                  sx={{ mt: 1 }}
                >
                  {" "}
                  Add Time Slot{" "}
                </Button>
              </Grid>
            )}

            <Grid item xs={12}>
              {" "}
              <MuiDivider sx={{ my: 1 }}>
                <Chip
                  label="Optional Details"
                  size="small"
                  sx={{ fontSize: "0.9rem" }}
                />
              </MuiDivider>{" "}
            </Grid>
            <Grid item xs={12}>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ fontWeight: 500 }}
              >
                {" "}
                Tags (up to 10){" "}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Add Tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  disabled={tags.length >= 10}
                  helperText={tags.length >= 10 ? "Max 10 tags" : ""}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || tags.length >= 10}
                  size="medium"
                >
                  {" "}
                  Add{" "}
                </Button>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  gap: 0.5,
                  flexWrap: "wrap",
                  minHeight: "30px",
                }}
              >
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ fontWeight: 500 }}
              >
                {" "}
                Service Image{" "}
              </Typography>
              <FormControl fullWidth error={!!formErrors.media}>
                <Box
                  component="label"
                  htmlFor="file-input"
                  sx={{ width: "100%" }}
                >
                  <Input
                    accept="image/*"
                    id="file-input"
                    type="file"
                    onChange={onFileSelect}
                  />
                  <FileInputBox
                    {...handleDragEvents}
                    isDragActive={isDragActive}
                    hasError={!!formErrors.media}
                    sx={
                      mediaPreview
                        ? { padding: 1, minHeight: "auto", bgcolor: "grey.100" }
                        : {}
                    }
                  >
                    {mediaPreview ? (
                      <>
                        <PreviewImage src={mediaPreview} alt="Preview" />
                        <Button
                          variant="text"
                          color="error"
                          size="small"
                          onClick={handleRemoveMedia}
                          startIcon={<DeleteIcon />}
                          sx={{ mt: 1 }}
                        >
                          {" "}
                          Remove Image{" "}
                        </Button>
                      </>
                    ) : (
                      <>
                        <AddPhotoAlternateIcon
                          sx={{ fontSize: 40, color: "text.disabled", mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {" "}
                          Drag & drop or click to upload{" "}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {" "}
                          (Max 5MB, JPG/PNG/GIF/WebP){" "}
                        </Typography>
                      </>
                    )}
                  </FileInputBox>
                </Box>
                {formErrors.media && (
                  <FormHelperText error sx={{ ml: 2 }}>
                    {" "}
                    {formErrors.media}{" "}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid
              item
              xs={12}
              sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}
            >
              <Box
                sx={{
                  width: "100%",
                  mb: 1,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                }}
              >
                <MuiFormControlLabel
                  control={
                    <Checkbox
                      color="secondary"
                      checked={isSpecialDealSelected}
                      onChange={(event) =>
                        setListAsSpecialDeal(event.target.checked)
                      }
                      disabled={isSpecialDealFlow}
                    />
                  }
                  label="List as a special deal"
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", ml: { xs: 0, sm: 4.5 } }}
                >
                  After creating the service, you will complete special deal
                  details and activation payment.
                </Typography>
              </Box>
            </Grid>

            <Grid
              item
              xs={12}
              sx={{ display: "flex", justifyContent: "flex-end" }}
            >
              <Button
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={actionStatus === "loading"}
                startIcon={
                  actionStatus === "loading" ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : null
                }
                sx={{ py: 1.5 }}
              >
                {actionStatus === "loading"
                  ? "Creating Service..."
                  : "Create Service"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <ServiceSpecificDealModal
        open={isSpecificDealModalOpen}
        onClose={handleCloseSpecificDealModal}
        actionStatus={actionStatus}
        onPay={handleListServiceSpecificDealPay}
        initialActualPrice={resolvedSpecialDealActualPrice}
        isRequest={false}
      />

      <SpecialDealPaymentModal
        open={isSpecificDealPaymentModalOpen}
        onClose={handleCloseSpecificDealPaymentModal}
        dealPayload={pendingSpecificDealPayload}
        entityId={createdServiceId}
        idempotencyPrefix="service-create-special-deal"
        title={
          isSpecialDealSelected
            ? "Special Deal Activation"
            : "Community Promotion Payment"
        }
        subheader={
          isSpecialDealSelected
            ? "Enter your card details below to activate this special deal."
            : "Enter your card details below to activate your promotional plan."
        }
        amount={totalPaymentAmount}
        amountLabel={
          isSpecialDealSelected ? "Activation + Promotion Fee" : "Promotion Fee"
        }
        onConfirmPayment={handleSpecificDealPaymentConfirm}
      />

      <RequestTypeChoiceModal
        open={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onConfirm={handleRequestTypeChosen}
        options={requestTypeOptions}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={notification.severity || "info"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AddService;
