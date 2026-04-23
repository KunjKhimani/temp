import { useState } from "react";
import PropTypes from "prop-types";
import { format } from "date-fns";

import {
  TableRow,
  TableCell,
  Typography,
  MenuItem,
  IconButton,
  Checkbox,
  Popover,
  Stack,
} from "@mui/material";

const getUserDisplayName = (user) => {
  if (!user) return "N/A";
  switch (user.accountType) {
    case "individual":
      return user.name || "N/A";
    case "agency":
      return user.companyName || user.representativeName || "N/A";
    default:
      return user.name || "N/A";
  }
};
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

// ----------------------------------------------------------------------

export function OrderTableRow({
  order,
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

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onChange={onSelectRow} />
        </TableCell>

        <TableCell component="th" scope="row" padding="none">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="subtitle2" noWrap>
              {order._id.slice(-6)}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell align="left">{getUserDisplayName(order.buyer)}</TableCell>
        <TableCell align="left">{getUserDisplayName(order.seller)}</TableCell>
        <TableCell align="left">{order.service?.title || "N/A"}</TableCell>
        <TableCell align="left">
          ${order.totalPrice?.toFixed(2) || "0.00"}
        </TableCell>
        <TableCell align="left">{order.status}</TableCell>
        <TableCell align="left">
          {order.createdAt
            ? format(new Date(order.createdAt), "dd MMM yyyy")
            : "N/A"}
        </TableCell>

        <TableCell align="right">
          <IconButton onClick={handleOpenMenu}>
            <MoreVertIcon />
          </IconButton>
        </TableCell>
      </TableRow>

      <Popover
        open={!!open}
        anchorEl={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: { width: 140, p: 1 },
        }}
      >
        <MenuItem onClick={handleView}>
          <EditIcon sx={{ mr: 2 }} />
          View Details
        </MenuItem>

        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 2 }} />
          Edit
        </MenuItem>

        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          <DeleteIcon sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Popover>
    </>
  );
}

OrderTableRow.propTypes = {
  order: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
  onSelectRow: PropTypes.func.isRequired,
  onEditRow: PropTypes.func.isRequired,
  onDeleteRow: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
};
