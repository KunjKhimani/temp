import PropTypes from "prop-types";
import {
  Box,
  Checkbox,
  TableHead,
  TableRow,
  TableCell,
  TableSortLabel,
} from "@mui/material";
import { visuallyHidden } from "@mui/utils";

// ----------------------------------------------------------------------

export const headCells = [
  { id: "title", numeric: false, disablePadding: true, label: "Title" },
  {
    id: "createdBy",
    numeric: false,
    disablePadding: false,
    label: "Created By",
  },
  { id: "category", numeric: false, disablePadding: false, label: "Category" },
  { id: "status", numeric: false, disablePadding: false, label: "Status" },
  { id: "requestType", numeric: false, disablePadding: false, label: "Type" },
  {
    id: "budget.min",
    numeric: true,
    disablePadding: false,
    label: "Min Budget",
  },
  {
    id: "budget.max",
    numeric: true,
    disablePadding: false,
    label: "Max Budget",
  },
  {
    id: "createdAt",
    numeric: false,
    disablePadding: false,
    label: "Created At",
  },
  { id: "", numeric: false, disablePadding: false, label: "Actions" }, // For actions like edit, delete, view
];

export function ServiceRequestTableHead({
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
            {headCell.id === "" ? ( // For the actions column, no sort
              headCell.label
            ) : (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : "asc"}
                onClick={() => onSort(headCell.id)}
              >
                {headCell.label}
                {orderBy === headCell.id ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === "desc"
                      ? "sorted descending"
                      : "sorted ascending"}
                  </Box>
                ) : null}
              </TableSortLabel>
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

ServiceRequestTableHead.propTypes = {
  order: PropTypes.oneOf(["asc", "desc"]),
  orderBy: PropTypes.string,
  rowCount: PropTypes.number,
  numSelected: PropTypes.number,
  onSort: PropTypes.func,
  onSelectAllRows: PropTypes.func,
};
