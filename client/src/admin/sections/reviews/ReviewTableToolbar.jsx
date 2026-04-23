/* eslint-disable react/prop-types */
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputAdornment from "@mui/material/InputAdornment";
import { Iconify } from "../../components/iconify";

export function ReviewTableToolbar({ 
  numSelected, 
  filterName, 
  onFilterName
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
          placeholder="Search by Name/Email..."
          sx={{ width: 320 }}
          startAdornment={
            <InputAdornment position="start">
              <Iconify
                icon="eva:search-fill"
                sx={{ color: "text.disabled", width: 20, height: 20 }}
              />
            </InputAdornment>
          }
        />
      )}
    </Toolbar>
  );
}
