import PropTypes from "prop-types";
import {
  Stack,
  InputAdornment,
  TextField,
  Tooltip,
  IconButton,
  Typography, // Added Typography
} from "@mui/material";
import { Iconify } from "../../components/iconify";
// import Iconify from "../../components/iconify"; // Assuming this component exists

// ----------------------------------------------------------------------

ProductTableToolbar.propTypes = {
  numSelected: PropTypes.number,
  filterName: PropTypes.string,
  onFilterName: PropTypes.func,
  onBulkDelete: PropTypes.func,
};

export default function ProductTableToolbar({
  numSelected,
  filterName,
  onFilterName,
  onBulkDelete,
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ px: 2.5, py: 3 }}
    >
      {numSelected > 0 ? (
        <Typography variant="subtitle1" component="div">
          {numSelected} selected
        </Typography>
      ) : (
        <TextField
          value={filterName}
          onChange={onFilterName}
          placeholder="Search product..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify
                  icon="eva:search-fill"
                  sx={{ color: "text.disabled", width: 20, height: 20 }}
                />
              </InputAdornment>
            ),
          }}
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
    </Stack>
  );
}
