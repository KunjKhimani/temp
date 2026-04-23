import { Box, Grid, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { PromotionCard } from "./PromotionCard";

export default function PromotionView() {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Promotion Pricing",
      description: "Manage pricing plans for featured, special deals, and community offers",
      path: "/admin/promotions/pricing",
      color: "primary",
    },
    {
      title: "Platform Fees",
      description: "Configure platform commission percentages and limits",
      path: "/admin/promotions/commission",
      color: "warning",
    },
    {
      title: "Promotion Rules",
      description: "Control eligibility, sorting, and expiration behavior",
      path: "/admin/promotions/rules",
      color: "info",
    },
    {
      title: "Homepage Controls",
      description: "Customize homepage sections and limits",
      path: "/admin/promotions/homepage",
      color: "success",
    },
    {
      title: "Promotion History",
      description: "View all changes made to promotion settings",
      path: "/admin/promotions/history",
      color: "secondary",
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={4}>
        Pricing & Promotions
      </Typography>

      <Grid container spacing={3}>
        {sections.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <PromotionCard
              {...item}
              onClick={() => navigate(item.path)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}