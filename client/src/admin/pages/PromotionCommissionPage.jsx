import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Box, Tabs, Tab, Container } from "@mui/material";
import CommissionView from "../sections/promotions/commission/CommissionView";
import SellerCommissionView from "../sections/promotions/seller-commission/SellerCommissionView";

export default function PromotionCommissionPage() {
  const [currentTab, setCurrentTab] = useState("platform_fees");

  const handleChangeTab = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <>
      <Helmet>
        <title> Fees & Commission | Admin </title>
      </Helmet>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ mb: 4, borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={currentTab} onChange={handleChangeTab}>
            <Tab label="Platform Fees" value="platform_fees" />
            <Tab label="Commission Settings" value="commission_settings" />
          </Tabs>
        </Box>

        {currentTab === "platform_fees" && <CommissionView />}
        {currentTab === "commission_settings" && <SellerCommissionView />}
      </Container>
    </>
  );
}