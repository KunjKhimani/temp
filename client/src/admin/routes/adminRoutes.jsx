// src/admin/routes/adminRoutes.js

import { lazy, Suspense } from "react";
import { Box, LinearProgress, linearProgressClasses } from "@mui/material";
import { Outlet } from "react-router-dom";
import { DashboardLayout } from "../layouts/dashboard/layout";
import { varAlpha } from "../theme/styles";
import IsAdmin from "./IsAdmin";

// Lazy-loaded pages
// Existing pages
const HomePage = lazy(() => import("../pages/index"));
const UserPage = lazy(() => import("../pages/user"));
const ServicePage = lazy(() => import("../pages/service"));
const OrdersPage = lazy(() => import("../pages/ServiceOrdersPage"));
const ConversationsPage = lazy(() => import("../pages/conversation"));
const OverviewPage = lazy(() => import("../pages/overview"));
const DashboardPage = lazy(() => import("../sections/dashboard/Dashboard"));
const ServiceRequestsPage = lazy(() => import("../pages/ServiceRequestsPage"));
const ProductsPage = lazy(() => import("../pages/ProductsPage"));
const ProductRequestsPage = lazy(() => import("../pages/ProductRequestsPage"));
const RequestedProductPage = lazy(() =>
  import("../pages/RequestedProductPage")
);
const RevenuePage = lazy(() => import("../pages/RevenuePage"));
const AddUserPage = lazy(() => import("../pages/addUser"));
const ReviewsPage = lazy(() => import("../pages/ReviewsPage"));

// 🔥 NEW PROMOTION PAGES
const PromotionPage = lazy(() => import("../pages/PromotionPage"));
const PricingPage = lazy(() => import("../pages/PromotionPricingPage"));
const CommissionPage = lazy(() => import("../pages/PromotionCommissionPage"));
const RulesPage = lazy(() => import("../pages/PromotionRulesPage"));
const HomepagePage = lazy(() => import("../pages/PromotionHomepagePage"));
const HistoryPage = lazy(() => import("../pages/PromotionHistoryPage"));
const PromoCodePage = lazy(() => import("../pages/PromotionPromoCodePage"));

const renderFallback = (
  <Box display="flex" alignItems="center" justifyContent="center" flex="1 1 auto">
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) =>
          varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: "text.primary" },
      }}
    />
  </Box>
);

const adminRoutes = {
  path: "/admin",
  element: <IsAdmin />,
  children: [
    {
      element: (
        <DashboardLayout>
          <Suspense fallback={renderFallback}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      ),
      children: [
        { index: true, element: <HomePage /> },

        { path: "users", element: <UserPage /> },
        { path: "users/add-user", element: <AddUserPage /> },
        { path: "users/edit-user/:id", element: <AddUserPage /> },

        { path: "services", element: <ServicePage /> },
        { path: "orders", element: <OrdersPage /> },
        { path: "service-requests", element: <ServiceRequestsPage /> },
        { path: "products", element: <ProductsPage /> },
        { path: "product-requests", element: <ProductRequestsPage /> },
        { path: "requested-products", element: <RequestedProductPage /> },
        { path: "conversations", element: <ConversationsPage /> },
        { path: "overview", element: <OverviewPage /> },
        { path: "dashboard", element: <DashboardPage /> },
        { path: "revenue", element: <RevenuePage /> },
        { path: "reviews", element: <ReviewsPage /> },

        // 🔥 NEW ROUTES
        { path: "promotions", element: <PromotionPage /> },
        { path: "promotions/pricing", element: <PricingPage /> },
        { path: "promotions/commission", element: <CommissionPage /> },
        { path: "promotions/rules", element: <RulesPage /> },
        { path: "promotions/homepage", element: <HomepagePage /> },
        { path: "promotions/history", element: <HistoryPage /> },
        { path: "promo-codes", element: <PromoCodePage /> },
      ],
    },
  ],
};

export default adminRoutes;
