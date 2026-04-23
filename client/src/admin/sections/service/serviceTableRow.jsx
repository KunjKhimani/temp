/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useCallback } from "react";
import { format } from "date-fns"; // Import format for createdAt

import Box from "@mui/material/Box";
import Popover from "@mui/material/Popover";
import TableRow from "@mui/material/TableRow";
import Checkbox from "@mui/material/Checkbox";
import MenuList from "@mui/material/MenuList";
import TableCell from "@mui/material/TableCell";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack"; // Import Stack for provider info

//components
import { Iconify } from "../../components/iconify";
import Label from "../../components/label/Label";

const BASE_IMAGE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ----------------------------------------------------------------------

export function ServiceTableRow({
  service,
  selected,
  onSelectRow,
  onEditRow,
  onDeleteRow,
  onViewDetails,
}) {
  const [openPopover, setOpenPopover] = useState(null);

  const handleOpenPopover = useCallback(
    (event) => setOpenPopover(event.currentTarget),
    []
  );
  const handleClosePopover = useCallback(() => setOpenPopover(null), []);

  const getServiceStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "error";
      case "paused":
        return "warning";
      case "pending_verification":
        return "info";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        {/* Checkbox */}
        <TableCell padding="checkbox">
          <Checkbox
            disableRipple
            checked={selected}
            onChange={() => onSelectRow(service._id)}
          />
        </TableCell>

        {/* Title */}
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="subtitle2">{service.title}</Typography>
          </Box>
        </TableCell>

        {/* Provider (Created By) */}
        <TableCell>
          {service.createdBy ? (
            <Typography variant="body2" noWrap>
              {service.createdBy.accountType === "individual"
                ? service.createdBy.name || service.createdBy.email
                : service.createdBy.companyName ||
                  service.createdBy.representativeName ||
                  service.createdBy.name ||
                  service.createdBy.email}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ color: "text.disabled" }}>
              N/A
            </Typography>
          )}
        </TableCell>

        {/* Category */}
        <TableCell>
          <Typography variant="body2" noWrap>
            {service.category}
          </Typography>
        </TableCell>

        {/* Type */}
        <TableCell>
          <Label
            color={service.type === "online" ? "primary" : "secondary"}
            sx={{ textTransform: "capitalize" }}
          >
            {service.type}
          </Label>
        </TableCell>

        {/* Price */}
        <TableCell align="center">
          <Typography variant="body2">
            {service.priceType === "fixed"
              ? `$${service.price.toFixed(2)}`
              : `$${service.price.toFixed(2)}/${service.priceType}`}
          </Typography>
        </TableCell>

        {/* Status */}
        <TableCell align="center">
          <Label
            color={getServiceStatusColor(service.status)}
            sx={{ textTransform: "capitalize" }}
          >
            {service.status.replace(/_/g, " ")}
          </Label>
        </TableCell>

        {/* Created At */}
        <TableCell align="right">
          <Typography variant="body2">
            {service.createdAt
              ? format(new Date(service.createdAt), "dd MMM yyyy")
              : "N/A"}
          </Typography>
        </TableCell>

        {/* Actions Menu */}
        <TableCell align="right">
          <IconButton onClick={handleOpenPopover}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Popover Actions Menu */}
      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 160, mt: -0.5 } } }}
      >
        <MenuList sx={{ p: 0.5 }}>
          {/* View Details Action */}
          <MenuItem
            onClick={() => {
              onViewDetails(service._id);
              handleClosePopover();
            }}
          >
            <Iconify icon="solar:eye-bold" sx={{ mr: 1 }} />
            View Details
          </MenuItem>
          {/* Edit Action */}
          <MenuItem
            onClick={() => {
              onEditRow(service._id);
              handleClosePopover();
            }}
          >
            <Iconify icon="solar:pen-bold" sx={{ mr: 1 }} />
            Edit Service
          </MenuItem>
          {/* Delete Action */}
          <MenuItem
            onClick={() => {
              onDeleteRow(service._id);
              handleClosePopover();
            }}
            sx={{ color: "error.main" }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 1 }} />
            Delete Service
          </MenuItem>
        </MenuList>
      </Popover>
    </>
  );
}
