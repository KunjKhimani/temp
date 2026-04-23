/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputAdornment from "@mui/material/InputAdornment";
import { Iconify } from "../../components/iconify"; // Adjust path
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

export function UserTableToolbar({
  numSelected,
  currentParams,
  onParamsChange,
  onBulkDelete, // Added onBulkDelete prop
}) {
  const filters = currentParams.filters || {};

  const debouncedFilterChange = useDebouncedCallback((key, value) => {
    onParamsChange({ filters: { ...filters, [key]: value } });
  }, 500);

  const handleFilterChange = (key, value) => {
    onParamsChange({ filters: { ...filters, [key]: value } });
  };

  return (
    <Toolbar
      sx={{
        height: "auto",
        minHeight: 96,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { sm: "center" }, // Align items center on larger screens
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
          alignItems="center" // Align items within the stack
          sx={{ flexGrow: 1, width: "100%" }}
        >
          {/* Text Search (Name/Email) */}
          <OutlinedInput
            // *** ADD size="small" ***
            size="small"
            fullWidth
            defaultValue={filters.name || filters.email || ""}
            onChange={(e) => debouncedFilterChange("name", e.target.value)}
            placeholder="Search by Name/Email..."
            startAdornment={
              <InputAdornment position="start">
                <Iconify
                  width={20}
                  icon="eva:search-fill"
                  sx={{ color: "text.disabled" }}
                />
              </InputAdornment>
            }
            sx={{ maxWidth: { md: 320 } }} // Keep width control
          />

          {/* Account Type Filter */}
          <FormControl sx={{ minWidth: 150, flexShrink: 0 }} size="small">
            {" "}
            {/* Added size here too */}
            <InputLabel id="account-type-select-label">Account Type</InputLabel>
            <Select
              labelId="account-type-select-label"
              value={filters.accountType || ""}
              onChange={(e) =>
                handleFilterChange("accountType", e.target.value)
              }
              label="Account Type"
              // size="small" // Size is inherited from FormControl now
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="individual">Individual</MenuItem>
              <MenuItem value="agency">Agency</MenuItem>
            </Select>
          </FormControl>

          {/* Seller Status Filter */}
          <FormControl sx={{ minWidth: 130, flexShrink: 0 }} size="small">
            {" "}
            {/* Added size here too */}
            <InputLabel id="seller-status-select-label">Seller</InputLabel>
            <Select
              labelId="seller-status-select-label"
              value={filters.isSeller ?? ""}
              onChange={(e) => handleFilterChange("isSeller", e.target.value)}
              label="Seller"
              // size="small" // Inherited
            >
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </Select>
          </FormControl>

          {/* Verified Status Filter */}
          <FormControl sx={{ minWidth: 140, flexShrink: 0 }} size="small">
            {" "}
            {/* Added size here too */}
            <InputLabel id="verified-status-select-label">Verified</InputLabel>
            <Select
              labelId="verified-status-select-label"
              value={filters.isVerified ?? ""}
              onChange={(e) => handleFilterChange("isVerified", e.target.value)}
              label="Verified"
              // size="small" // Inherited
            >
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      )}

      {/* --- Bulk Actions --- */}
      {numSelected > 0 && (
        <Tooltip title="Delete Selected">
          <IconButton onClick={onBulkDelete}>
            {" "}
            {/* Call onBulkDelete */}
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
}
