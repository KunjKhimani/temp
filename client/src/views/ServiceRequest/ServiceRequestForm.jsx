/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  Box,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip,
  Stack,
  CircularProgress,
  Autocomplete,
  Tooltip,
  IconButton,
  Divider,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import FileUploadComponent from "./FileUploadComponent"; // Ensure this path is correct
import {
  categories as DUMMY_CATEGORIES,
  subcategoryOptions as DUMMY_SUBCATEGORY_OPTIONS_MAP,
  communityCategories,
  communitySubcategoryOptions,
} from "../../data/categoryData"; // Ensure this path is correct

const PROMOTION_TYPES_FRONTEND = {
  STANDARD: "standard",
  PROMOTED: "promoted",
};

const experienceLevels = [
  { value: "any", label: "Any Experience Level" },
  { value: "entry", label: "Entry Level (0-2 years)" },
  { value: "intermediate", label: "Intermediate (2-5 years)" },
  { value: "expert", label: "Expert (5+ years)" },
  { value: "lead", label: "Lead/Architect (10+ years)" },
];
const scopeUnits = [
  { value: "", label: "Not Applicable / Project-Based" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "square_meters", label: "Square Meters (m²)" },
  { value: "square_feet", label: "Square Feet (ft²)" },
  { value: "other", label: "Other" },
];

const emptyAddress = {
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "USA",
  details: "",
  isPrimary: false,
};

