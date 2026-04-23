import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from "@mui/material";

import { formatDate, summarizeChanges } from "../../../../../utils/transformData";

/* ---------------- FORMAT LABEL ---------------- */
const formatLabel = (field) => {
  return field
    ?.replace(/\./g, " ")
    ?.replace(/([A-Z])/g, " $1")
    ?.replace(/^./, (str) => str.toUpperCase());
};

/* ---------------- CLEAN PLAN ---------------- */
const cleanPlan = (plan) => ({
  durationMonths: plan.durationMonths,
  price: plan.price,
});

export function HistoryTable({ data }) {
  if (!data || data.length === 0) {
    return <Typography>No history found</Typography>;
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        {/* ---------------- HEADER ---------------- */}
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Changed By</TableCell>
            <TableCell>Notes</TableCell>
            <TableCell>Changes</TableCell>
          </TableRow>
        </TableHead>

        {/* ---------------- BODY ---------------- */}
        <TableBody>
          {data.map((row) => {
            let changes = [];

            try {
              changes = summarizeChanges(row.changes);
            } catch (err) {
              console.error("Error parsing changes:", err);
            }

            return (
              <TableRow key={row._id}>
                <TableCell>{formatDate(row.createdAt)}</TableCell>
                <TableCell>{row.changedBy}</TableCell>
                <TableCell>{row.notes}</TableCell>

                <TableCell>
                  {changes.length === 0 ? (
                    <Typography variant="caption">No changes</Typography>
                  ) : (
                    changes.map((c, i) => {
                      /* ---------------- ARRAY (PLANS) ---------------- */
                      if (Array.isArray(c.new)) {
                        return (
                          <Box key={i} mb={1}>
                            <Typography fontWeight={600} variant="body2">
                              {formatLabel(c.field)}
                            </Typography>

                            {c.new.map((plan, idx) => {
                              const cleaned = cleanPlan(plan);

                              return (
                                <Typography
                                  key={idx}
                                  variant="caption"
                                  display="block"
                                >
                                  • {cleaned.durationMonths} month → ₹{cleaned.price}
                                </Typography>
                              );
                            })}
                          </Box>
                        );
                      }

                      /* ---------------- DEFAULT ---------------- */
                      return (
                        <Typography
                          key={i}
                          variant="caption"
                          display="block"
                        >
                          {formatLabel(c.field)}:{" "}
                          <span style={{ color: "#d32f2f" }}>
                            {String(c.old)}
                          </span>{" "}
                          →{" "}
                          <span style={{ color: "#2e7d32" }}>
                            {String(c.new)}
                          </span>
                        </Typography>
                      );
                    })
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}