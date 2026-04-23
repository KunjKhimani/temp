import PropTypes from "prop-types";
import {
  Toolbar,
  Tooltip,
  IconButton,
  Typography,
  OutlinedInput,
  InputAdornment,
} from "@mui/material";
import { Iconify } from "../../components/iconify";

// ----------------------------------------------------------------------

export function RequestedProductTableToolbar({
  numSelected,
  filterName,
  onFilterName,
  onBulkDelete,
}) {
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
          value={filterName}
          onChange={onFilterName}
          placeholder="Search requested product..."
          startAdornment={
            <InputAdornment position="start">
              <Iconify
                icon="eva:search-fill"
                sx={{ color: "text.disabled", width: 20, height: 20 }}
              />
            </InputAdornment>
          }
          sx={{ height: 48 }}
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

RequestedProductTableToolbar.propTypes = {
  numSelected: PropTypes.number,
  filterName: PropTypes.string,
  onFilterName: PropTypes.func,
  onBulkDelete: PropTypes.func,
};
