import PropTypes from "prop-types";
import {
  Toolbar,
  OutlinedInput,
  InputAdornment,
  Tooltip,
  IconButton,
  Typography,
} from "@mui/material";
import { Iconify } from "../../components/iconify";

// ----------------------------------------------------------------------

export function ServiceRequestTableToolbar({
  numSelected,
  searchQuery,
  onSearch,
  // eslint-disable-next-line no-unused-vars
  filters,
  // eslint-disable-next-line no-unused-vars
  onFilterChange,
  onBulkDelete,
}) {
  const handleSearchChange = (event) => {
    onSearch(event.target.value);
  };

  // Placeholder for filter logic if needed later
  // const handleStatusFilterChange = (event) => {
  //   onFilterChange({ status: event.target.value });
  // };

  return (
    <Toolbar
      sx={{
        height: 96,
        display: "flex",
        justifyContent: "space-between",
        p: (theme) => theme.spacing(0, 1, 0, 3),
        ...(numSelected > 0 && {
          color: "primary.main",
          bgcolor: "primary.lighter",
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography component="div" variant="subtitle1">
          {numSelected} selected
        </Typography>
      ) : (
        <OutlinedInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search service request..."
          startAdornment={
            <InputAdornment position="start">
              <Iconify
                icon="eva:search-fill"
                sx={{ color: "text.disabled", width: 20, height: 20 }}
              />
            </InputAdornment>
          }
          sx={{ width: 300 }}
        />
      )}

      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton onClick={onBulkDelete}>
            <Iconify icon="eva:trash-2-fill" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Filter list">
          <IconButton>
            <Iconify icon="ic:round-filter-list" />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
}

ServiceRequestTableToolbar.propTypes = {
  numSelected: PropTypes.number,
  searchQuery: PropTypes.string,
  onSearch: PropTypes.func,
  filters: PropTypes.object,
  onFilterChange: PropTypes.func,
  onBulkDelete: PropTypes.func,
};
