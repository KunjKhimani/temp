/* eslint-disable no-unused-vars */
import { useState } from "react";
import PropTypes from "prop-types";
import {
  Stack,
  Avatar,
  Popover,
  Checkbox,
  TableRow,
  MenuItem,
  TableCell,
  Typography,
  IconButton,
} from "@mui/material";
// import Label from "../../../admin/components/label/label"; // Corrected path for Label
import { Iconify } from "../../components/iconify"; // Assuming this component exists
import Label from "../../components/label/label";

// ----------------------------------------------------------------------

ProductTableRow.propTypes = {
  product: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  handleClick: PropTypes.func,
  onDelete: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
};

export default function ProductTableRow({
  product,
  selected,
  handleClick,
  onDelete,
  onViewDetails,
}) {
  const {
    _id,
    name,
    category,
    price,
    priceUnit,
    stock,
    status,
    images,
    createdBy,
    createdAt,
  } = product;

  const [open, setOpen] = useState(null);

  const handleOpenMenu = (event) => {
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const handleEdit = () => {
    handleCloseMenu();
    onViewDetails(product); // Re-use view details for edit as it opens the modal
  };

  const handleDelete = () => {
    handleCloseMenu();
    onDelete(_id);
  };

  const handleView = () => {
    handleCloseMenu();
    onViewDetails(product);
  };

  const getStatusColor = (productStatus) => {
    switch (productStatus) {
      case "active":
        return "success";
      case "out-of-stock":
        return "error";
      case "inactive":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox disableRipple checked={selected} onChange={handleClick} />
        </TableCell>

        <TableCell component="th" scope="row" padding="none">
          <Stack direction="row" alignItems="center" spacing={2}>
            {/* <Avatar
              alt={name}
              src={
                images && images.length > 0
                  ? images[0]
                  : "/assets/images/placeholder.png"
              }
              variant="rounded"
              sx={{ width: 48, height: 48 }}
            /> */}
            <Typography variant="subtitle2" noWrap>
              {name}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell>{category}</TableCell>

        <TableCell>{`${price} ${priceUnit}`}</TableCell>

        <TableCell>{stock}</TableCell>

        <TableCell>
          <Label color={getStatusColor(status)}>{status}</Label>
        </TableCell>

        <TableCell>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar
              alt={createdBy?.name || createdBy?.companyName || "N/A"}
              src={
                createdBy?.profilePicture || "/assets/icons/avatar_default.jpg"
              }
              sx={{ width: 24, height: 24 }}
            />
            <Typography variant="body2" noWrap>
              {createdBy?.companyName || createdBy?.name || "N/A"}
            </Typography>
          </Stack>
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
