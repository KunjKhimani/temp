import PropTypes from "prop-types";
import {
  Box,
  Checkbox,
  TableHead,
  TableRow,
  TableCell,
  TableSortLabel,
} from "@mui/material";

// ----------------------------------------------------------------------

export const headCells = [
  { id: "name", numeric: false, disablePadding: true, label: "Product Name" },
  { id: "category", numeric: false, disablePadding: false, label: "Category" },
  { id: "quantity", numeric: true, disablePadding: false, label: "Quantity" },
  { id: "status", numeric: false, disablePadding: false, label: "Status" },
  {
    id: "createdAt",
    numeric: false,
    disablePadding: false,
    label: "Requested Date",
  },
  { id: "", numeric: false, disablePadding: false, label: "" }, // For actions
];

export function RequestedProductTableHead({
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
            align={headCell.numeric ? "right" : "left"}
            padding={headCell.disablePadding ? "none" : "normal"}
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
      </TableRow>
    </TableHead>
  );
}

RequestedProductTableHead.propTypes = {
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
