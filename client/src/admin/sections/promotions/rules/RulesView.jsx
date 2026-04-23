import { useState, useEffect } from "react";
import {
  Box, Typography, Button, Alert, CircularProgress, Stack, TextField,
} from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";

import usePromotionSettings from "../hooks/usePromotionSettings";
import { RulesForm } from "./components/RulesForm";

export default function RulesView() {
  const { settings, loading, saving, error, successMsg, fetchSettings, saveSettings, clearMessages } =
    usePromotionSettings();

  const [rules, setRules] = useState(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (settings?.rules) {
      setRules(settings.rules);
    }
  }, [settings]);

  useEffect(() => {
    if (successMsg || error) {
      const timer = setTimeout(clearMessages, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, error, clearMessages]);

  const handleSave = async () => {
    await saveSettings({ rules }, notes);
    setNotes("");
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
            Promotion Rules
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage eligibility, expiration, and sorting behavior
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
            disabled={saving || !rules}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Stack>
      </Stack>

      {successMsg && <Alert severity="success" sx={{ mb: 3 }} onClose={clearMessages}>{successMsg}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={clearMessages}>{error}</Alert>}

      {rules && (
        <>
          <RulesForm data={rules} onChange={setRules} />
          <Box sx={{ maxWidth: 600, mt: 3 }}>
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