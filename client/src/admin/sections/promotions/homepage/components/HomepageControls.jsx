import PropTypes from "prop-types";
import {
  Box, Card, CardContent, CardHeader, Typography, Switch,
  FormControlLabel, TextField, Stack, Divider, Grid,
} from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";

export function HomepageControls({ data, onChange }) {
  if (!data) return null;

  const handleToggle = (field) => (e) => onChange({ ...data, [field]: e.target.checked });
  const handleText = (field) => (e) => onChange({ ...data, [field]: e.target.value });
  const handleNumber = (field) => (e) => {
    const val = parseInt(e.target.value);
    onChange({ ...data, [field]: isNaN(val) ? 0 : val });
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 860 }}>
      {/* Visibility */}
      <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <CardHeader
          avatar={
            <Box
              sx={{
                width: 40, height: 40, borderRadius: 2,
                bgcolor: "info.lighter",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <HomeOutlinedIcon sx={{ color: "info.main" }} />
            </Box>
          }
          title={<Typography variant="h6" fontWeight={700}>Section Visibility</Typography>}
          subheader="Control which promotion sections appear on the homepage"
        />
        <Divider />
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
            <FormControlLabel
              control={<Switch checked={data.showFeatured} onChange={handleToggle("showFeatured")} size="small" color="primary" />}
              label={<Typography variant="body2">Show Featured</Typography>}
            />
            <FormControlLabel
              control={<Switch checked={data.showSpecialDeals} onChange={handleToggle("showSpecialDeals")} size="small" color="warning" />}
              label={<Typography variant="body2">Show Special Deals</Typography>}
            />
            <FormControlLabel
              control={<Switch checked={data.showCommunityOffers} onChange={handleToggle("showCommunityOffers")} size="small" color="success" />}
              label={<Typography variant="body2">Show Community Offers</Typography>}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Limits */}
      <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <CardHeader
          title={<Typography variant="h6" fontWeight={700}>Display Limits</Typography>}
          subheader="Maximum number of items to show per section (max 100)"
        />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Featured Limit"
                type="number"
                value={data.featuredLimit ?? ""}
                onChange={handleNumber("featuredLimit")}
                size="small"
                fullWidth
                inputProps={{ min: 0, max: 100 }}
                disabled={!data.showFeatured}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Special Deals Limit"
                type="number"
                value={data.specialDealsLimit ?? ""}
                onChange={handleNumber("specialDealsLimit")}
                size="small"
                fullWidth
                inputProps={{ min: 0, max: 100 }}
                disabled={!data.showSpecialDeals}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Community Offers Limit"
                type="number"
                value={data.communityOffersLimit ?? ""}
                onChange={handleNumber("communityOffersLimit")}
                size="small"
                fullWidth
                inputProps={{ min: 0, max: 100 }}
                disabled={!data.showCommunityOffers}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Section Titles */}
      <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <CardHeader
          title={<Typography variant="h6" fontWeight={700}>Section Titles</Typography>}
          subheader="Customize displayed section headings"
        />
        <Divider />
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Featured Section Title"
              value={data.featuredSectionTitle || ""}
              onChange={handleText("featuredSectionTitle")}
              size="small"
              fullWidth
              disabled={!data.showFeatured}
              inputProps={{ maxLength: 100 }}
              helperText={`${(data.featuredSectionTitle || "").length}/100`}
            />
            <TextField
              label="Special Deals Section Title"
              value={data.specialDealsSectionTitle || ""}
              onChange={handleText("specialDealsSectionTitle")}
              size="small"
              fullWidth
              disabled={!data.showSpecialDeals}
              inputProps={{ maxLength: 100 }}
              helperText={`${(data.specialDealsSectionTitle || "").length}/100`}
            />
            <TextField
              label="Community Offers Section Title"
              value={data.communityOffersSectionTitle || ""}
              onChange={handleText("communityOffersSectionTitle")}
              size="small"
              fullWidth
              disabled={!data.showCommunityOffers}
              inputProps={{ maxLength: 100 }}
              helperText={`${(data.communityOffersSectionTitle || "").length}/100`}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Descriptions */}
      <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <CardHeader
          title={<Typography variant="h6" fontWeight={700}>Section Descriptions</Typography>}
          subheader="Subtitle text shown below each section heading"
        />
        <Divider />
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Special Deals Description"
              value={data.specialDealsDescription || ""}
              onChange={handleText("specialDealsDescription")}
              size="small"
              fullWidth
              multiline
              rows={3}
              disabled={!data.showSpecialDeals}
            />
            <TextField
              label="Community Offers Description"
              value={data.communityOffersDescription || ""}
              onChange={handleText("communityOffersDescription")}
              size="small"
              fullWidth
              multiline
              rows={3}
              disabled={!data.showCommunityOffers}
            />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

HomepageControls.propTypes = {
  data: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};