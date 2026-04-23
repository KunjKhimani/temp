// src/utils/stringUtils.js
export const normalizeCategoryName = (name) => {
  if (!name) return "";
  return name.trim().toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-");
  // Example: "Graphics & Design" -> "graphics-and-design"
  // Example: "Companion Care" -> "companion-care"
  // Adjust the replace logic if your URL scheme is different (e.g., just lowercase, no hyphens)
};

export const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = seconds / 31536000; // years
  if (interval > 1) {
    return (
      Math.floor(interval) +
      " year" +
      (Math.floor(interval) === 1 ? "" : "s") +
      " ago"
    );
  }
  interval = seconds / 2592000; // months
  if (interval > 1) {
    return (
      Math.floor(interval) +
      " month" +
      (Math.floor(interval) === 1 ? "" : "s") +
      " ago"
    );
  }
  interval = seconds / 86400; // days
  if (interval > 1) {
    return (
      Math.floor(interval) +
      " day" +
      (Math.floor(interval) === 1 ? "" : "s") +
      " ago"
    );
  }
  interval = seconds / 3600; // hours
  if (interval > 1) {
    return (
      Math.floor(interval) +
      " hour" +
      (Math.floor(interval) === 1 ? "" : "s") +
      " ago"
    );
  }
  interval = seconds / 60; // minutes
  if (interval > 1) {
    return (
      Math.floor(interval) +
      " minute" +
      (Math.floor(interval) === 1 ? "" : "s") +
      " ago"
    );
  }
  return "just now";
};
