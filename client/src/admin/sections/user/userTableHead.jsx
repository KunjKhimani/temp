/* eslint-disable react/prop-types */
import Box from "@mui/material/Box";
import TableRow from "@mui/material/TableRow";
import Checkbox from "@mui/material/Checkbox";
import TableHead from "@mui/material/TableHead";
import TableCell from "@mui/material/TableCell";
import TableSortLabel from "@mui/material/TableSortLabel";

import { visuallyHidden } from "./utils"; // Adjust path

// ----------------------------------------------------------------------

// *** Refined Header Configuration - Fewer Columns ***
export const headCells = [
  // Keep Name, Email, Acc Type, Seller Status, Seller Verification Status, Actions
  { id: "name", label: "Name", align: "left", minWidth: 170 },
  { id: "email", label: "Email", align: "left", minWidth: 180 },
  { id: "accountType", label: "Acc Type", align: "left", width: 120 },
  { id: "isSeller", label: "Seller?", align: "center", width: 80 },
  { id: "isVerified", label: "Verified?", align: "center", width: 90 }, // Seller verification
  // { id: 'isEmailVerified', label: 'Email Verified?', align: 'center', width: 120 }, // Removed
  // { id: 'isAdmin', label: 'Admin?', align: 'center', width: 80 },                // Removed
  // { id: 'createdAt', label: 'Created At', align: 'left', minWidth: 120 },         // Removed previously
  { id: "status", label: "Status", align: "center", width: 100 },
  { id: "actions", label: "Actions", align: "right", width: 80 },
];

export function UserTableHead({
  currentParams = {}, // Provide a default empty object
  onSort,
  rowCount,
  numSelected,
  onSelectAllRows,
}) {
  const { sortBy, sortOrder } = currentParams; // This line will now be safe

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
              sortDirection={sortBy === headCell.id ? sortOrder : false}
              sx={{
                width: headCell.width,
                minWidth: headCell.minWidth,
                whiteSpace: "nowrap",
              }} // Added whiteSpace
            >
              {isSortable ? (
                <TableSortLabel
                  hideSortIcon={false}
                  active={sortBy === headCell.id}
                  direction={sortBy === headCell.id ? sortOrder : "asc"}
                  onClick={createSortHandler(headCell.id)}
                >
                  {headCell.label}
                  {sortBy === headCell.id ? (
                    <Box sx={{ ...visuallyHidden }}>
                      {sortOrder === "desc"
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
