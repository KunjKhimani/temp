const PromotionSettings = require("../model/promotionSettings.model");
const PricingHistory = require("../model/pricingHistory.model");
const { validatePromotionUpdate } = require("../validators");

/* ---------------- HELPERS ---------------- */

const isObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

/**
 * Deep merge (preserves nested structure)
 */
const mergeDeep = (target, source) => {
  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  const result = { ...target };

  Object.keys(source).forEach((key) => {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (isObject(sourceValue) && isObject(targetValue)) {
      result[key] = mergeDeep(targetValue, sourceValue);
    } else {
      result[key] = sourceValue;
    }
  });

  return result;
};

/**
 * Generate diff for history tracking
 */
const diffObjects = (oldObj, newObj) => {
  const changes = {};

  const keys = new Set([
    ...Object.keys(oldObj || {}),
    ...Object.keys(newObj || {}),
  ]);

  keys.forEach((key) => {
    const oldValue = oldObj ? oldObj[key] : undefined;
    const newValue = newObj ? newObj[key] : undefined;

    if (isObject(oldValue) && isObject(newValue)) {
      const nested = diffObjects(oldValue, newValue);
      if (Object.keys(nested).length > 0) {
        changes[key] = nested;
      }
    } else if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = { old: oldValue, new: newValue };
      }
    } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = { old: oldValue, new: newValue };
    }
  });

  return changes;
};

/* ---------------- CORE FUNCTIONS ---------------- */

/**
 * Ensure singleton settings document
 */
const ensureSettings = async () => {
  let settings = await PromotionSettings.findOne();

  if (!settings) {
    settings = await PromotionSettings.create({});
  }

  return settings;
};

/**
 * Update promotion settings
 */
const updateSettings = async (payload, adminId, notes) => {
  const settings = await ensureSettings();
  const oldSettings = settings.toObject();

  const sanitizedPayload = { ...payload };
  delete sanitizedPayload.notes;

  /* 🔥 FIX START */

  let mergedSettings = mergeDeep(oldSettings, sanitizedPayload);

  // 🚨 CRITICAL: override commission completely (no merge)
  if (sanitizedPayload.commission) {
    mergedSettings.commission = sanitizedPayload.commission;
  }

  /* 🔥 FIX END */

  // Validate AFTER fix
  try {
    validatePromotionUpdate(sanitizedPayload, oldSettings);
  } catch (err) {
    throw new Error(`Validation Error: ${err.message}`);
  }

  settings.set(mergedSettings);
  settings.updatedBy = adminId;

  await settings.save();

  const modifiedSettings = settings.toObject();
  const changes = diffObjects(oldSettings, modifiedSettings);

  if (Object.keys(changes).length > 0) {
    await PricingHistory.create({
      promotionType: "promotion-settings",
      changes,
      changedBy: adminId,
      notes: notes || "Admin updated promotion settings.",
    });
  }

  return settings;
};

/**
 * Get settings history
 */
const getHistory = async () => {
  return await PricingHistory.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
};

module.exports = {
  ensureSettings,
  updateSettings,
  getHistory,
};