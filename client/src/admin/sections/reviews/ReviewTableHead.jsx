/* eslint-disable react/prop-types */
import Box from "@mui/material/Box";
import TableRow from "@mui/material/TableRow";
import Checkbox from "@mui/material/Checkbox";
import TableHead from "@mui/material/TableHead";
import TableCell from "@mui/material/TableCell";
import TableSortLabel from "@mui/material/TableSortLabel";

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

export const headCells = [
  { id: "reviewer", label: "Reviewer", align: "left", minWidth: 150 },
  { id: "userType", label: "User Type", align: "center", width: 100 },
  { id: "item", label: "Item / Order", align: "left", minWidth: 200 },
  { id: "rating", label: "Rating", align: "center", width: 100 },
  { id: "comment", label: "Comment", align: "left", minWidth: 250 },
  { id: "createdAt", label: "Date", align: "left", width: 150 },
  { id: "status", label: "Status", align: "center", width: 120 },
];

export function ReviewTableHead({
  currentParams = {},
  onSort,
  rowCount,
  numSelected,
  onSelectAllRows,
}) {
  const { sortBy, sortOrder } = currentParams;

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
          const isSortable = !["actions", "reviewer", "item"].includes(headCell.id);
          return (
            <TableCell
              key={headCell.id}
              align={headCell.align || "left"}
              sortDirection={sortBy === headCell.id ? sortOrder : false}
              sx={{
                width: headCell.width,
                minWidth: headCell.minWidth,
                whiteSpace: "nowrap",
              }}
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
