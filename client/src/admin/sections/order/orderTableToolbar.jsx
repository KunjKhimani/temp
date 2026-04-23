import PropTypes from "prop-types";
import {
  Toolbar,
  Tooltip,
  IconButton,
  Typography,
  OutlinedInput,
  InputAdornment,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import DeleteIcon from "@mui/icons-material/Delete";

// ----------------------------------------------------------------------

export function OrderTableToolbar({
  numSelected,
  currentParams,
  onParamsChange,
  onBulkDelete,
}) {
  const handleFilterByName = (event) => {
    onParamsChange({
      ...currentParams,
      filters: { search: event.target.value },
      page: 1,
    });
  };

  return (
    <Toolbar
      sx={{
        height: 96,
        display: "flex",
        justifyContent: "space-between",
        p: (theme) => theme.spacing(0, 1, 0, 3),
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
        <Typography component="div" variant="subtitle1">
          {numSelected} selected
        </Typography>
      ) : (
        <OutlinedInput
          value={currentParams.filters?.search || ""}
          onChange={handleFilterByName}
          placeholder="Search order..."
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon
                sx={{ color: "text.disabled", width: 20, height: 20 }}
              />
            </InputAdornment>
          }
          sx={{ width: 240 }}
        />
      )}

      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton onClick={onBulkDelete}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Filter list">
          <IconButton>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
}

OrderTableToolbar.propTypes = {
  numSelected: PropTypes.number,
  currentParams: PropTypes.object,
  onParamsChange: PropTypes.func,
  onBulkDelete: PropTypes.func,
};
