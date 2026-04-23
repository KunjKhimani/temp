import { useEffect } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";

import usePromotionSettings from "../hooks/usePromotionSettings";
import { HistoryTable } from "./components/HistoryTable";

export default function HistoryView() {
  const { history, fetchHistory, loading } = usePromotionSettings();

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Promotion History
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <HistoryTable data={history} />
      )}
    </Box>
  );
}