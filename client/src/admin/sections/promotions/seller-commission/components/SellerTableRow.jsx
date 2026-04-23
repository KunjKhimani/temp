import PropTypes from "prop-types";
import { useState } from "react";
import {
  TableRow,
  TableCell,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export default function SellerTableRow({ seller, onOpenAction, onDelete }) {
  const { name, email, createdAt, subscription, accountType, companyName, representativeName } = seller;
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleApplyFees = () => {
    handleCloseMenu();
    onOpenAction(seller);
  };

  const handleDelete = () => {
    handleCloseMenu();
    if (onDelete) onDelete(seller);
  };

  const getUserDisplayName = () => {
    if (accountType === "agency") {
      return companyName || representativeName || email;
    }
    return name || email;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <TableRow hover>
      <TableCell component="th" scope="row">
        <Typography variant="subtitle2" noWrap>
          {getUserDisplayName()}
        </Typography>
      </TableCell>

      <TableCell>{email}</TableCell>

      <TableCell>{formatDate(createdAt)}</TableCell>

      <TableCell>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {subscription?.plan?.replace("_", " ") || "N/A"}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography
          variant="body2"
          sx={{
            fontWeight: seller.isOverRided ? 600 : 400,
            color: seller.isOverRided ? "primary.main" : "text.secondary",
          }}
        >
          {seller.isOverRided ? (seller.override?.percentage != null ? `${seller.override.percentage}%` : "-") : "Default"}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {seller.isOverRided && seller.override.untilDate
            ? formatDate(seller.override.untilDate)
            : seller.isOverRided
            ? "Permanent"
            : "-"}
        </Typography>
      </TableCell>

      <TableCell align="right">
        <IconButton onClick={handleOpenMenu}>
          <MoreVertIcon />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          anchorOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <MenuItem onClick={handleApplyFees}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Apply Fees" />
          </MenuItem>

          <MenuItem onClick={handleDelete} sx={{ color: "error.main" }} disabled={!seller.isOverRided}>
            <ListItemIcon>
              <DeleteOutlineIcon fontSize="small" sx={{ color: "error.main" }} />
            </ListItemIcon>
            <ListItemText primary="Delete" />
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
}

SellerTableRow.propTypes = {
  seller: PropTypes.object,
  onOpenAction: PropTypes.func,
  onDelete: PropTypes.func,
};
