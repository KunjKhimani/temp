/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState } from "react"; // Import useState
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputAdornment from "@mui/material/InputAdornment";
import { Iconify } from "../../components/iconify";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Stack,
} from "@mui/material";
import { useDebouncedCallback } from "use-debounce";

// ----------------------------------------------------------------------

export function ServiceTableToolbar({
  numSelected,
  filterName, // Changed from currentParams.filters.name
  onFilterName, // Changed from onParamsChange
  onBulkDelete,
}) {
  const debouncedFilterChange = useDebouncedCallback((value) => {
    onFilterName({ target: { value } }); // Simulate event object for onFilterName
  }, 500);

  // Local state for filters if not directly managed by Redux params in ServiceView
  const [serviceType, setServiceType] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [serviceStatus, setServiceStatus] = useState("");

  // Handlers for local filter state (if ServiceView manages filters via local state)
  const handleServiceTypeChange = (event) => {
    setServiceType(event.target.value);
    // You might want to dispatch an action or call a prop function here to update Redux/parent state
    // For now, assuming ServiceView's main useEffect will pick up changes from filterName
  };

  const handleServiceCategoryChange = (event) => {
    setServiceCategory(event.target.value);
  };

  const handleServiceStatusChange = (event) => {
    setServiceStatus(event.target.value);
  };

  return (
    <Toolbar
      sx={{
        height: "auto",
        minHeight: 96,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { sm: "center" },
        p: (theme) => theme.spacing(2, 1, 2, 3),
        gap: 2,
        ...(numSelected > 0 && {
          color: "primary.main",
          bgcolor: "primary.lighter",
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography component="div" variant="subtitle1" sx={{ flexGrow: 1 }}>
          {numSelected} selected
        </Typography>
      ) : (
        // --- Filter Controls ---
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
          sx={{ flexGrow: 1, width: "100%" }}
        >
          {/* Text Search (Service Title) */}
          <OutlinedInput
            size="small"
            fullWidth
            value={filterName} // Use filterName prop
            onChange={(e) => debouncedFilterChange(e.target.value)}
            placeholder="Search by Service Title..."
            startAdornment={
              <InputAdornment position="start">
                <Iconify
                  width={20}
                  icon="eva:search-fill"
                  sx={{ color: "text.disabled" }}
                />
              </InputAdornment>
            }
            sx={{ maxWidth: { md: 320 } }}
          />

          {/* Service Type Filter */}
          <FormControl sx={{ minWidth: 150, flexShrink: 0 }} size="small">
            <InputLabel id="service-type-select-label">Service Type</InputLabel>
            <Select
              labelId="service-type-select-label"
              value={serviceType}
              onChange={handleServiceTypeChange}
              label="Service Type"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="online">Online</MenuItem>
              <MenuItem value="on-site">On-site</MenuItem>
            </Select>
          </FormControl>

          {/* Service Category Filter */}
          <FormControl sx={{ minWidth: 150, flexShrink: 0 }} size="small">
            <InputLabel id="service-category-select-label">Category</InputLabel>
            <Select
              labelId="service-category-select-label"
              value={serviceCategory}
              onChange={handleServiceCategoryChange}
              label="Category"
            >
              <MenuItem value="">All</MenuItem>
              {/* Add actual categories from your data or constants */}
              <MenuItem value="design">Design</MenuItem>
              <MenuItem value="development">Development</MenuItem>
              <MenuItem value="marketing">Marketing</MenuItem>
              <MenuItem value="writing">Writing & Translation</MenuItem>
              <MenuItem value="video">Video & Animation</MenuItem>
              <MenuItem value="music">Music & Audio</MenuItem>
              <MenuItem value="business">Business</MenuItem>
              <MenuItem value="data">Data</MenuItem>
              <MenuItem value="photography">Photography</MenuItem>
            </Select>
          </FormControl>

          {/* Service Status Filter */}
          <FormControl sx={{ minWidth: 130, flexShrink: 0 }} size="small">
            <InputLabel id="service-status-select-label">Status</InputLabel>
            <Select
              labelId="service-status-select-label"
              value={serviceStatus}
              onChange={handleServiceStatusChange}
              label="Status"
            >
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="paused">Paused</MenuItem>
              <MenuItem value="pending_verification">
                Pending Verification
              </MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      )}

      {/* --- Bulk Actions --- */}
      {numSelected > 0 && (
        <Tooltip title="Delete Selected">
          <IconButton onClick={onBulkDelete}>
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
}
