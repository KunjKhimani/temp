import { API } from "./apis";

const getUserAnalytics = () => API.get("/user-analytics/analytics");
const getConversationAnalytics = () =>
  API.get("/conversation-analytics/analytics");
const getMessageAnalytics = () => API.get("/message-analytics/analytics");
const getServiceRequestAnalytics = () =>
  API.get("/service-request-analytics/analytics");
const getServiceAnalytics = () => API.get("/service-analytics/analytics");
const getProductAnalytics = () => API.get("/product-analytics/analytics");
const getOrderAnalytics = () => API.get("/order-analytics/analytics");
const getProductOrderAnalytics = () =>
  API.get("/product-order-analytics/analytics");

export {
  getUserAnalytics,
  getConversationAnalytics,
  getMessageAnalytics,
  getServiceRequestAnalytics,
  getServiceAnalytics,
  getProductAnalytics,
  getOrderAnalytics,
  getProductOrderAnalytics,
};
