// src/routes/routes.js
import { lazy } from "react";
import Loadable from "../layouts/shared/loadable";
import { Navigate } from "react-router-dom";
import adminRoutes from "../admin/routes/adminRoutes";
// import FormCompletionGuard from "../components/FormCompletionGuard"; // Import FormCompletionGuard

// Layouts
const PublicLayout = Loadable(lazy(() => import("../layouts/publicLayout")));
const BlankLayout = Loadable(lazy(() => import("../layouts/blankLayout")));

// Auth views
const SignIn = Loadable(lazy(() => import("../views/Auth/signIn")));
const SignUp = Loadable(lazy(() => import("../views/Auth/signUp")));
const Error = Loadable(lazy(() => import("../views/Auth/Error")));
const VerifyEmailPage = Loadable(
  lazy(() => import("../views/Auth/VerifyEmailPage"))
);
const OfflinePage = Loadable(lazy(() => import("../views/Auth/OfflinePage")));

// Public views
const LandingPage = Loadable(
  lazy(() => import("../views/LandingPage/LandingPage"))
);
const HowItWorksPage = Loadable(
  lazy(() => import("../views/HowItWorks/HowItWorksPage"))
);
const Category = Loadable(lazy(() => import("../views/Category/category")));
const SubCategoryPage = Loadable(
  lazy(() => import("../views/SubCategory/SubCategory"))
);
const CategoryAndSubcategoryPage = Loadable(
  lazy(() => import("../views/Product/CategoryAndSubcategoryPage"))
);
const SpecialDealsPage = Loadable(
  lazy(() => import("../views/SpecialDeals/SpecialDealsPage"))
);
const SpecialDealDetailPage = Loadable(
  lazy(() => import("../views/SpecialDeals/SpecialDealDetailPage"))
);
const CommunityOffersPage = Loadable(
  lazy(() => import("../views/Community/CommunityOffersPage"))
);
const CommunityCategoryPage = Loadable(
  lazy(() => import("../views/Community/CommunityCategoryPage"))
);
// --- Service Related Views ---
const Service = Loadable(lazy(() => import("../views/Service/Service"))); // Single Service Detail
const AddService = Loadable(lazy(() => import("../views/Service/AddService")));
const EditServicePage = Loadable(
  lazy(() => import("../views/Service/EditServicePage"))
);
const GetServices = Loadable(
  lazy(() => import("../views/GetServices/GetServices")) // Marketplace Overview Page
);
const BrowseServicesPage = Loadable(
  lazy(() => import("../views/Service/BrowseServicesPage")) // General List & Search Results for Offered Services
);

// --- Payment & Order Related Views (Services) ---
const Payment = Loadable(lazy(() => import("../views/Payment/Payment")));
const Orders = Loadable(lazy(() => import("../views/Orders/Orders")));
const OrderDetailPage = Loadable(
  lazy(() => import("../views/OrderDetail/OrderDetailPage"))
);
const OrderCompleted = Loadable(
  lazy(() => import("../views/Payment/OrderCompleted"))
);

// --- Profile View ---
const Profile = Loadable(
  lazy(() => import("../views/Provider/Profile/Profile"))
);
const ProfileUpdate = Loadable(
  lazy(() => import("../views/ProfileUpdate/ProfileUpdate"))
);

// --- Generic Search/Explore (Consider if still needed with specific result pages) ---
// const Search = Loadable(lazy(() => import("../views/Search/Search"))); // Generic fallback
const Explore = Loadable(lazy(() => import("../views/Explore/Explore")));

// --- Static & Info Pages ---
const WhySparework = Loadable(
  lazy(() => import("../views/WhySparework/WhySparework"))
);
const Resources = Loadable(lazy(() => import("../views/Resources/Resources")));
const AboutUs = Loadable(lazy(() => import("../views/AboutUs/AboutUs")));
const TermsOfService = Loadable(lazy(() => import("../views/Terms/Terms")));
const PrivacyPolicy = Loadable(
  lazy(() => import("../views/PrivacyPolicy/PrivacyPolicy"))
);
const Partnership = Loadable(
  lazy(() => import("../views/Partnership/Partnership"))
);

// --- Messaging & Notifications ---
const MessagesPage = Loadable(
  lazy(() => import("../views/Messages/MessagesPage"))
);
const NotificationsPage = Loadable(
  lazy(() => import("../views/Notification/NotificationsPage"))
);

// --- Product Related Views ---
const ProductsListPage = Loadable(
  lazy(() => import("../views/Product/ProductsListPage")) // General List & Search Results for Products
);
const ProductDetailPage = Loadable(
  lazy(() => import("../views/Product/ProductDetailPage"))
);
const AddProduct = Loadable(lazy(() => import("../views/Product/AddProduct")));
const EditProduct = Loadable(
  lazy(() => import("../views/Product/EditProduct"))
);
const MyProducts = Loadable(lazy(() => import("../views/Product/MyProducts")));

