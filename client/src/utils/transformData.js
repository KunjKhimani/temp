/* ---------------- DEEP MERGE ---------------- */
export const mergeDeep = (target, source) => {
  if (!source) return target;

  const output = { ...target };

  Object.keys(source).forEach((key) => {
    if (typeof source[key] === "object" && source[key] !== null) {
      output[key] = mergeDeep(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  });

  return output;
};

/* ---------------- FORMATTERS ---------------- */
export const formatCurrency = (val) =>
  val === null || val === undefined ? "-" : `$${Number(val).toFixed(2)}`;

export const formatPercent = (val) =>
  val === null || val === undefined ? "-" : `${val}%`;

export const formatDate = (date) =>
  new Date(date).toLocaleString();

/* ---------------- CHANGE SUMMARY ---------------- */
export const summarizeChanges = (changes, prefix = "", visited = new Set()) => {
  let result = [];

  if (!changes || typeof changes !== "object") return result;

  // 🚫 Prevent circular reference
  if (visited.has(changes)) return result;
  visited.add(changes);

  Object.keys(changes).forEach((key) => {
    const value = changes[key];
    const path = prefix ? `${prefix}.${key}` : key;

    // ✅ Case 1: Proper diff object
    if (
      value &&
      typeof value === "object" &&
      "old" in value &&
      "new" in value
    ) {
      result.push({
        field: path,
        old: value.old,
        new: value.new,
      });
    }

    // ✅ Case 2: Nested object → recurse
    else if (value && typeof value === "object" && !Array.isArray(value)) {
      result = result.concat(summarizeChanges(value, path, visited));
    }

    // ✅ Case 3: Primitive fallback (optional)
    else {
      result.push({
        field: path,
        old: "-",
        new: value,
      });
    }
  });

  return result;
};