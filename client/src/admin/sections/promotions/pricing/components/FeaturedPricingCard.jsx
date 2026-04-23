import PropTypes from "prop-types";
import {
  Box, Card, CardContent, CardHeader, Typography, Switch,
  FormControlLabel, TextField, IconButton, Stack, Chip, Divider, Tooltip,
} from "@mui/material";
import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { PlanDialog } from "./PlanDialog";

export function FeaturedPricingCard({ data, onChange }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const handleToggle = (field) => (e) => onChange({ ...data, [field]: e.target.checked });

  const handleSavePlan = (planData) => {
    if (editingIndex !== null) {
      const updatedPlans = data.plans.map((p, i) => (i === editingIndex ? planData : p));
      onChange({ ...data, plans: updatedPlans });
    } else {
      onChange({ ...data, plans: [...(data.plans || []), planData] });
    }
    setDialogOpen(false);
    setEditingIndex(null);
  };

  const handleOpenDialog = (index = null) => {
    setEditingIndex(index);
    setDialogOpen(true);
  };

  const handleRemovePlan = (index) => {
    onChange({ ...data, plans: data.plans.filter((_, i) => i !== index) });
  };

  return (
    <Card
  sx={{
    borderRadius: 3,
    border: "1px solid",
    borderColor: data.enabled ? "success.light" : "divider",
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
              bgcolor: "primary.lighter",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <StarBorderIcon sx={{ color: "primary.main" }} />
          </Box>
        }
        title={<Typography variant="h6" fontWeight={700}>Featured Listings</Typography>}
        subheader="Boost visibility with featured placement"
        action={
          <FormControlLabel
            control={<Switch checked={data.enabled} onChange={handleToggle("enabled")} color="primary" size="small" />}
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

    "&::-webkit-scrollbar": {
      width: 6,
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "#ccc",
      borderRadius: 10,
    },
  }}
>
        <Stack spacing={3}>
          <TextField
            label="Badge Label"
            value={data.badgeLabel || ""}
            onChange={(e) => onChange({ ...data, badgeLabel: e.target.value })}
            size="small"
            fullWidth
            disabled={!data.enabled}
          />
          <FormControlLabel
            control={
              <Switch
                checked={data.allowStacking}
                onChange={handleToggle("allowStacking")}
                size="small"
                disabled={!data.enabled}
              />
            }
            label={<Typography variant="body2">Allow Stacking</Typography>}
          />
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Typography variant="subtitle2" color="text.secondary" letterSpacing={0.5}>
                PRICING PLANS
              </Typography>
              <Tooltip title="Add Plan">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog()}
                    disabled={!data.enabled || (data.plans || []).length >= 10}
                    sx={{ bgcolor: "primary.lighter", "&:hover": { bgcolor: "primary.light" } }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
            <Stack spacing={1.5}>
              {(data.plans || []).map((plan, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.neutral",
                    "&:hover": { borderColor: "primary.main" },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ minWidth: 60 }}>
                        {plan.durationMonths} Mo.
                      </Typography>
                      <Divider orientation="vertical" flexItem />
                      <Typography variant="body2" fontWeight={600}>
                        ${Number(plan.price).toFixed(2)}
                      </Typography>
                    </Stack>

                    {Array.isArray(plan.description) &&
                      plan.description.filter((d) => d.trim()).length > 0 && (
                      <Tooltip
                        title={
                          Array.isArray(plan.description)
                            ? plan.description.join("\n")
                            : plan.description
                        }
                      >
                         <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            maxWidth: 100,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontStyle: "italic",
                          }}
                        >
                          {Array.isArray(plan.description)
                            ? plan.description.filter((d) => d.trim()).join(" • ")
                            : plan.description}
                        </Typography>
                      </Tooltip>
                    )}

                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Edit">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(index)}
                            disabled={!data.enabled}
                            sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Remove">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleRemovePlan(index)}
                            disabled={!data.enabled || data.plans.length <= 1}
                            sx={{ color: "error.main" }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      </CardContent>

      <PlanDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSavePlan}
        planToEdit={editingIndex !== null ? data.plans[editingIndex] : null}
        title={editingIndex !== null ? "Edit Featured Plan" : "Add Featured Plan"}
      />
    </Card>
  );
}

FeaturedPricingCard.propTypes = {
  data: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};