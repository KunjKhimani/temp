// src/hooks/useTableSelection.js (Renamed for clarity)

import { useState, useCallback } from "react";

export function useTableSelection(initialSelected = []) {
  const [selected, setSelected] = useState(initialSelected);

  const onSelectAllRows = useCallback((checked, rows) => {
    // rows should be the array of items currently displayed (e.g., allUsers from Redux)
    if (checked) {
      const newSelecteds = rows.map((row) => row._id); // Select by ID
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  }, []);

  const onSelectRow = useCallback(
    (rowId) => {
      // Expecting the row ID (_id)
      const newSelected = selected.includes(rowId)
        ? selected.filter((id) => id !== rowId)
        : [...selected, rowId];
      setSelected(newSelected);
    },
    [selected]
  );

  // Function to reset selection manually if needed
  const resetSelected = useCallback(() => {
    setSelected([]);
  }, []);

  return {
    selected, // Array of selected row IDs
    onSelectRow, // Function to handle single row selection toggle
    onSelectAllRows, // Function to handle select/deselect all
    setSelected, // Function to set selected state directly (e.g., after delete)
    resetSelected, // Function to clear selection
  };
}