// --- Requested Product Related Views ---
const BrowseRequestedProducts = Loadable(
  lazy(() => import("../views/RequestedProduct/BrowseRequestedProducts"))
);
const CreateRequestedProduct = Loadable(
  lazy(() => import("../views/RequestedProduct/CreateRequestedProduct"))
);
const RequestedProductDetailPage = Loadable(
  lazy(() => import("../views/RequestedProduct/RequestedProductDetailPage"))
);

// --- Product Order Related Views ---
const ProductOrdersListPage = Loadable(
  lazy(() => import("../views/ProductOrder/ProductOrdersListPage"))
);
const ProductOrderDetailPage = Loadable(
  lazy(() => import("../views/ProductOrder/ProductOrderDetailPage"))
);
const ProductOrderPaymentPage = Loadable(
  lazy(() => import("../views/ProductOrder/ProductOrderPaymentPage"))
);
const ProductOrderSuccessPage = Loadable(
  lazy(() => import("../views/ProductOrder/ProductOrderSuccessPage"))
);

// --- Service Request Related Views ---
const CreateServiceRequestPage = Loadable(
  lazy(() => import("../views/ServiceRequest/CreateServiceRequestPage"))
);

const PromoteRequestPaymentPage = Loadable(
  lazy(() => import("../views/Payment/PromoteRequestPaymentPage"))
);

const ServiceRequestPaymentPage = Loadable(
  lazy(() => import("../views/Payment/ServiceRequestPaymentPage"))
);

const PromotionPaymentStatusPage = Loadable(
  lazy(() => import("../views/Payment/PromotionPaymentStatusPage"))
);

const MyServiceRequestsPage = Loadable(
  lazy(() => import("../views/ServiceRequest/MyServiceRequestsPage"))
);
const BrowseServiceRequestsPage = Loadable(
  lazy(() => import("../views/ServiceRequest/BrowseServiceRequestsPage")) // General List & Search Results for Requested Services
);
const ServiceRequestDetailPage = Loadable(
  lazy(() => import("../views/ServiceRequest/ServiceRequestDetailPage"))
);
const EditServiceRequestPage = Loadable(
  lazy(() => import("../views/ServiceRequest/EditServiceRequestPage"))
);

// New Seller User Views
const SellerUsersPage = Loadable(
  lazy(() => import("../views/SellerUser/SellerUsersPage"))
);
const SellerUserDescription = Loadable(
  lazy(() => import("../views/SellerUser/SellerUserDescription"))
);

// Subscription Views
const SubscriptionPlan = Loadable(
  lazy(() => import("../views/Subscription/SubscriptionPlan"))
);
const SubscriptionPaymentPage = Loadable(
  lazy(() => import("../views/Payment/SubscriptionPaymentPage"))
);
const SubscriptionSuccessPage = Loadable(
  lazy(() => import("../views/Payment/SubscriptionSuccessPage"))
);

