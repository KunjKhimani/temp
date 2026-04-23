import PropTypes from "prop-types";
import {
  Box, Card, CardContent, CardHeader, Typography, Switch,
  FormControlLabel, TextField, Stack, Divider, InputAdornment,
} from "@mui/material";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";

export function SpecialDealCard({ data, onChange }) {
  const handleToggle = (field) => (e) => onChange({ ...data, [field]: e.target.checked });

  const handleNumber = (field) => (e) => {
    const val = parseFloat(e.target.value);
    onChange({ ...data, [field]: isNaN(val) ? 0 : val });
  };

  const handleNullableNumber = (field) => (e) => {
    const val = e.target.value === "" ? null : parseFloat(e.target.value);
    onChange({ ...data, [field]: isNaN(val) ? null : val });
  };

  return (
    <Card
  sx={{
    borderRadius: 3,
    border: "1px solid",
    borderColor: data.enabled ? "warning.light" : "divider",
    transition: "border-color 0.2s",

    // ✅ FIX HERE
    height: 450,
    display: "flex",
    flexDirection: "column",
  }}
>
      <CardHeader
        avatar={
          <Box
            sx={{
              width: 40, height: 40, borderRadius: 2,
              bgcolor: "warning.lighter",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <LocalOfferOutlinedIcon sx={{ color: "warning.main" }} />
          </Box>
        }
        title={<Typography variant="h6" fontWeight={700}>Special Deal</Typography>}
        subheader="Highlight listings with discount pricing"
        action={
          <FormControlLabel
            control={<Switch checked={data.enabled} onChange={handleToggle("enabled")} color="warning" size="small" />}
            label={<Typography variant="caption">{data.enabled ? "Enabled" : "Disabled"}</Typography>}
            labelPlacement="start"
            sx={{ mr: 0 }}
          />
        }
      />
      <Divider />
       <CardContent
        sx={{
          flex: 1,
          overflowY: "auto",
          pr: 1,

          // OPTIONAL: NICE SCROLLBAR
          "&::-webkit-scrollbar": {
            width: 6,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#ccc",
            borderRadius: 10,
          },
        }}
      >
        <Stack spacing={2.5}>
          <TextField
            label="Badge Label"
            value={data.badgeLabel || ""}
            onChange={(e) => onChange({ ...data, badgeLabel: e.target.value })}
            size="small"
            fullWidth
            disabled={!data.enabled}
          />

          <TextField
            label="Activation Fee"
            type="number"
            value={data.activationFee ?? ""}
            onChange={handleNumber("activationFee")}
            size="small"
            fullWidth
            disabled={!data.enabled}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ min: 0, step: 0.01 }}
          />

          <TextField
            label="Expiration Days (blank = no expiry)"
            type="number"
            value={data.expirationDays ?? ""}
            onChange={handleNullableNumber("expirationDays")}
            size="small"
            fullWidth
            disabled={!data.enabled}
            inputProps={{ min: 1 }}
            helperText="Leave empty for no auto-expiration"
          />

          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={data.requireOriginalPrice}
                  onChange={handleToggle("requireOriginalPrice")}
                  size="small"
                  color="warning"
                  disabled={!data.enabled}
                />
              }
              label={<Typography variant="body2">Require Original Price</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={data.requireDiscountedPrice}
                  onChange={handleToggle("requireDiscountedPrice")}
                  size="small"
                  color="warning"
                  disabled={!data.enabled}
                />
              }
              label={<Typography variant="body2">Require Discounted Price</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={data.allowForRequests}
                  onChange={handleToggle("allowForRequests")}
                  size="small"
                  color="warning"
                  disabled={!data.enabled}
                />
              }
              label={<Typography variant="body2">Allow for Requests</Typography>}
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

SpecialDealCard.propTypes = {
  data: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};