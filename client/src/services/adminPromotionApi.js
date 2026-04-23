import { API } from "./apis";

export const getPromotionSettings = () => {
  return API.get("/admin/promotions");
};

export const updatePromotionSettings = (data) => {
  return API.put("/admin/promotions", data);
};

export const getPromotionHistory = () => {
  return API.get("/admin/promotions/history");
};

export const getSubcategoryCommissions = () => {
  return API.get("/admin/promotions/subcategory-commission");
};