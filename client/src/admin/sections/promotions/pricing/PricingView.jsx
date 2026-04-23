import { useState, useEffect } from "react";
import {
  Box, Grid, Typography, Button, Alert, CircularProgress,
  Stack, TextField,
} from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";

import usePromotionSettings from "../hooks/usePromotionSettings";
import { FeaturedPricingCard } from "./components/FeaturedPricingCard";
import { SpecialDealCard } from "./components/SpecialDealCard";
import { CommunityOfferCard } from "./components/CommunityOfferCard";

export default function PricingView() {
  const { settings, loading, saving, error, successMsg, fetchSettings, saveSettings, clearMessages } =
    usePromotionSettings();

  const [featured, setFeatured] = useState(null);
  const [specialDeal, setSpecialDeal] = useState(null);
  const [communityOffer, setCommunityOffer] = useState(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (settings) {
      setFeatured(settings.featured);
      setSpecialDeal(settings.specialDeal);
      setCommunityOffer(settings.communityOffer);
    }
  }, [settings]);

  useEffect(() => {
    if (successMsg || error) {
      const timer = setTimeout(clearMessages, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, error, clearMessages]);

  const handleSave = async () => {
    await saveSettings({ featured, specialDeal, communityOffer }, notes);
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
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Promotion Pricing
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Configure pricing plans for all promotion types
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchSettings}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
            onClick={handleSave}
            disabled={saving || !featured}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Stack>
      </Stack>

      {/* Feedback */}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={clearMessages}>
          {successMsg}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearMessages}>
          {error}
        </Alert>
      )}

      {featured && (
        <>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={4}>
              <FeaturedPricingCard data={featured} onChange={setFeatured} />
            </Grid>
            <Grid item xs={12} md={4}>
              <SpecialDealCard data={specialDeal} onChange={setSpecialDeal} />
            </Grid>
            <Grid item xs={12} md={4}>
              <CommunityOfferCard data={communityOffer} onChange={setCommunityOffer} />
            </Grid>
          </Grid>

          {/* Notes */}
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