import PropTypes from "prop-types";
import {
  Box, Card, CardContent, CardHeader, Typography, Switch,
  FormControlLabel, TextField, Stack, Divider, InputAdornment,
  Chip, Alert,
} from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

const SORT_KEYS = ["special_deal", "featured", "community_offer", "normal"];
const SORT_LABELS = {
  special_deal: "Special Deal",
  featured: "Featured",
  community_offer: "Community Offer",
  normal: "Normal",
};

export function RulesForm({ data, onChange }) {
  if (!data) return null;

  const handleToggle = (field) => (e) => onChange({ ...data, [field]: e.target.checked });
  const handleEligToggle = (field) => (e) =>
    onChange({ ...data, eligibility: { ...data.eligibility, [field]: e.target.checked } });

  const handleNumberField = (field) => (e) => {
    const val = parseFloat(e.target.value);
    onChange({ ...data, [field]: isNaN(val) ? 0 : val });
  };

  // Move sort item up/down
  const moveSortItem = (index, direction) => {
    const arr = [...(data.sortPriority || SORT_KEYS)];
    const target = index + direction;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    onChange({ ...data, sortPriority: arr });
  };

  const sortPriority = data.sortPriority || SORT_KEYS;

  return (
    <Stack spacing={3} sx={{ maxWidth: 800 }}>
      {/* General */}
      <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <CardHeader
          title={<Typography variant="h6" fontWeight={700}>General Rules</Typography>}
          subheader="Platform-wide promotion behavior"
        />
        <Divider />
        <CardContent>
          <Stack spacing={2.5}>
            <Box sx={{ maxWidth: 300 }}>
              <TextField
                label="Minimum Paid Promotion Fee"
                type="number"
                value={data.minimumPaidPromotionFee ?? ""}
                onChange={handleNumberField("minimumPaidPromotionFee")}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={data.allowMultiplePromotions}
                  onChange={handleToggle("allowMultiplePromotions")}
                  size="small"
                />
              }
              label={<Typography variant="body2">Allow Multiple Promotions per Listing</Typography>}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Auto-expiry */}
      <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <CardHeader
          title={<Typography variant="h6" fontWeight={700}>Auto-Expiration</Typography>}
          subheader="Control which promotions expire automatically"
        />
        <Divider />
        <CardContent>
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={data.autoExpireFeatured}
                  onChange={handleToggle("autoExpireFeatured")}
                  size="small"
                />
              }
              label={<Typography variant="body2">Auto-Expire Featured</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={data.autoExpireCommunity}
                  onChange={handleToggle("autoExpireCommunity")}
                  size="small"
                />
              }
              label={<Typography variant="body2">Auto-Expire Community Offers</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={data.autoExpireSpecialDeal}
                  onChange={handleToggle("autoExpireSpecialDeal")}
                  size="small"
                />
              }
              label={<Typography variant="body2">Auto-Expire Special Deals</Typography>}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Sort Priority */}
      <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <CardHeader
          title={<Typography variant="h6" fontWeight={700}>Sort Priority</Typography>}
          subheader="Order in which promotions are displayed (higher = more prominent)"
        />
        <Divider />
        <CardContent>
          <Stack spacing={1}>
            {sortPriority.map((key, index) => (
              <Box
                key={key}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <DragIndicatorIcon sx={{ color: "text.disabled", cursor: "grab" }} />
                <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                  {SORT_LABELS[key] || key}
                </Typography>
                <Chip label={`#${index + 1}`} size="small" variant="outlined" />
                <Stack direction="row" spacing={0.5}>
                  <Chip
                    label="↑"
                    size="small"
                    onClick={() => moveSortItem(index, -1)}
                    disabled={index === 0}
                    sx={{ cursor: "pointer", minWidth: 32 }}
                  />
                  <Chip
                    label="↓"
                    size="small"
                    onClick={() => moveSortItem(index, 1)}
                    disabled={index === sortPriority.length - 1}
                    sx={{ cursor: "pointer", minWidth: 32 }}
                  />
                </Stack>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Eligibility */}
      <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <CardHeader
          title={<Typography variant="h6" fontWeight={700}>Eligibility</Typography>}
          subheader="Control which listing types can use promotions"
        />
        <Divider />
        <CardContent>
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={data.eligibility?.allowOffersPromotion}
                  onChange={handleEligToggle("allowOffersPromotion")}
                  size="small"
                />
              }
              label={<Typography variant="body2">Allow Promotions for Offers</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={data.eligibility?.allowRequestsPromotion}
                  onChange={handleEligToggle("allowRequestsPromotion")}
                  size="small"
                />
              }
              label={<Typography variant="body2">Allow Promotions for Requests</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={data.eligibility?.allowCommunityForRequests}
                  onChange={handleEligToggle("allowCommunityForRequests")}
                  size="small"
                />
              }
              label={<Typography variant="body2">Allow Community Offer for Requests</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={data.eligibility?.allowSpecialDealForRequests}
                  onChange={handleEligToggle("allowSpecialDealForRequests")}
                  size="small"
                />
              }
              label={<Typography variant="body2">Allow Special Deal for Requests</Typography>}
            />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

RulesForm.propTypes = {
  data: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};