import { useState, useEffect } from "react";
import {
  Box, Typography, Button, Alert, CircularProgress, Stack, TextField,
} from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";

import usePromotionSettings from "../hooks/usePromotionSettings";
import { CommissionForm } from "./components/CommissionForm";

export default function CommissionView() {
  const { settings, loading, saving, error, successMsg, fetchSettings, saveSettings, clearMessages } =
    usePromotionSettings();

  const [commission, setCommission] = useState(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (settings?.commission) {
      setCommission(settings.commission);
    }
  }, [settings]);

  useEffect(() => {
    if (successMsg || error) {
      const timer = setTimeout(clearMessages, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, error, clearMessages]);

  const handleSave = async () => {
  let cleaned = { ...commission };

  if (commission.type === "flat") {
    delete cleaned.standard;
    delete cleaned.featured;
    delete cleaned.specialDeal;
    delete cleaned.community;
  }

  if (commission.type === "percentage") {
    delete cleaned.flatAmount;
  }

  await saveSettings({ commission: cleaned }, notes);
};

  if (loading && !settings) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Platform Fees
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Configure how platform fees are calculated
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchSettings} disabled={loading}>
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
            onClick={handleSave}
            disabled={saving || !commission}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Stack>
      </Stack>

      {successMsg && <Alert severity="success" sx={{ mb: 3 }} onClose={clearMessages}>{successMsg}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={clearMessages}>{error}</Alert>}

      {commission && (
        <>
          <Box sx={{ maxWidth: 860, mb: 3 }}>
            <CommissionForm data={commission} onChange={setCommission} />
          </Box>
          <Box sx={{ maxWidth: 600 }}>
            <TextField
              label="Change Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
              fullWidth
              size="small"
              placeholder="Describe what you changed and why..."
            />
          </Box>
        </>
      )}
    </Box>
  );
}