const routes = [
  {
    path: "/",
    element: (
      <PublicLayout />
      // <FormCompletionGuard>
      // </FormCompletionGuard>
    ),
    errorElement: <OfflinePage />, // Catch errors for all children of PublicLayout
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/how-it-works", element: <HowItWorksPage /> },
      { path: "/category/:category", element: <Category /> },
      {
        path: "/category/:category/:subcategory",
        element: <SubCategoryPage />,
      },
      { path: "/:category/:subcategory/:serviceId", element: <Service /> }, // Single Service Detail
      { path: "/service/:serviceId", element: <Service /> }, // New route for direct service detail access
      // --- Marketplace Overview & Specific Listing/Search Pages ---
      { path: "/services", element: <GetServices /> }, // Your main marketplace overview (GetServices.jsx)
      { path: "/services/browse", element: <BrowseServicesPage /> }, // "View All" / Search for Offered Services
      {
        path: "/service-requests/browse",
        element: <BrowseServiceRequestsPage />,
      }, // "View All" / Search for Requested Services
      { path: "/products", element: <ProductsListPage /> }, // "View All" / Search for Products
      {
        path: "/products/categories-overview",
        element: <CategoryAndSubcategoryPage />,
      },
      {
        path: "/community-offers",
        element: <CommunityOffersPage />,
      },
      {
        path: "/community-offers/categories",
        element: <CommunityCategoryPage />,
      },
      {
        path: "/special-deals",
        element: <SpecialDealsPage />,
      },
      {
        path: "/special-deals/:dealName",
        element: <SpecialDealDetailPage />,
      },
      // --- Requested Product Routes ---
      { path: "/requested-products", element: <BrowseRequestedProducts /> },
      {
        path: "/requested-products/create",
        element: <CreateRequestedProduct />,
      },
      {
        path: "/requested-products/:requestedProductId",
        element: <RequestedProductDetailPage />,
      },

      // --- Generic Search/Explore (Optional - can be removed if specific pages cover all needs) ---
      // { path: "/search", element: <Search /> }, // If you still want a generic search page
      { path: "/explore", element: <Explore /> }, // Keep if it serves a different purpose

      // --- Creation & Management Routes ---
      { path: "/provider/services/add", element: <AddService /> },
      { path: "/service/:serviceId/edit", element: <EditServicePage /> },
      { path: "/products/add", element: <AddProduct /> },
      { path: "/products/edit/:productId", element: <EditProduct /> },
      { path: "/user/my-products", element: <MyProducts /> },
      {
        path: "/service-requests/create",
        element: <CreateServiceRequestPage />,
      },
      {
        path: "/service-request/promote/payment",
        element: <PromoteRequestPaymentPage />,
      },

      {
        path: "/service-request/promote/status",
        element: <PromotionPaymentStatusPage />,
      },
      { path: "/user/my-service-requests", element: <MyServiceRequestsPage /> },
      {
        path: "/service-request/:requestId/edit",
        element: <EditServiceRequestPage />,
      },

      // --- Detail Pages ---
      { path: "/product/:productId", element: <ProductDetailPage /> },
      {
        path: "/service-request/:requestId",
        element: <ServiceRequestDetailPage />,
      },

      // --- Profile ---
      { path: "/provider/profile/:id", element: <Profile /> },
      { path: "/user/profile", element: <Profile /> }, // Assuming this might be the same component or a redirect
      { path: "/user/profile/edit", element: <ProfileUpdate /> },

      // --- Order & Payment Routes ---
      { path: "/user/orders", element: <Orders /> }, // Service Orders
      { path: "/user/orders/:orderId", element: <OrderDetailPage /> },
      { path: "/payments", element: <Payment /> }, // Service Payment
      {
        path: "/payment/service-request/:requestId",
        element: <ServiceRequestPaymentPage />,
      }, // New Service Request Payment Page
      { path: "/user/product-orders", element: <ProductOrdersListPage /> },
      {
        path: "/user/product-orders/:productOrderId",
        element: <ProductOrderDetailPage />,
      },
      {
        path: "/product-checkout/payment",
        element: <ProductOrderPaymentPage />,
      },

      // --- Static & Info Pages ---
      { path: "/why-sparework", element: <WhySparework /> },
      { path: "/resources", element: <Resources /> },
      { path: "/about-us", element: <AboutUs /> },
      { path: "/terms", element: <TermsOfService /> },
      { path: "/privacy", element: <PrivacyPolicy /> },
      { path: "/partnerships", element: <Partnership /> },

      // --- Communication ---
      { path: "/messages", element: <MessagesPage /> },
      { path: "/notifications", element: <NotificationsPage /> },

      // --- Seller User Routes ---
      { path: "/providers", element: <SellerUsersPage /> },
      { path: "/providers/:id", element: <SellerUserDescription /> },

      // --- Fallback for any unmatched public routes ---
      // Consider where you want unmatched routes within PublicLayout to go.
      // If they should go to the 404 in BlankLayout, this is fine.
      // If you want a specific 404 within PublicLayout, add it here.
      { path: "*", element: <Navigate to="/auth/404" replace /> }, // Redirect to a 404 page in BlankLayout
    ],
  },
  {
    path: "/auth",
    element: <BlankLayout />,
    children: [
      { path: "signin", element: <SignIn /> },
      { path: "signup", element: <SignUp /> },
      { path: "verify-email", element: <VerifyEmailPage /> },
      { path: "offline", element: <OfflinePage /> }, // New offline/unauthenticated page
      { path: "order/complete", element: <OrderCompleted /> }, // Service order success
      { path: "productOrder/complete", element: <ProductOrderSuccessPage /> }, // Product order success
      // --- Subscription Routes ---
      { path: "subscription-plan", element: <SubscriptionPlan /> },
      {
        path: "payment/subscription/:planId",
        element: <SubscriptionPaymentPage />,
      }, // New subscription payment route
      { path: "subscription/complete", element: <SubscriptionSuccessPage /> }, // New subscription success route
      { path: "404", element: <Error /> }, // Explicit 404 page
      { path: "*", element: <Error /> }, // Catch-all for /auth/*
    ],
  },
  adminRoutes, // Assuming adminRoutes defines its own layout and children
];

export default routes;
