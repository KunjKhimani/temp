/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
// Removed SvgColor imports and related code

// --- Import desired icons from react-icons ---
// Choose icons that best match your originals visually or semantically
import {
  // FiUser, // Example alternative
  IoPersonOutline, // Using IoPersonOutline for User
  // HiOutlineBuildingOffice2, // Example alternative
  IoAnalyticsOutline, // Using IoAnalyticsOutline for Orders
  // BsChatDots, // Example alternative
  IoDocumentTextOutline, // Using IoDocumentTextOutline for Overview
  // IoNotificationsOutline, // Example for commented out Notifications
  // FiSettings // Example for commented out Settings
} from "react-icons/io5";
import {
  FiMessageSquare,
  FiShoppingCart,
  FiPackage,
  FiTool,
  FiTag,
} from "react-icons/fi";
import { RiMoneyRupeeCircleLine } from "react-icons/ri";
import { BsChatDotsFill } from "react-icons/bs"; //alternative for message
import { MdOutlineWorkspaces, MdOutlineDashboard, MdRateReview } from "react-icons/md"; // Using MdOutlineWorkspaces for Services

// The <Label> component import might be needed if you uncomment the info part
// import Label from "../components/label/label";

// The `icon` helper function is no longer needed
// const icon = (src) => <SvgColor width="100%" height="100%" src={src} />;

export const navData = [
  {
    title: "Dashboard",
    path: "/admin",
    icon: <MdOutlineDashboard size={22} />,
  },
  {
    title: "Users",
    path: "/admin/users",
    icon: <IoPersonOutline size={22} />,
  },

  // 🔥 NEW SECTION
  {
    title: "Pricing & Promotions",
    path: "/admin/promotions",
    icon: <RiMoneyRupeeCircleLine size={22} />,
    children: [
      {
        title: "Promotion Pricing",
        path: "/admin/promotions/pricing",
      },
      {
        title: "Platform Fees",
        path: "/admin/promotions/commission",
      },
      {
        title: "Promotion Rules",
        path: "/admin/promotions/rules",
      },
      {
        title: "Homepage Controls",
        path: "/admin/promotions/homepage",
      },
      {
        title: "Pricing History",
        path: "/admin/promotions/history",
      },
    ],
  },
  {
    title: "Promo Code",
    path: "/admin/promo-codes",
    icon: <FiTag size={22} />,
  },

  {
    title: "Services",
    path: "/admin/services",
    icon: <MdOutlineWorkspaces size={22} />,
  },
  {
    title: "Service Orders",
    path: "/admin/orders",
    icon: <IoAnalyticsOutline size={22} />,
  },
  {
    title: "Service Requests",
    path: "/admin/service-requests",
    icon: <FiTool size={22} />,
  },
  {
    title: "Products",
    path: "/admin/products",
    icon: <FiShoppingCart size={22} />,
  },
  {
    title: "Product Requests",
    path: "/admin/requested-products",
    icon: <RiMoneyRupeeCircleLine size={22} />,
  },
  {
    title: "Revenue Overview",
    path: "/admin/revenue",
    icon: <FiPackage size={22} />,
  },
  {
    title: "Conversations",
    path: "/admin/conversations",
    icon: <FiMessageSquare size={22} />,
  },
  {
    title: "Reviews",
    path: "/admin/reviews",
    icon: <MdRateReview size={22} />,
  },
  {
    title: "Overview",
    path: "/admin/overview",
    icon: <IoDocumentTextOutline size={22} />,
  },
];
