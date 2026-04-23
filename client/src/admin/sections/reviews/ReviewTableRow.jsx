/* eslint-disable react/prop-types */
import { useState, useCallback } from "react";
import Box from "@mui/material/Box";
import TableRow from "@mui/material/TableRow";
import Checkbox from "@mui/material/Checkbox";
import TableCell from "@mui/material/TableCell";
import Typography from "@mui/material/Typography";
import Rating from "@mui/material/Rating";
import Avatar from "@mui/material/Avatar";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import { format } from "date-fns";

import { Iconify } from "../../components/iconify";
import Label from "../../components/label/label";

export function ReviewTableRow({
  review,
  selected,
  onSelectRow,
  onUpdateStatus,
}) {
  const reviewerName = review.reviewerId?.name || "Unknown User";
  const itemTitle = review.listingId?.name || review.listingId?.title || "Unknown Item";
  const orderId = review.orderId?._id ? `Order: ...${review.orderId._id.slice(-6)}` : "Order: N/A";

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox
            disableRipple
            checked={selected}
            onChange={() => onSelectRow(review._id)}
          />
        </TableCell>

        {/* Reviewer */}
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar alt={reviewerName}>
              {reviewerName[0]}
            </Avatar>
            <Box>
              <Typography variant="body2" noWrap>
                {reviewerName}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {review.reviewerId?.email}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        
        {/* User Type */}
        <TableCell align="center">
          <Label color={review.reviewerId?.isSeller ? "warning" : "info"}>
            {review.reviewerId?.isSeller ? "Seller" : "Buyer"}
          </Label>
        </TableCell>

        {/* Item / Order */}
        <TableCell>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {itemTitle}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {orderId}
            </Typography>
          </Box>
        </TableCell>

        {/* Rating */}
        <TableCell align="center">
          <Rating value={review.rating} readOnly size="small" />
        </TableCell>

        {/* Comment */}
        <TableCell>
          <Typography
            variant="body2"
            sx={{
              maxWidth: 300,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {review.comment}
          </Typography>
        </TableCell>

        {/* Date */}
        <TableCell>
          <Typography variant="body2">
            {format(new Date(review.createdAt), "dd MMM yyyy")}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {format(new Date(review.createdAt), "HH:mm")}
          </Typography>
        </TableCell>

        {/* Status */}
        <TableCell align="center">
          <Switch
            size="small"
            checked={review.status === "approved"}
            onChange={(event) =>
              onUpdateStatus(review._id, event.target.checked ? "approved" : "hidden")
            }
            color="success"
          />
          <Typography
            variant="caption"
            sx={{
              display: "block",
              textTransform: "capitalize",
              color: review.status === "approved" ? "success.main" : "text.secondary",
            }}
          >
            {review.status}
          </Typography>
        </TableCell>
      </TableRow>
    </>
  );
}
