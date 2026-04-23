/* eslint-disable react/prop-types */
import Box from "@mui/material/Box";
import TableRow from "@mui/material/TableRow";
import Checkbox from "@mui/material/Checkbox";
import TableHead from "@mui/material/TableHead";
import TableCell from "@mui/material/TableCell";
import TableSortLabel from "@mui/material/TableSortLabel";

import { visuallyHidden } from "./utils"; // Adjust path to local utils

// ----------------------------------------------------------------------

export const headCells = [
  { id: "title", label: "Title", align: "left", width: 80 },
  { id: "createdBy", label: "Provider", align: "left", width: 80 },
  { id: "category", label: "Category", align: "left", width: 60 },
  { id: "type", label: "Type", align: "center", width: 80 },
  { id: "price", label: "Price", align: "center", width: 80 },
  { id: "status", label: "Status", align: "center", width: 30 },
  { id: "createdAt", label: "Created At", align: "right", width: 100 },
  { id: "actions", label: "Actions", align: "right", width: 30 },
];

export function ServiceTableHead({
  order, // Directly use order and orderBy from props
  orderBy,
  rowCount,
  numSelected,
  onSort,
  onSelectAllRows,
}) {
  const createSortHandler = (property) => () => {
    onSort(property);
  };

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

        {headCells.map((headCell) => {
          const isSortable = !["actions"].includes(headCell.id);
          return (
            <TableCell
              key={headCell.id}
              align={headCell.align || "left"}
              sortDirection={orderBy === headCell.id ? order : false}
              sx={{
                width: headCell.width,
                minWidth: headCell.minWidth,
                whiteSpace: "nowrap",
              }}
            >
              {isSortable ? (
                <TableSortLabel
                  hideSortIcon={false}
                  active={orderBy === headCell.id}
                  direction={orderBy === headCell.id ? order : "asc"}
                  onClick={createSortHandler(headCell.id)}
                >
                  {headCell.label}
                  {orderBy === headCell.id ? (
                    <Box sx={{ ...visuallyHidden }}>
                      {order === "desc"
                        ? "sorted descending"
                        : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              ) : (
                headCell.label
              )}
            </TableCell>
          );
        })}
      </TableRow>
    </TableHead>
  );
}