const ServiceRequestForm = ({
  onFormSubmitIntent = () => { }, // Provide a default empty function
  initialData = {},
  isLoading = false,
  isEdit = false,
  availableProviders = [],
  currentRequestTypeForInvites = PROMOTION_TYPES_FRONTEND.STANDARD,
  showSpecialDealOption = false,
  listAsSpecialDeal = false,
  onListAsSpecialDealChange,
  isCommunityOffersFlow = false,
  disableSpecialDealOption = false,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    budgetMin: "",
    budgetMax: "",
    budgetType: "open_to_offers",
    desiredDeliveryTime: "",
    locationPreference: "remote",
    onSiteAddresses: [], // Initialize as empty, will be populated if on-site
    tags: [],
    attachments: [], // For existing file paths in edit mode
    requiredSkills: [],
    experienceLevel: "any",
    scopeUnit: "",
    scopeQuantity: "",
    scopeDetails: "",
    invitedProviders: [],
  });

  const [newlySelectedFiles, setNewlySelectedFiles] = useState([]);
  const [filesToRemove, setFilesToRemove] = useState([]);
  const [currentTag, setCurrentTag] = useState("");
  const [currentSkill, setCurrentSkill] = useState("");
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    const isInitialDataProvided = Object.keys(initialData).length > 0;
    if (isInitialDataProvided || isEdit) {
      const dataToUse = isInitialDataProvided ? initialData : {};

      let initialAddresses = [];
      if (dataToUse.locationPreference === "on-site") {
        if (
          Array.isArray(dataToUse.onSiteAddresses) &&
          dataToUse.onSiteAddresses.length > 0
        ) {
          initialAddresses = dataToUse.onSiteAddresses.map((addr) => ({
            ...emptyAddress,
            ...addr,
          }));
        } else {
          initialAddresses = [{ ...emptyAddress, isPrimary: true }]; // Default to one if on-site and none provided
        }
      }

      // Handle both database format (budget.min/max/type) and form format (budgetMin/Max/Type)
      const budgetMin =
        dataToUse.budgetMin ||
        dataToUse.budget?.min?.toString() ||
        "";
      const budgetMax =
        dataToUse.budgetMax ||
        dataToUse.budget?.max?.toString() ||
        "";
      const budgetType =
        dataToUse.budgetType ||
        dataToUse.budget?.type ||
        "open_to_offers";

      // Handle scope of work - both database format and form format
      const scopeUnit =
        dataToUse.scopeUnit ||
        dataToUse.scopeOfWork?.unit ||
        "";
      const scopeQuantity =
        dataToUse.scopeQuantity ||
        dataToUse.scopeOfWork?.quantity?.toString() ||
        "";
      const scopeDetails =
        dataToUse.scopeDetails ||
        dataToUse.scopeOfWork?.details ||
        "";

      const parseSafeArray = (data) => {
        if (Array.isArray(data)) return data;
        if (typeof data === "string") {
          try {
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            return [];
          }
        }
        return [];
      };

      const normalizedInitialData = {
        title: dataToUse.title || "",
        description: dataToUse.description || "",
        category: dataToUse.category || "",
        subcategory: dataToUse.subcategory || "",
        budgetMin,
        budgetMax,
        budgetType,
        desiredDeliveryTime: dataToUse.desiredDeliveryTime || "",
        locationPreference: dataToUse.locationPreference || "remote",
        onSiteAddresses: initialAddresses,
        tags: parseSafeArray(dataToUse.tags),
        attachments: parseSafeArray(dataToUse.attachments),
        requiredSkills: parseSafeArray(dataToUse.requiredSkills),
        experienceLevel: dataToUse.experienceLevel || "any",
        scopeUnit,
        scopeQuantity,
        scopeDetails,
        invitedProviders: parseSafeArray(dataToUse.invitedProviders),
      };
      setFormData(normalizedInitialData);

      if (normalizedInitialData.category) {
        setSubcategories(
          (isCommunityOffersFlow
            ? communitySubcategoryOptions[normalizedInitialData.category]
            : DUMMY_SUBCATEGORY_OPTIONS_MAP[normalizedInitialData.category]
          ) || []
        );
      }
    } else {
      // Creating new, ensure form is fully reset
      setFormData({
        title: "",
        description: "",
        category: "",
        subcategory: "",
        budgetMin: "",
        budgetMax: "",
        budgetType: "open_to_offers",
        desiredDeliveryTime: "",
        locationPreference: "remote",
        onSiteAddresses: [],
        tags: [],
        attachments: [],
        requiredSkills: [],
        experienceLevel: "any",
        scopeUnit: "",
        scopeQuantity: "",
        scopeDetails: "",
        invitedProviders: [],
      });
    }
    setNewlySelectedFiles([]);
    setFilesToRemove([]);
  }, [initialData, isEdit]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      const newState = { ...prev, [name]: value };
      if (name === "category") {
        newState.subcategory = ""; // Reset subcategory when category changes
        setSubcategories(
          (isCommunityOffersFlow
            ? communitySubcategoryOptions[value]
            : DUMMY_SUBCATEGORY_OPTIONS_MAP[value]
          ) || []
        );
      }
      if (name === "locationPreference") {
        if (value === "on-site") {
          // If switching to on-site and no addresses exist, add one
          if (
            !newState.onSiteAddresses ||
            newState.onSiteAddresses.length === 0
          ) {
            newState.onSiteAddresses = [{ ...emptyAddress, isPrimary: true }];
          }
        } else {
          newState.onSiteAddresses = []; // Clear addresses if not on-site
        }
      }
      return newState;
    });
  };

  const handleAddressChange = (index, event) => {
    const { name, value } = event.target;
    const updatedAddresses = formData.onSiteAddresses.map((addr, i) =>
      i === index ? { ...addr, [name]: value } : addr
    );
    setFormData((prev) => ({ ...prev, onSiteAddresses: updatedAddresses }));
  };

  const addAddressField = () => {
    if (formData.onSiteAddresses.length < 3) {
      // Example limit
      const newAddress = {
        ...emptyAddress,
        isPrimary: formData.onSiteAddresses.length === 0,
      };
      setFormData((prev) => ({
        ...prev,
        onSiteAddresses: [...prev.onSiteAddresses, newAddress],
      }));
    } else {
      alert("You can add a maximum of 3 address locations.");
    }
  };

  const removeAddressField = (index) => {
    // Always require at least one address if locationPreference is "on-site"
    if (
      formData.locationPreference === "on-site" &&
      formData.onSiteAddresses.length <= 1
    ) {
      alert("At least one address is required for on-site preference.");
      return;
    }
    const updatedAddresses = formData.onSiteAddresses.filter(
      (_, i) => i !== index
    );
    if (
      updatedAddresses.length > 0 &&
      !updatedAddresses.some((addr) => addr.isPrimary)
    ) {
      updatedAddresses[0].isPrimary = true;
    }
    setFormData((prev) => ({ ...prev, onSiteAddresses: updatedAddresses }));
  };

  const togglePrimaryAddress = (indexToMakePrimary) => {
    const updatedAddresses = formData.onSiteAddresses.map((addr, i) => ({
      ...addr,
      isPrimary: i === indexToMakePrimary,
    }));
    setFormData((prev) => ({ ...prev, onSiteAddresses: updatedAddresses }));
  };

  const handleArrayInputChange = (
    currentValSetter,
    fieldName,
    currentVal,
    maxLength = Infinity
  ) => {
    if (
      currentVal.trim() &&
      !formData[fieldName].includes(currentVal.trim()) &&
      formData[fieldName].length < maxLength
    ) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: [...prev[fieldName], currentVal.trim()],
      }));
    }
    currentValSetter("");
  };
  const handleDeleteArrayItem = (fieldName, itemToDelete) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((item) => item !== itemToDelete),
    }));
  };
  const handleAddTag = () =>
    handleArrayInputChange(setCurrentTag, "tags", currentTag, 5);
  const handleDeleteTag = (tagToDelete) =>
    handleDeleteArrayItem("tags", tagToDelete);
  const handleAddSkill = () =>
    handleArrayInputChange(setCurrentSkill, "requiredSkills", currentSkill, 10);
  const handleDeleteSkill = (skillToDelete) =>
    handleDeleteArrayItem("requiredSkills", skillToDelete);

  const handleInvitedProvidersChange = (event, newValue) => {
    const providerIds = newValue.map((provider) => provider._id);
    const limit =
      currentRequestTypeForInvites === PROMOTION_TYPES_FRONTEND.STANDARD
        ? 20
        : Infinity;
    setFormData((prev) => ({
      ...prev,
      invitedProviders: providerIds.slice(
        0,
        isFinite(limit) ? limit : undefined
      ),
    }));
  };

  const handleNewFilesChange = (files) => {
    setNewlySelectedFiles((prevFiles) => [...prevFiles, ...files]);
  };
  const handleRemoveNewFile = (indexToRemove) => {
    setNewlySelectedFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };
  const handleRemoveExistingFile = (pathToRemove) => {
    setFilesToRemove((prev) =>
      prev.includes(pathToRemove)
        ? prev.filter((p) => p !== pathToRemove)
        : [...prev, pathToRemove]
    );
  };

  const handleFormSubmitInternal = (event) => {
    event.preventDefault();
    const submissionData = new FormData();

    // Append all simple formData fields (excluding onSiteAddresses and attachments which are handled specially)
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "onSiteAddresses" || key === "attachments") {
        return; // Handled below
      }
      if (
        key === "tags" ||
        key === "requiredSkills" ||
        key === "invitedProviders"
      ) {
        if (Array.isArray(value) && value.length > 0) {
          value.forEach((val) => submissionData.append(`${key}[]`, val));
        }
      } else if (
        (key === "budgetMin" ||
          key === "budgetMax" ||
          key === "scopeQuantity") &&
        (value === "" ||
          value === null ||
          value === undefined ||
          isNaN(parseFloat(value)))
      ) {
        if (
          !(
            value === "" &&
            (key === "budgetMin" || key === "budgetMax") &&
            formData.budgetType === "open_to_offers"
          )
        ) {
          // If not "open_to_offers" and budget fields, or scopeQuantity, and it's invalid/empty,
          // it might indicate an issue or an optional field not filled. Backend validation will catch if required.
          // For now, we don't append if it's truly empty/invalid for these numeric types.
          // If a "0" is intended, user should input "0".
        }
        if (
          value !== "" &&
          value !== null &&
          value !== undefined &&
          !isNaN(parseFloat(value))
        ) {
          submissionData.append(key, Number(value));
        }
      } else if (
        value !== undefined &&
        value !== null &&
        (typeof value === "string" ? value.trim() !== "" : true)
      ) {
        submissionData.append(key, value);
      }
    });

    // Append onSiteAddresses as a JSON string if locationPreference is 'on-site'
    if (
      formData.locationPreference === "on-site" &&
      formData.onSiteAddresses.length > 0
    ) {
      // Filter out addresses that don't have city and country (basic validation)
      const validAddresses = formData.onSiteAddresses.filter(
        (addr) => addr.city?.trim() && addr.country?.trim()
      );
      if (validAddresses.length > 0) {
        submissionData.append(
          "onSiteAddresses",
          JSON.stringify(validAddresses)
        );
      } else if (formData.onSiteAddresses.length > 0) {
        // Some addresses were there but invalid
        alert(
          "Please ensure all on-site addresses have at least a city and country."
        );
        return;
      }
      if (
        validAddresses.length === 0 &&
        formData.onSiteAddresses.length === 0 &&
        !isEdit
      ) {
        // Ensure at least one if on-site selected
        alert("Please provide at least one address for on-site services.");
        return;
      }
    }

    if (isEdit) {
      const keptExistingAttachments = formData.attachments.filter(
        (path) => !filesToRemove.includes(path)
      );
      keptExistingAttachments.forEach((path) =>
        submissionData.append("existingAttachments[]", path)
      );
      filesToRemove.forEach((path) =>
        submissionData.append("removedAttachments[]", path)
      );
    }
    newlySelectedFiles.forEach((file) => {
      submissionData.append("attachments", file);
    });

    onFormSubmitIntent(submissionData, {
      listAsSpecialDeal,
    });
  };

  const getInvitationLimitTextInternal = () => {
    return currentRequestTypeForInvites === PROMOTION_TYPES_FRONTEND.STANDARD
      ? "Limit 20"
      : "Unlimited";
  };

  return (
    <Paper
      elevation={isEdit ? 0 : 3}
      sx={{ p: isEdit ? 0 : { xs: 2, md: 3 }, borderRadius: isEdit ? 0 : 2 }}
    >
      {!isEdit && (
        <>
          <Typography
            variant="h5"
            component="h1"
            gutterBottom
            fontWeight="bold"
          >
            What Service Do You Need?
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Describe your needs, and let qualified providers come to you with
            proposals.
          </Typography>
        </>
      )}
      <form onSubmit={handleFormSubmitInternal}>
        <Grid container spacing={2.5}>
          {/* Title, Description, Category, Subcategory, Budget (Inputs remain the same) */}
          <Grid item xs={12}>
            <TextField
              name="title"
              label="Request Title"
              value={formData.title}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{ inputProps: { minLength: 10, maxLength: 150 } }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="description"
              label="Detailed Description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              required
              multiline
              rows={5}
              InputProps={{ inputProps: { minLength: 30, maxLength: 3000 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="category-label-form">Category</InputLabel>
              <Select
                labelId="category-label-form"
                name="category"
                value={formData.category}
                label="Category"
                onChange={handleChange}
              >
                <MenuItem value="">
                  <em>Select</em>
                </MenuItem>
                {(isCommunityOffersFlow ? communityCategories : DUMMY_CATEGORIES).map((cat) => (
                  <MenuItem key={cat.name} value={cat.name}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              disabled={
                !formData.category ||
                !(isCommunityOffersFlow
                  ? communitySubcategoryOptions[formData.category]
                  : DUMMY_SUBCATEGORY_OPTIONS_MAP[formData.category]
                )?.length
              }
            >
              <InputLabel id="subcategory-label-form">Subcategory</InputLabel>
              <Select
                labelId="subcategory-label-form"
                name="subcategory"
                value={formData.subcategory}
                label="Subcategory"
                onChange={handleChange}
              >
                <MenuItem value="">
                  <em>Select</em>
                </MenuItem>
                {(isCommunityOffersFlow
                  ? communitySubcategoryOptions[formData.category] || []
                  : DUMMY_SUBCATEGORY_OPTIONS_MAP[formData.category] || []
                ).map((sub) => (
                  <MenuItem key={sub} value={sub}>
                    {sub}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "medium", mt: 1, mb: -0.5 }}
            >
              Budget
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="budget-type-label-form">Budget Type</InputLabel>
              <Select
                labelId="budget-type-label-form"
                name="budgetType"
                value={formData.budgetType}
                label="Budget Type"
                onChange={handleChange}
              >
                <MenuItem value="open_to_offers">Open to Offers</MenuItem>
                <MenuItem value="fixed">Fixed Price</MenuItem>
                <MenuItem value="hourly_range">Hourly Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="budgetMin"
              label={formData.budgetType === "fixed" ? "Amount ($)" : "Min ($)"}
              type="number"
              value={formData.budgetMin}
              onChange={handleChange}
              fullWidth
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          {formData.budgetType !== "fixed" && (
            <Grid item xs={12} sm={4}>
              <TextField
                name="budgetMax"
                label="Max ($)"
                type="number"
                value={formData.budgetMax}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  inputProps: { min: Number(formData.budgetMin) || 0 },
                }}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}>
              <Chip label="Project Specifics" size="small" />
            </Divider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="experience-level-label-form">
                Experience Level
              </InputLabel>
              <Select
                labelId="experience-level-label-form"
                name="experienceLevel"
                value={formData.experienceLevel}
                label="Experience Level"
                onChange={handleChange}
              >
                {experienceLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="desiredDeliveryTime"
              label="Desired Delivery"
              helperText="e.g., 1 week"
              value={formData.desiredDeliveryTime}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Required Skills (up to 10)
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <TextField
                size="small"
                label="Add Skill"
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddSkill())
                }
                disabled={formData.requiredSkills.length >= 10}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleAddSkill}
                disabled={formData.requiredSkills.length >= 10}
              >
                Add
              </Button>
            </Stack>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {formData.requiredSkills.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  onDelete={() => handleDeleteSkill(skill)}
                />
              ))}
            </Box>
            {formData.requiredSkills.length >= 10 && (
              <Typography variant="caption" color="text.secondary">
                Max 10 skills.
              </Typography>
            )}
          </Grid>
          <Grid item xs={12}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "medium", mt: 1, mb: -0.5 }}
            >
              Scope of Work
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="scope-unit-label-form">Unit</InputLabel>
              <Select
                labelId="scope-unit-label-form"
                name="scopeUnit"
                value={formData.scopeUnit}
                label="Unit"
                onChange={handleChange}
              >
                {scopeUnits.map((unit) => (
                  <MenuItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              name="scopeQuantity"
              label="Quantity"
              type="number"
              value={formData.scopeQuantity}
              onChange={handleChange}
              fullWidth
              InputProps={{ inputProps: { min: 0 } }}
              disabled={
                !formData.scopeUnit ||
                formData.scopeUnit === "project" ||
                formData.scopeUnit === ""
              }
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              name="scopeDetails"
              label="Additional Details"
              placeholder="e.g., 'per room'"
              value={formData.scopeDetails}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          {/* --- Location Section --- */}
          <Grid item xs={12}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "medium", mt: 1, mb: -0.5 }}
            >
              Location
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="location-pref-label-form">
                Location Preference
              </InputLabel>
              <Select
                labelId="location-pref-label-form"
                name="locationPreference"
                value={formData.locationPreference}
                label="Location Preference"
                onChange={handleChange}
              >
                <MenuItem value="remote">Remote</MenuItem>
                <MenuItem value="on-site">
                  On-site (Specify address/areas below)
                </MenuItem>
                <MenuItem value="flexible">
                  Flexible (Open to Remote or On-site)
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* --- Dynamic On-Site Address Fields --- */}
          {formData.locationPreference === "on-site" &&
            formData.onSiteAddresses.map((address, index) => (
              <React.Fragment key={index}>
                <Grid
                  item
                  xs={12}
                  sx={{ pt: "16px !important", pb: "8px !important" }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="subtitle2" color="text.secondary">
                      Address Location {index + 1}{" "}
                      {address.isPrimary ? (
                        <Chip
                          label="Primary"
                          size="small"
                          color="secondary"
                          sx={{ ml: 1 }}
                        />
                      ) : (
                        ""
                      )}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {!address.isPrimary &&
                        formData.onSiteAddresses.length > 1 && (
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => togglePrimaryAddress(index)}
                            sx={{ textTransform: "none", fontSize: "0.75rem" }}
                          >
                            Set as Primary
                          </Button>
                        )}
                      {formData.onSiteAddresses.length > 1 && (
                        <IconButton
                          onClick={() => removeAddressField(index)}
                          size="small"
                          color="error"
                          aria-label={`remove address ${index + 1}`}
                        >
                          <RemoveCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </Box>
                  <Divider sx={{ my: 0.5 }} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    name="country"
                    label="Country"
                    value={address.country}
                    onChange={(e) => handleAddressChange(index, e)}
                    fullWidth
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    name="city"
                    label="City"
                    value={address.city}
                    onChange={(e) => handleAddressChange(index, e)}
                    fullWidth
                    required
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    name="postalCode"
                    label="Zip/Postal Code"
                    value={address.postalCode}
                    onChange={(e) => handleAddressChange(index, e)}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </React.Fragment>
            ))}
          {formData.locationPreference === "on-site" &&
            formData.onSiteAddresses.length < 3 && (
              <Grid
                item
                xs={12}
                sx={{ textAlign: "center", pt: "16px !important" }}
              >
                <Button
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={addAddressField}
                  variant="outlined"
                  size="small"
                >
                  Add Another Address Location
                </Button>
              </Grid>
            )}

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Tags (Keywords, up to 5)
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <TextField
                size="small"
                label="Add Tag"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddTag())
                }
                disabled={formData.tags.length >= 5}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleAddTag}
                disabled={formData.tags.length >= 5}
              >
                Add
              </Button>
            </Stack>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {formData.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleDeleteTag(tag)}
                />
              ))}
            </Box>
            {formData.tags.length >= 5 && (
              <Typography variant="caption" color="text.secondary">
                Maximum 5 tags.
              </Typography>
            )}
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Attachments (Optional)
            </Typography>
            <FileUploadComponent
              selectedFiles={newlySelectedFiles}
              existingAttachments={formData.attachments.map((att) =>
                typeof att === "string"
                  ? {
                    path: att,
                    name: att.split("/").pop(),
                    markedForRemoval: filesToRemove.includes(att),
                  }
                  : att
              )}
              onFilesChange={handleNewFilesChange}
              onRemoveNewFile={handleRemoveNewFile}
              onRemoveExistingFile={handleRemoveExistingFile}
            />
          </Grid>

          {showSpecialDealOption && !isEdit && (
            <Grid item xs={12}>
              <Box
                sx={{
                  width: "100%",
                  px: 1,
                  py: 0.75,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      color="secondary"
                      checked={listAsSpecialDeal}
                      onChange={(event) =>
                        onListAsSpecialDealChange?.(event.target.checked)
                      }
                      disabled={disableSpecialDealOption}
                    />
                  }
                  label="List as a special deal"
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", ml: { xs: 0, sm: 4.5 } }}
                >
                  If selected, you will fill special deal details before choosing
                  your post type.
                </Typography>
              </Box>
            </Grid>
          )}

          <Grid item xs={12} sx={{ mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={isLoading}
              fullWidth
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Next: Choose Post Type"
              )}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};
export default ServiceRequestForm;
