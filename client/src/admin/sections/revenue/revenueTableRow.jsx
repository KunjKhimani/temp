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
  //Greedily try to find any name field
  return user.companyName || user.name || user.representativeName || "N/A";
};
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Iconify } from "../../components/iconify";

// ----------------------------------------------------------------------

export function RevenueTableRow({
  order,
  selected,
  onSelectRow,
  onViewDetails,
}) {
  const [open, setOpen] = useState(null);

  const handleOpenMenu = (event) => {
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const handleView = () => {
    onViewDetails(order);
    handleCloseMenu();
  };

  const getPurchasedItemLabel = () => {
    // 1. Explicit title from backend (if available)
    if (order.purchasedItem?.title) return order.purchasedItem.title;

    // 2. Product Orders
    if (order.itemModel === "ProductOrder") {
      const firstItem = order.purchasedItem?.items?.[0];
      return firstItem?.nameAtOrder || "Product Order";
    }

    // 3. Service Request Orders
    if (order.itemModel === "ServiceRequestOrder") {
      return (
        order.purchasedItem?.serviceRequestId?.title ||
        `Service Request #${order.purchasedItem?._id?.slice(-6).toUpperCase() || "N/A"}`
      );
    }

    // 4. Normal Service Orders (itemModel = "Order")
    if (order.itemModel === "Order") {
      return order.purchasedItem?.service?.title || "Service";
    }

    // 5. Direct requested products or service requests (from TransactionLog)
    if (order.itemModel === "RequestedProduct") {
       return order.purchasedItem?.name || "Requested Product";
    }

    if (order.itemModel === "ServiceRequest") {
       return order.purchasedItem?.title || "Service Request";
    }

    return order.purchasedItem?.title || "N/A";
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
              {order.transactionId?.slice(-8) || order._id.slice(-6)}
            </Typography>
          </Stack>
        </TableCell>
 
        <TableCell align="left">{getUserDisplayName(order.buyer)}</TableCell>
        <TableCell align="left">{getUserDisplayName(order.seller)}</TableCell>
 
        <TableCell align="left" sx={{ textTransform: "capitalize" }}>
          {order.type || "N/A"}
        </TableCell>
 
        <TableCell align="left">{getPurchasedItemLabel()}</TableCell>
 
        <TableCell align="left">
          ${order.totalAmount?.toFixed(2) || "0.00"}
        </TableCell>
 
        <TableCell align="left">
          ${order.adminCommission?.toFixed(2) || "0.00"}
        </TableCell>
 
        <TableCell align="left">
          ${order.sellerCommission?.toFixed(2) || "0.00"}
        </TableCell>
 
        <TableCell align="left" sx={{ textTransform: "capitalize" }}>
          {(order.purchasedItem?.status || order.status || "N/A").replace(/-/g, " ")}
        </TableCell>
 
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
          sx: { width: 160, p: 1 },
        }}
      >
        <MenuItem onClick={handleView}>
          <Iconify icon="solar:eye-bold" sx={{ mr: 2 }} />
          View Details
        </MenuItem>
      </Popover>
    </>
  );
}

RevenueTableRow.propTypes = {
  order: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
  onSelectRow: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
};
