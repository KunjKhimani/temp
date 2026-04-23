import { useState } from "react";
import PropTypes from "prop-types";
import { format } from "date-fns";

import {
  TableRow,
  TableCell,
  Checkbox,
  IconButton,
  Popover,
  MenuItem,
  Typography,
} from "@mui/material";

import { Iconify } from "../../components/iconify";
import Label from "../../components/label/label";

// ----------------------------------------------------------------------

export function RequestedProductTableRow({
  product,
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
    onEditRow(product._id);
    handleCloseMenu();
  };

  const handleDelete = () => {
    onDeleteRow(product._id);
    handleCloseMenu();
  };

  const handleView = () => {
    onViewDetails(product._id);
    handleCloseMenu();
  };

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onChange={onSelectRow} />
        </TableCell>

        <TableCell component="th" scope="row" padding="none">
          <Typography variant="subtitle2" noWrap>
            {product.name}
          </Typography>
        </TableCell>

        <TableCell>{product.category}</TableCell>

        <TableCell align="right">{product.quantity}</TableCell>

        <TableCell>
          <Label
            color={(product.status === "pending" && "warning") || "success"}
          >
            {product.status}
          </Label>
        </TableCell>

        <TableCell>
          {format(new Date(product.createdAt), "dd MMM yyyy")}
        </TableCell>

        <TableCell align="right">
          <IconButton onClick={handleOpenMenu}>
            <Iconify icon="eva:more-vertical-fill" />
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
    </>
  );
}

RequestedProductTableRow.propTypes = {
  product: PropTypes.object,
  onDeleteRow: PropTypes.func,
  onEditRow: PropTypes.func,
  onSelectRow: PropTypes.func,
  onViewDetails: PropTypes.func,
  selected: PropTypes.bool,
};
