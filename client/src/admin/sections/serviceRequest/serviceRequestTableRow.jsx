import PropTypes from "prop-types";
import { useState } from "react";
import {
  TableRow,
  TableCell,
  Checkbox,
  Typography,
  IconButton,
  Popover,
  MenuItem,
  Avatar,
  Stack,
} from "@mui/material";
import { Iconify } from "../../components/iconify";
import { format } from "date-fns";
import Label from "../../components/label/label"; // Assuming Label component exists

// ----------------------------------------------------------------------

export function ServiceRequestTableRow({
  request,
  selected,
  onSelectRow,
  onEditRow,
  onDeleteRow,
  onViewDetails,
}) {
  const [open, setOpen] = useState(null);

  const handleOpenMenu = (event) => {
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const handleEdit = () => {
    onEditRow();
    handleCloseMenu();
  };

  const handleDelete = () => {
    onDeleteRow();
    handleCloseMenu();
  };

  const handleView = () => {
    onViewDetails();
    handleCloseMenu();
  };

  const getCreatedByDisplayName = (createdBy) => {
    if (!createdBy) return "N/A";
    if (createdBy.accountType === "agency") {
      return (
        createdBy.companyName || createdBy.representativeName || createdBy.email
      );
    }
    return createdBy.name || createdBy.email;
  };

  return (
    <TableRow hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onChange={onSelectRow} />
      </TableCell>

      <TableCell component="th" scope="row" padding="none">
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="subtitle2" noWrap>
            {request.title}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar
            alt={getCreatedByDisplayName(request.createdBy)}
            src={
              request.createdBy?.profilePicture ||
              "/assets/images/avatars/avatar_default.jpg"
            }
            sx={{ width: 32, height: 32 }}
          />
          <Typography variant="body2" noWrap>
            {getCreatedByDisplayName(request.createdBy)}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell>{request.category}</TableCell>

      <TableCell>
        <Label color={(request.status === "closed" && "error") || "success"}>
          {request.status}
        </Label>
      </TableCell>

      <TableCell>{request.requestType}</TableCell>

      <TableCell align="right">
        {request.budget?.min ? `$${request.budget.min.toFixed(2)}` : "N/A"}
      </TableCell>
      <TableCell align="right">
        {request.budget?.max ? `$${request.budget.max.toFixed(2)}` : "N/A"}
      </TableCell>

      <TableCell>
        {request.createdAt
          ? format(new Date(request.createdAt), "dd MMM yyyy")
          : "N/A"}
      </TableCell>

      <TableCell align="right">
        <IconButton onClick={handleOpenMenu}>
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
      </TableCell>

      <Popover
        open={!!open}
        anchorEl={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: { width: 140, p: 0 },
        }}
      >
        <MenuItem onClick={handleView}>
          <Iconify icon="eva:eye-fill" sx={{ mr: 2 }} />
          View
        </MenuItem>

        <MenuItem onClick={handleEdit}>
          <Iconify icon="eva:edit-fill" sx={{ mr: 2 }} />
          Edit
        </MenuItem>

        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          <Iconify icon="eva:trash-2-outline" sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Popover>
    </TableRow>
  );
}

ServiceRequestTableRow.propTypes = {
  request: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
  onSelectRow: PropTypes.func.isRequired,
  onEditRow: PropTypes.func.isRequired,
  onDeleteRow: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
};
