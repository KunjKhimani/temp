/* eslint-disable react-refresh/only-export-components */
import PropTypes from "prop-types";
import {
  Box,
  Checkbox,
  TableRow,
  TableCell,
  TableHead,
  TableSortLabel,
} from "@mui/material";

// ----------------------------------------------------------------------

export const headCells = [
  { id: "orderId", label: "Order ID", alignRight: false },
  { id: "buyer", label: "Buyer", alignRight: false },
  { id: "seller", label: "Seller", alignRight: false },
  { id: "serviceTitle", label: "Service", alignRight: false },
  { id: "totalPrice", label: "Total Price", alignRight: false },
  { id: "status", label: "Status", alignRight: false },
  { id: "createdAt", label: "Created At", alignRight: false },
];

// ----------------------------------------------------------------------

export function OrderTableHead({
  order,
  orderBy,
  rowCount,
  numSelected,
  onSort,
  onSelectAllRows,
}) {
  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={(event) => onSelectAllRows(event.target.checked)}
          />
        </TableCell>

        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.alignRight ? "right" : "left"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              hideSortIcon
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={() => onSort(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box sx={{ ...visuallyHidden }}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
        <TableCell align="right">Actions</TableCell>
      </TableRow>
    </TableHead>
  );
}

OrderTableHead.propTypes = {
  order: PropTypes.oneOf(["asc", "desc"]),
  orderBy: PropTypes.string,
  rowCount: PropTypes.number,
  numSelected: PropTypes.number,
  onSort: PropTypes.func,
  onSelectAllRows: PropTypes.func,
};

// ----------------------------------------------------------------------

const visuallyHidden = {
  border: 0,
  margin: -1,
  padding: 0,
  width: "1px",
  height: "1px",
  overflow: "hidden",
  position: "absolute",
  whiteSpace: "nowrap",
  clip: "rect(0 0 0 0)",
};
