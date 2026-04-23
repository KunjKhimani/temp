import PropTypes from "prop-types";
import {
  Toolbar,
  Tooltip,
  IconButton,
  Typography,
  OutlinedInput,
  InputAdornment,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import DeleteIcon from "@mui/icons-material/Delete";
import ClearIcon from "@mui/icons-material/Clear";

// ----------------------------------------------------------------------

export function RevenueTableToolbar({
  numSelected,
  currentParams,
  onParamsChange,
  onBulkDelete,
}) {
  const handleFilterChange = (field, value) => {
    onParamsChange({
      ...currentParams,
      [field]: value,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    onParamsChange({
      ...currentParams,
      search: "",
      type: "",
      status: "",
      startDate: "",
      endDate: "",
      page: 1,
    });
  };

  return (
    <Toolbar
      sx={{
        height: "auto",
        minHeight: 96,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", md: "center" },
        p: (theme) => theme.spacing(2, 1, 2, 3),
        gap: 2,
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity
            ),
        }),
      }}
    >
      {numSelected > 0 ? (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: "100%" }}>
          <Typography component="div" variant="subtitle1">
            {numSelected} selected
          </Typography>
          <Tooltip title="Delete">
            <IconButton onClick={onBulkDelete}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ) : (
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2.5}
          alignItems={{ xs: "stretch", lg: "center" }}
          sx={{ py: 1, width: "100%" }}
        >
          {/* --- Search Section --- */}
          <OutlinedInput
            value={currentParams.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            placeholder="Search transactions..."
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon
                  sx={{ color: "text.disabled", width: 20, height: 20 }}
                />
              </InputAdornment>
            }
            sx={{ minWidth: { xs: "100%", sm: 260 }, maxWidth: { lg: 320 } }}
            size="small"
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center" sx={{ flexGrow: 1 }}>
            {/* --- Categories Group --- */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={currentParams.type || ""}
                label="Type"
                onChange={(e) => handleFilterChange("type", e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="product">Product</MenuItem>
                <MenuItem value="service">Service</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={currentParams.status || ""}
                label="Status"
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="pending-payment">Pending Payment</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="succeeded">Succeeded</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="refunded">Refunded</MenuItem>
                <MenuItem value="disputed">Disputed</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* --- Date Range Group --- */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
            <TextField
              size="small"
              label="From"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={currentParams.startDate || ""}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              sx={{ width: { xs: "100%", sm: 145 } }}
            />
            <TextField
              size="small"
              label="To"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={currentParams.endDate || ""}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              sx={{ width: { xs: "100%", sm: 145 } }}
            />
          </Stack>

          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
            <Tooltip title="Clear Filters">
              <IconButton onClick={handleClearFilters} size="small" color="error">
                <ClearIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Filter list">
              <IconButton size="small">
                <FilterListIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      )}
    </Toolbar>
  );
}

RevenueTableToolbar.propTypes = {
  numSelected: PropTypes.number,
  currentParams: PropTypes.object,
  onParamsChange: PropTypes.func,
  onBulkDelete: PropTypes.func,
};
