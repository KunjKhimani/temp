import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Stack,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import PercentIcon from "@mui/icons-material/Percent";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { communityCategories } from "../../../../../data/communityMenuData";
import { getSubcategoryCommissions } from "../../../../../services/adminPromotionApi";



/* ---------------- NUMBER FIELD ---------------- */
const NumberField = ({
  label,
  value,
  onChange,
  disabled,
  prefix,
  suffix,
  helperText,
  min = 0,
  max,
  error,
}) => (
  <TextField
    label={label}
    type="number"
    value={value ?? ""}
    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    size="small"
    fullWidth
    disabled={disabled}
    helperText={helperText}
    error={error}
    inputProps={{ min, max, step: 0.01 }}
    InputProps={{
      startAdornment: prefix ? (
        <InputAdornment position="start">{prefix}</InputAdornment>
      ) : undefined,
      endAdornment: suffix ? (
        <InputAdornment position="end">{suffix}</InputAdornment>
      ) : undefined,
    }}
  />
);

NumberField.propTypes = {
  label: PropTypes.string,
  value: PropTypes.number,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  prefix: PropTypes.string,
  suffix: PropTypes.string,
  helperText: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  error: PropTypes.bool,
};

/* ---------------- MAIN COMPONENT ---------------- */
export function CommissionForm({ data, onChange }) {
  const isPercentage = (data?.type || "percentage") === "percentage";
  
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [percentValue, setPercentValue] = useState(0);
  const [allSubCommissions, setAllSubCommissions] = useState([]);

  useEffect(() => {
    const fetchSubCommissions = async () => {
      try {
        const res = await getSubcategoryCommissions();
        setAllSubCommissions(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch subcategory commissions:", err);
      }
    };
    fetchSubCommissions();
  }, []);

  const handleSubcategoryChange = (subcategory) => {
    setSelectedSubcategory(subcategory);
    const existing = allSubCommissions.find(sc => sc.subcategory === subcategory);
    
    // Also check current unsaved data in state
    const currentInState = data.community?.subcategoryCommissions?.find(sc => sc.subcategory === subcategory);
    
    const value = currentInState?.lowCostPercent ?? existing?.lowCostPercent ?? 0;
    setPercentValue(value);
  };

  const updateSubcategoryCommission = (newPercent) => {
    setPercentValue(newPercent);
    const currentSubs = [...(data.community?.subcategoryCommissions || [])];
    const index = currentSubs.findIndex(sc => sc.subcategory === selectedSubcategory);
    
    if (index >= 0) {
      currentSubs[index] = { ...currentSubs[index], lowCostPercent: newPercent };
    } else {
      currentSubs.push({ subcategory: selectedSubcategory, lowCostPercent: newPercent });
    }
    
    onChange({
      ...data,
      community: {
        ...(data.community || {}),
        subcategoryCommissions: currentSubs
      }
    });
  };

  const subcategories = communityCategories.find(c => c.name === selectedCategory)?.subcategories || [];



  /* ---------------- VALIDATION ---------------- */
  const isInvalidLimit =
    data?.maximumCap !== undefined &&
    data?.minimumAmount !== undefined &&
    data.maximumCap < data.minimumAmount;

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

 const handleTypeChange = (_, newType) => {
  if (!newType) return;

  if (newType === "flat") {
    onChange({
      type: "flat",
      flatAmount: 0,
      minimumAmount: data.minimumAmount || 0,
      maximumCap: data.maximumCap || 0,
    });
  }

  if (newType === "percentage") {
    onChange({
      type: "percentage",
      standard: { offerPercent: 0, requestPercent: 0 },
      featured: { offerPercent: 0, requestPercent: 0 },
      specialDeal: { offerPercent: 0, requestPercent: 0 },
      community: { free: 0, donation: 0, lowCostPercent: 0 },
      minimumAmount: data.minimumAmount || 0,
      maximumCap: data.maximumCap || 0,
    });
  }
};


  const setField = (path) => (value) => {
    const keys = path.split(".");
    if (keys.length === 1) {
      onChange({ ...data, [keys[0]]: value });
    } else {
      onChange({
        ...data,
        [keys[0]]: { ...(data[keys[0]] || {}), [keys[1]]: value },
      });
    }
  };

  if (!data) return null;

  return (
    <Stack spacing={3}>
      {/* ---------------- TYPE ---------------- */}
      <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <CardHeader
          title={<Typography variant="h6" fontWeight={700}>Platform Fee Type</Typography>}
          subheader="Choose how platform fee is calculated"
        />
        <Divider />
        <CardContent>
          <ToggleButtonGroup
            value={data.type || "percentage"}
            exclusive
            onChange={handleTypeChange}
            size="small"
          >
            <ToggleButton value="percentage">
              <PercentIcon fontSize="small" sx={{ mr: 1 }} /> Percentage
            </ToggleButton>
            {/* <ToggleButton value="flat">
              <AttachMoneyIcon fontSize="small" sx={{ mr: 1 }} /> Flat Amount
            </ToggleButton> */}
          </ToggleButtonGroup>

          {!isPercentage && (
            <Box mt={2} maxWidth={240}>
              <NumberField
                label="Flat Amount per Transaction"
                value={data.flatAmount}
                onChange={setField("flatAmount")}
                prefix="$"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ---------------- LIMITS ---------------- */}
      <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <CardHeader
          title={<Typography variant="h6" fontWeight={700}>Limits</Typography>}
          subheader="Set minimum and maximum platform fee bounds"
        />
        <Divider />
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <NumberField
                label="Minimum Platform Fee"
                value={data.minimumAmount}
                onChange={setField("minimumAmount")}
                prefix="$"
                error={isInvalidLimit}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <NumberField
                label="Maximum Cap (0 = no cap)"
                value={data.maximumCap}
                onChange={setField("maximumCap")}
                prefix="$"
                error={isInvalidLimit}
                helperText={
                  isInvalidLimit
                    ? "Max cap must be ≥ minimum amount"
                    : "0 means no cap"
                }
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* ---------------- PERCENTAGE ---------------- */}
      <Collapse in={isPercentage}>
        <Stack spacing={2}>
          <CommissionSection
            title="Standard"
            subtitle="Platform fee for unpromoted listings"
            offerValue={data.standard?.offerPercent}
            requestValue={data.standard?.requestPercent}
            onOfferChange={setField("standard.offerPercent")}
            onRequestChange={setField("standard.requestPercent")}
          />

          <CommissionSection
            title="Featured"
            subtitle="Platform fee for featured listings"
            offerValue={data.featured?.offerPercent}
            requestValue={data.featured?.requestPercent}
            onOfferChange={setField("featured.offerPercent")}
            onRequestChange={setField("featured.requestPercent")}
          />

          <CommissionSection
            title="Special Deal"
            subtitle="Platform fee for special deal listings"
            offerValue={data.specialDeal?.offerPercent}
            requestValue={data.specialDeal?.requestPercent}
            onOfferChange={setField("specialDeal.offerPercent")}
            onRequestChange={setField("specialDeal.requestPercent")}
          />

          {/* COMMUNITY */}
          {/* COMMUNITY - COMMENTED OUT AS PER USER REQUEST */}
          {/* <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "success.light" }}>
            <CardHeader
              title={<Typography variant="h6" fontWeight={700}>Community</Typography>}
              subheader="Platform fee rates for community tiers"
            />
            <Divider />
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <NumberField
                  label="Free Tier (%)"
                  value={data.community?.free}
                  onChange={setField("community.free")}
                  suffix="%"
                  max={0}
                  helperText="Must be 0%"
                />
                <NumberField
                  label="Donation (%)"
                  value={data.community?.donation}
                  onChange={setField("community.donation")}
                  suffix="%"
                  max={100}
                />
                <NumberField
                  label="Low-Cost (%)"
                  value={data.community?.lowCostPercent}
                  onChange={setField("community.lowCostPercent")}
                  suffix="%"
                  max={100}
                />
              </Stack>
            </CardContent>
          </Card> */}

          {/* NEW SUBCATEGORY SPECIFIC COMMISSIONS CARD */}
          <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "primary.light" }}>
            <CardHeader
              title={<Typography variant="h6" fontWeight={700}>Subcategory Specific Commissions</Typography>}
              subheader="Set fee rates for specific subcategories"
            />
            <Divider />
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedSubcategory("");
                    }}
                  >
                    {communityCategories.map((cat) => (
                      <MenuItem key={cat.name} value={cat.name}>
                        {cat.name}
                      </MenuItem>
                    ))}

                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" disabled={!selectedCategory}>
                  <InputLabel>Subcategory</InputLabel>
                  <Select
                    value={selectedSubcategory}
                    label="Subcategory"
                    onChange={(e) => handleSubcategoryChange(e.target.value)}
                  >
                    {subcategories.map((sub) => (
                      <MenuItem key={sub} value={sub}>
                        {sub}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ minWidth: 150 }}>
                  <NumberField
                    label="Percentage (%)"
                    disabled={!selectedSubcategory}
                    value={percentValue}
                    onChange={(val) => updateSubcategoryCommission(val)}
                    suffix="%"
                    max={100}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>

        </Stack>
      </Collapse>
    </Stack>
  );
}

/* ---------------- SECTION COMPONENT ---------------- */
function CommissionSection({
  title,
  subtitle,
  offerValue,
  requestValue,
  onOfferChange,
  onRequestChange,
}) {
  return (
    <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
      <CardHeader
        title={<Typography variant="h6" fontWeight={700}>{title}</Typography>}
        subheader={subtitle}
      />
      <Divider />
      <CardContent>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <NumberField
            label="Offer Platform Fee (%)"
            value={offerValue}
            onChange={onOfferChange}
            suffix="%"
            max={100}
          />
          <NumberField
            label="Request Platform Fee (%)"
            value={requestValue}
            onChange={onRequestChange}
            suffix="%"
            max={100}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

CommissionSection.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  offerValue: PropTypes.number,
  requestValue: PropTypes.number,
  onOfferChange: PropTypes.func,
  onRequestChange: PropTypes.func,
};

CommissionForm.propTypes = {
  data: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};